// Penalty System: Four-Tier Graduated Penalties (§13.1, §13.5, §12.4)
// Tier 1: Warning (written warning logged)
// Tier 2: Fine (100% to Rider Welfare Fund)
// Tier 3: Suspension (1-4 consecutive rounds, forfeits points/purse)
// Tier 4: Charter Revocation (charter permanently revoked, riders become free agents)
//
// Discipline-Specific Penalties:
// GP: Grid penalties (position loss), concession tier deduction, development token revocation
// SBK: Grid penalties (race-specific), ballast manipulation, BoP violation fines

import type { CharterPenalty, PenaltyTier, PenaltyReason, Rider, Team, RiderWelfareFund } from '../data/types';

let penaltySeq = 0;

// Minimal state interface for penalty operations (avoids circular imports)
interface PenaltyState {
  round: number;
  universe: { riders: Record<string, Rider> };
  messages: string[];
  welfareFund: RiderWelfareFund;
}

/**
 * Issue a penalty to a team. Automatically determines tier based on reason
 * and applies consequences.
 */
export function issuePenalty(
  team: Team,
  reason: PenaltyReason,
  currentRound: number,
  tier?: PenaltyTier,
  suspensionRounds?: number,
  rider?: Rider,
): CharterPenalty {
  // Auto-determine tier if not specified
  const resolvedTier: PenaltyTier = tier ?? autoTier(reason);
  const fineAmount = resolveFineAmount(resolvedTier, reason);
  // §13.1 Tier 3: barred from 1-4 consecutive rounds
  const suspRounds = resolvedTier === 3
    ? Math.max(1, Math.min(4, suspensionRounds ?? 1))
    : undefined;

  const penalty: CharterPenalty = {
    id: `p${penaltySeq++}`,
    issuedRound: currentRound,
    tier: resolvedTier,
    reason,
    description: describeReason(reason),
    fineAmount,
    suspensionRounds: suspRounds,
    suspensionStart: suspRounds ? currentRound + 1 : undefined,
  };

  team.penalties.push(penalty);

  // Apply immediate consequences
  if (resolvedTier === 3 && rider) {
    // §13.1 Tier 3: the offending rider is barred from the next 1-4 rounds.
    // gridOf() excludes suspended riders and promotes a bench substitute.
    rider.suspendedForRounds = Math.max(rider.suspendedForRounds ?? 0, suspRounds!);
    penalty.affectedRiders = [rider.id];
  } else if (resolvedTier === 4) {
    // Tier 4: Charter Revocation (permanent)
    team.charterRevoked = true;
  }

  return penalty;
}

/**
 * Apply charter revocation consequences (§13.1 Tier 4).
 * Riders become free agents; team cannot compete.
 */
export function applyCharterRevocation(state: PenaltyState, team: Team): void {
  if (!team.charterRevoked) return;

  // Release all riders to free agency
  const rosterRiders = Object.values(state.universe.riders).filter(r => r.teamId === team.id);
  for (const rider of rosterRiders) {
    rider.teamId = null;
    rider.classId = null;
    rider.bench = false;
    state.messages.unshift(
      `🚫 CHARTER REVOKED: ${rider.name} released to free agency (${team.name} charter permanently revoked).`,
    );
  }

  state.messages.unshift(
    `❌ CHARTER REVOCATION: ${team.name} permanently revoked. Team may no longer compete in the championship.`,
  );
}

/**
 * Collect fines to the Rider Welfare Fund (§13.5).
 */
export function collectFines(state: PenaltyState, team: Team, currentRound: number): number {
  let totalCollected = 0;

  for (const penalty of team.penalties) {
    if (penalty.tier === 2 && penalty.fineAmount && penalty.issuedRound === currentRound) {
      const fine = penalty.fineAmount;
      totalCollected += fine;

      state.welfareFund.totalAccumulated += fine;
      state.welfareFund.fineHistory.push({
        round: currentRound,
        teamId: team.id,
        amount: fine,
        reason: penalty.description,
      });

      // Deduct from team budget
      team.budget = Math.max(0, team.budget - fine);
    }
  }

  return totalCollected;
}

