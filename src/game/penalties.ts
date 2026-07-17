// Penalty System: Four-Tier Graduated Penalties (§13.1, §13.5, §12.4)
// Tier 1: Warning (written warning logged)
// Tier 2: Fine (100% to Rider Welfare Fund)
// Tier 3: Suspension (1-4 consecutive rounds, forfeits points/purse)
// Tier 4: Charter Revocation (charter permanently revoked, riders become free agents)

import type { Penalty, PenaltyTier, PenaltyReason, Rider, Team, RiderWelfareFund } from '../data/types';

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
): Penalty {
  // Auto-determine tier if not specified
  const resolvedTier: PenaltyTier = tier ?? autoTier(reason);
  const fineAmount = resolveFineAmount(resolvedTier, reason);
  const suspRounds = suspensionRounds ?? (resolvedTier === 3 ? 1 : undefined);

  const penalty: Penalty = {
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
  if (resolvedTier === 1) {
    // Tier 1: Warning only, logged
  } else if (resolvedTier === 2) {
    // Tier 2: Fine paid to welfare fund (handled by caller in economy.ts)
  } else if (resolvedTier === 3) {
    // Tier 3: Suspension (handled by caller when running race)
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
 * Track a terminal technical violation (§12.4).
 * Examples: Ballast manipulation, non-homologated engine, rule breach.
 */
export function trackTerminalViolation(
  team: Team,
  reason: 'ballast-manipulation' | 'non-homologated-engine' | 'technical-violation',
  currentRound: number,
  affectedRiders?: string[],
): Penalty {
  const tier: PenaltyTier =
    reason === 'ballast-manipulation' ? 3 :  // Tier 3 suspension
    reason === 'non-homologated-engine' ? 2 : // Tier 2 DQ + fine
    3; // Default to Tier 3

  const penalty = issuePenalty(team, reason, currentRound, tier, 1);

  // Mark as terminal violation
  penalty.isTerminalViolation = true;
  penalty.affectedRiders = affectedRiders ?? [];
  penalty.pointsForfeitedByRound = {};

  return penalty;
}

/**
 * Apply disqualification to riders for a technical violation.
 * Forfeits all points earned in the affected round.
 */
export function applyDisqualification(
  state: PenaltyState,
  rider: Rider,
  riderPointsThisRound: number,
  currentRound: number,
): void {
  if (!rider.teamId) return;

  const team = state.universe.riders[rider.id]?.teamId
    ? state.universe.riders[rider.id]
    : null;

  if (!team) return;

  state.messages.unshift(
    `🚫 DISQUALIFIED: ${rider.name} (${team}) forfeited all ${riderPointsThisRound} points from Round ${currentRound + 1} due to technical violation.`
  );
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