/**
 * Check if a rider is suspended for a given round.
 */
export function isRiderSuspended(rider: Rider, round: number): boolean {
  if (!rider.suspendedForRounds || rider.suspendedForRounds <= 0) return false;
  return true;
}

/**
 * Decrement suspension countdown per round (call at end of race).
 */
export function decrementSuspensions(state: PenaltyState): void {
  for (const rider of Object.values(state.universe.riders)) {
    if (rider.suspendedForRounds && rider.suspendedForRounds > 0) {
      rider.suspendedForRounds--;
      if (rider.suspendedForRounds === 0) {
        state.messages.unshift(`${rider.name} suspension lifted. Eligible to race next round.`);
      }
    }
  }
}

/**
 * Track a terminal technical violation per the §12.4 table:
 * - Ballast Manipulation (deliberate): Tier 3 Charter Violation — financial
 *   penalty, public notice, Commission review. SECOND offense = Tier 4.
 * - Non-Homologated Engine / Displacement Limit: DQ from round, ALL round
 *   points forfeited (point-stripping is the caller's job via
 *   pointsForfeitedByRound), Commission review within 14 days.
 */
export function trackTerminalViolation(
  team: Team,
  reason: 'ballast-manipulation' | 'non-homologated-engine' | 'technical-violation',
  currentRound: number,
  affectedRiders?: string[],
): CharterPenalty {
  let tier: PenaltyTier;
  let suspensionRounds: number | undefined;

  if (reason === 'ballast-manipulation') {
    // §12.4: second deliberate ballast offense escalates to Tier 4.
    const priorOffenses = team.penalties.filter(p => p.reason === 'ballast-manipulation').length;
    tier = priorOffenses >= 1 ? 4 : 3;
    suspensionRounds = tier === 3 ? 1 : undefined;
  } else if (reason === 'non-homologated-engine') {
    // §12.4: DQ + zero round points. Recorded as a Tier 2 charter entry so the
    // fine reaches the Welfare Fund; the DQ itself is the real consequence.
    tier = 2;
  } else {
    tier = 3;
    suspensionRounds = 1;
  }

  const penalty = issuePenalty(team, reason, currentRound, tier, suspensionRounds);

  // Mark as terminal violation
  penalty.isTerminalViolation = true;
  penalty.affectedRiders = affectedRiders ?? [];
  penalty.pointsForfeitedByRound = {};

  if (reason === 'ballast-manipulation' && tier === 3) {
    // §12.4: Tier 3 charter violation carries a financial penalty on top of
    // the §13.1 suspension. 100% flows to the Welfare Fund (§13.5).
    penalty.fineAmount = 75_000;
  }

  return penalty;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Auto-determine tier based on reason (§13.1).
 */
function autoTier(reason: PenaltyReason): PenaltyTier {
  switch (reason) {
    case 'aggressive-riding':
    case 'reckless-conduct':
      return 1; // Warning
    case 'unsportsmanlike':
    case 'rules-infraction':
    case 'pit-lane-infraction':
      return 2; // Fine
    case 'ballast-manipulation':
    case 'driver-aid-violation':
      return 3; // Suspension
    case 'non-homologated-engine':
    case 'technical-violation':
      return 2; // Fine for non-hom; Tier 3 for deliberate ballast
    default:
      return 1;
  }
}

/**
 * Resolve fine amount based on tier and reason.
 */
function resolveFineAmount(tier: PenaltyTier, reason: PenaltyReason): number | undefined {
  if (tier !== 2) return undefined;

  // Tier 2 fines: proportional to severity
  switch (reason) {
    case 'unsportsmanlike':
      return 25_000;
    case 'rules-infraction':
      return 15_000;
    case 'pit-lane-infraction':
      return 10_000;
    case 'non-homologated-engine':
      return 50_000; // Severe
    default:
      return 10_000;
  }
}

/**
 * Human-readable description of penalty reason.
 */
function describeReason(reason: PenaltyReason): string {
  const map: Record<PenaltyReason, string> = {
    'aggressive-riding': 'Aggressive riding',
    'reckless-conduct': 'Reckless conduct',
    'unsportsmanlike': 'Unsportsmanlike conduct',
    'ballast-manipulation': 'Deliberate ballast manipulation',
    'non-homologated-engine': 'Non-homologated engine',
    'technical-violation': 'Technical violation',
    'rules-infraction': 'Rules infraction',
    'pit-lane-infraction': 'Pit-lane infraction',
    'driver-aid-violation': 'Banned driver aid detected',
  };
  return map[reason];
}

// ============================================================================
// DISCIPLINE-SPECIFIC PENALTIES (GP, SBK)
// ============================================================================

/**
 * Apply a grid penalty for MotoGP (§10.2: qualifying penalties, race start penalties).
 * Rider loses N grid positions in next race session.
 */
export function applyGPGridPenalty(
  rider: Rider,
  positions: number,
  reason: 'qualifying-violation' | 'unsafe-practice' | 'technical-infraction',
  currentRound: number,
): void {
  if (!rider.gridPenaltyPositions) rider.gridPenaltyPositions = 0;
  rider.gridPenaltyPositions += positions;
}

/**
 * Apply development token penalty for MotoGP concession tier violation.
 * Reduces available development tokens for next round.
 */
export function applyGPConcessionPenalty(
  team: Team,
  tokensRevoked: number,
  reason: 'cost-cap-violation' | 'concession-tier-infraction',
  currentRound: number,
  universe?: any,
): void {
  const penalty = issuePenalty(team, 'technical-violation', currentRound, 2, undefined);
  penalty.description = `GP Concession violation: ${tokensRevoked} development token(s) revoked (${reason})`;
  penalty.fineAmount = 50_000 * tokensRevoked;

  // Update universe extension if available
  if (universe?.champExtension?.discipline === 'gp') {
    const manufacturerIds = Object.values(team).filter((v: any) => typeof v === 'string' && v.startsWith('m'));
    for (const mfgId of manufacturerIds) {
      if (universe.champExtension.developmentTokensUsed[mfgId] !== undefined) {
        universe.champExtension.developmentTokensUsed[mfgId] += tokensRevoked;
      }
    }
  }
}

/**
 * Apply SBK-specific ballast manipulation penalty.
 * Higher severity than road racing due to safety criticality.
 */
export function applySBKBallastViolation(
  team: Team,
  currentRound: number,
): void {
  const penalty = issuePenalty(team, 'ballast-manipulation', currentRound, 3, 2);
  penalty.description = 'SBK Ballast manipulation detected: 2-round suspension + mandatory scrutineering';
  penalty.fineAmount = 75_000;
}

/**
 * Apply SBK BoP violation penalty (fuel flow, air restrictor, rpm limit).
 * Can result in disqualification from race or grid penalty for next race.
 */
export function applySBKBoPViolation(
  team: Team,
  violation: 'fuel-flow' | 'air-restrictor' | 'rpm-limit' | 'min-weight',
  currentRound: number,
  severity: 'minor' | 'major',
): void {
  const tier: PenaltyTier = severity === 'minor' ? 2 : 3;
  const suspRounds = severity === 'major' ? 1 : undefined;
  const penalty = issuePenalty(team, 'technical-violation', currentRound, tier, suspRounds);
  penalty.description = `SBK BoP violation (${violation}): ${severity} infraction`;
  penalty.fineAmount = severity === 'minor' ? 25_000 : 100_000;
}

/**
 * Apply Race 2 grid reversal penalty for SBK (when top-6 from Race 1 grid is compromised).
 * Rider is moved to back of grid for Race 2.
 */
export function applySBKRace2GridPenalty(rider: Rider, currentRound: number): void {
  if (!rider.race2GridPenalty) rider.race2GridPenalty = 0;
  rider.race2GridPenalty = 1; // Flag for Race 2 grid move
}
