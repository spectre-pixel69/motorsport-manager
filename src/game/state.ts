// Game state: career save, standings, season progression, persistence.

import type { ChampionshipId, ClassId, DisciplineId, LogoSpec, Rider, Universe, RiderWelfareFund } from '../data/types';
import { buildUniverse, gridOf, teamsOf, ridersOfTeam, overallOf, makeDraftRookie } from '../data/universe';
import { classById, CLASSES } from '../data/classes';
import { issuePenalty, collectFines, decrementSuspensions, isRiderSuspended, applyCharterRevocation } from './penalties';
import { runNamcWeekend, runRoadWeekend, runGPWeekend, runSBKWeekend, type WeekendResult } from '../sim/weekend';
import { settleNamcRound, settleRoadRound, type RoundLedgerEntry } from './economy';
import { updateManufacturerFinance, fulfillEngineOrder } from './parts-economy';
import { generateNewsForRound } from './news';
import { NAMC_CLASS_IDS, TEAM_CHAMPIONSHIP_PURSE, RIDERS_PER_CLASS_PER_TEAM } from '../data/namc';
import { decayAllMentalStates, processWeekendPsychology } from './psychology';
import { mulberry32, hashString, clamp, irange } from '../util/rng';
import { seededLogo } from '../logo/logos';
import { restoreTelemetryFromState } from '../util/telemetry';

export interface Standings {
  /** riderId -> points, per class+championship key */
  riders: Record<string, Record<string, number>>;
  /** teamId -> points */
  teams: Record<string, Record<string, number>>;
  /** tireBrandId -> points (NAMC) */
  tires: Record<string, number>;
}

export const standingsKey = (classId: ClassId, championship: ChampionshipId): string =>
  `${classId}:${championship}`;

export interface LeagueHealthRow {
  round: number;
  championship: ChampionshipId;
  ledger: RoundLedgerEntry[];
}

export interface CareerState {
  version: number;
  seed: number;
  season: number;
  discipline: DisciplineId;
  championship: ChampionshipId;      // NAMC: 4S or 2S; road: 'road'
  playerTeamId: string;
  focusClass: ClassId;               // class the player follows by default
  round: number;                     // next round index (0-based) into calendar
  universe: Universe;
  standings: Standings;
  history: { round: number; classId: ClassId; championship: ChampionshipId; winnerName: string; playerBest: string }[];
  leagueHealth: LeagueHealthRow[];
  messages: string[];
  welfareFund: RiderWelfareFund;      // §13.5: Rider Welfare Fund ledger
}

export interface NewCareerOptions {
  seed?: number;
  discipline: DisciplineId;
  championship?: ChampionshipId;     // required for NAMC
  mode: 'create' | 'takeover';
  teamName?: string;                 // create mode
  shortName?: string;
  colors?: { primary: string; secondary: string };
  logo?: LogoSpec;
  takeoverTeamId?: string;           // takeover mode
}

function emptyStandings(): Standings {
  return { riders: {}, teams: {}, tires: {} };
}

export function newCareer(opts: NewCareerOptions): CareerState {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const universe = buildUniverse(seed);
  const championship: ChampionshipId = opts.discipline === 'namc' ? (opts.championship ?? 'fourStroke') : 'road';

  let playerTeamId: string;
  if (opts.mode === 'takeover' && opts.takeoverTeamId) {
    playerTeamId = opts.takeoverTeamId;
    universe.teams[playerTeamId].isPlayer = true;
  } else {
    // Create mode: the weakest charter/entry in the starting tier folds; the
    // player's new organisation takes its slot (NAMC: vacant charter auction, 2.7).
    const candidates = teamsOf(universe, opts.discipline, championship)
      .filter(t => {
        if (opts.discipline === 'namc') return !t.dualCharter;
        // road: teams in the lowest tier only
        const lowTier: ClassId = opts.discipline === 'gp' ? 'gp3' : 'ss300';
        return t.classIds.includes(lowTier);
      })
      .sort((a, b) => a.prestige - b.prestige);
    const replaced = candidates[0];
    playerTeamId = replaced.id;
    const t = universe.teams[playerTeamId];
    t.name = opts.teamName?.trim() || 'Player Racing';
    t.shortName = (opts.shortName?.trim() || t.name.split(/\s+/).map(w => w[0]).join('')).toUpperCase().slice(0, 4);
    if (opts.colors) t.colors = opts.colors;
    t.logo = opts.logo ?? seededLogo(t.name + seed, t.shortName, t.colors.primary, t.colors.secondary);
    t.isPlayer = true;
    t.prestige = Math.max(20, t.prestige - 5);
    t.budget = opts.discipline === 'namc' ? 2_000_000 : 800_000;   // fresh charter: tight
    // slightly weaken inherited roster: underdog start
    for (const r of ridersOfTeam(universe, t.id)) {
      r.stats.pace = clamp(r.stats.pace - 2, 30, 99);
      r.morale = 60;
    }
  }

  const focusClass: ClassId = opts.discipline === 'namc'
    ? 'c250p'
    : opts.discipline === 'gp' ? (opts.mode === 'takeover' ? 'gp1' : 'gp3') : (opts.mode === 'takeover' ? 'sbk' : 'ss300');

  return {
    version: 1,
    seed,
    season: universe.season,
    discipline: opts.discipline,
    championship,
    playerTeamId,
    focusClass,
    round: 0,
    universe,
    standings: emptyStandings(),
    history: [],
    leagueHealth: [],
    messages: [`Welcome to the ${universe.season} season, boss. The paddock is yours.`],
    welfareFund: { totalAccumulated: 0, fineHistory: [] },
  };
}

// ------------------------------------------------------------ round runner

export interface RoundOutput {
  weekends: WeekendResult[];       // all classes at this round (player's championship(s))
  playerWeekend: WeekendResult | null;
}

/** Player strategy for their riders this weekend. */
export type ApproachMap = Record<string, 'push' | 'normal' | 'conserve'>;

export function runRound(state: CareerState, approaches: ApproachMap = {}): RoundOutput {
  const u = state.universe;
  const cal = u.calendars[state.discipline];
  if (state.round >= cal.length) return { weekends: [], playerWeekend: null };
  const round = cal[state.round];
  const rng = mulberry32(hashString(`${state.seed}:${state.season}:${state.discipline}:${round.round}`));
  const approachFor = (r: Rider) => approaches[r.id] ?? 'normal';

  // mental states drift back toward baseline before the gate drops
  decayAllMentalStates(u);

  const weekends: WeekendResult[] = [];
  let playerWeekend: WeekendResult | null = null;

  if (state.discipline === 'namc') {
    // S4-only championship (v15.1); all 4 class fields race every round.
    // (2S parallel championship is future DLC.)
    for (const champ of ['fourStroke'] as ChampionshipId[]) {
      const champWeekends: WeekendResult[] = [];
      for (const cls of NAMC_CLASS_IDS) {
        const w = runNamcWeekend(rng, u, cls, champ, round.trackId, approachFor, round.round);
        champWeekends.push(w);
        weekends.push(w);
        applyPoints(state, w);
        applyTirePoints(state, w);
        if (champ === state.championship && cls === state.focusClass) playerWeekend = w;
      }
      const ledger = settleNamcRound(u, champ, champWeekends);
      state.leagueHealth.push({ round: round.round, championship: champ, ledger });
    }
  } else if (state.discipline === 'gp') {
    // MotoGP: all classes (GP1, GP2, GP3) race each round with Sprint + Main format
    const ladder = CLASSES.filter(c => c.discipline === 'gp').map(c => c.id);
    for (const cls of ladder) {
      const w = runGPWeekend(rng, u, cls, round.trackId, approachFor, round.round);
      weekends.push(w);
      applyPoints(state, w);
      settleRoadRound(u, w);
      if (cls === state.focusClass) playerWeekend = w;
    }
  } else if (state.discipline === 'sbk') {
    // WorldSBK: all classes (SBK, SS600, SS300) race each round with Superpole + Race1 + Race2 format
    const ladder = CLASSES.filter(c => c.discipline === 'sbk').map(c => c.id);
    for (const cls of ladder) {
      const w = runSBKWeekend(rng, u, cls, round.trackId, approachFor, round.round);
      weekends.push(w);
      applyPoints(state, w);
      settleRoadRound(u, w);
      if (cls === state.focusClass) playerWeekend = w;
    }
  } else {
    // Fallback for any other road discipline
    const ladder = CLASSES.filter(c => c.discipline === state.discipline).map(c => c.id);
    for (const cls of ladder) {
      const w = runRoadWeekend(rng, u, cls, round.trackId, approachFor, round.round);
      weekends.push(w);
      applyPoints(state, w);
      settleRoadRound(u, w);
      if (cls === state.focusClass) playerWeekend = w;
    }
  }

  applyInjuriesAndRecovery(state, rng, weekends);
  if (state.discipline === 'namc') {
    applySuccessBallast(state, weekends);
    applyRaceStrikeRisks(state, rng, weekends);
  }
  applyPsychology(state, weekends);
  recordHistory(state, weekends);

  // Generate inter-league news for Ryan's briefing
  const newsThisRound = generateNewsForRound(u, rng, round.round, state.discipline);
  u.newsArchive.push(...newsThisRound);
  if (newsThisRound.length > 0 && state.playerTeamId) {
    // Show a brief note if there's big news from other leagues
    const headlines = newsThisRound.slice(0, 2).map(n => n.headline).join(' • ');
    state.messages.unshift(`📺 Ryan's reporting: ${headlines}`);
  }

  state.round += 1;
  return { weekends, playerWeekend };
}

/**
 * BOP success ballast (boss ruling 2026-07-17, mechanism per rulebook BOP
 * glossary entry; modeled on Super GT's success handicap, scaled for bikes):
 * Main Event win +2kg, podium +1kg, P4+ sheds 1kg. Cap 12kg (~0.84s/lap).
 * Winners get hunted; the pack gets a puncher's chance. Resets every season.
 */
function applySuccessBallast(state: CareerState, weekends: WeekendResult[]): void {
  const u = state.universe;
  for (const w of weekends) {
    w.finishOrder.forEach((riderId, i) => {
      const r = u.riders[riderId];
      if (!r) return;
      const before = r.ballastKg ?? 0;
      const delta = i === 0 ? 2 : i <= 2 ? 1 : -1;
      r.ballastKg = clamp(before + delta, 0, 12);
      if (r.teamId === state.playerTeamId && r.ballastKg !== before && r.ballastKg >= 4) {
        state.messages.unshift(`BOP: ${r.name} now carries ${r.ballastKg}kg of success ballast.`);
      }
    });
  }
}

/**
 * NAMC penalty enforcement (rulebook §13.1, §13.5): Four-Tier Graduated Penalties
 * - Tier 1: Warning (reckless riders who crash)
 * - Tier 2: Fine (unsportsmanlike conduct, rules infractions)
 * - Tier 3: Suspension (ballast manipulation, deliberate violations)
 * - Tier 4: Charter Revocation (terminal violations)
 */
function applyRaceStrikeRisks(state: CareerState, rng: () => number, weekends: WeekendResult[]): void {
  const u = state.universe;
  for (const w of weekends) {
    for (const s of w.sessions) {
      for (const ev of s.outcome.events) {
        // Aggressive riders who crash have a small risk of penalty
        if (ev.kind === 'crash') {
          const r = u.riders[ev.riderId];
          if (!r?.teamId) continue;

          const team = u.teams[r.teamId];
          if (!team) continue;

          // Escalating penalties based on aggression and repeat infractions
          if (r.stats.aggression >= 85) {
            // Very aggressive rider: 12% chance per crash
            if (rng() < 0.12) {
              const existingWarnings = team.penalties.filter(
                p => p.reason === 'aggressive-riding' && p.issuedRound > state.round - 5,
              ).length;

              let tier: 1 | 2 | 3 = 1;
              if (existingWarnings >= 2) tier = 3; // Tier 3: Suspension
              else if (existingWarnings >= 1) tier = 2; // Tier 2: Fine

              const penalty = issuePenalty(team, 'reckless-conduct', state.round, tier);
              state.messages.unshift(
                `⚠️ PENALTY: ${team.name} receives Tier ${tier} penalty for ${r.name}'s reckless conduct. Incident #${team.penalties.length}.`,
              );
            }
          } else if (r.stats.aggression >= 70) {
            // Aggressive rider: 8% chance per crash
            if (rng() < 0.08) {
              const penalty = issuePenalty(team, 'aggressive-riding', state.round, 1);
              state.messages.unshift(`⚠️ PENALTY: ${team.name} receives warning (Tier 1) for ${r.name}'s aggressive riding.`);
            }
          }
        }

        // Technical violations
        if (ev.kind === 'mechanical') {
          const r = u.riders[ev.riderId];
          if (!r?.teamId) continue;

          const team = u.teams[r.teamId];
          if (!team) continue;

          // Check for repeated mechanical failures (may indicate non-compliant engine)
          const recentDNFs = weekends
            .filter(w => w.finishOrder.find(id => id === r.id) === undefined)
            .length;

          if (recentDNFs >= 3) {
            // Three DNFs could indicate technical rule violation
            if (rng() < 0.15) {
              const penalty = issuePenalty(team, 'technical-violation', state.round, 2);
              state.messages.unshift(
                `⚠️ PENALTY: ${team.name} fined for technical violation - excessive DNF rate on ${r.name}'s bike.`,
              );
            }
          }
        }
      }
    }
  }

  // Collect any Tier 2 fines to welfare fund
  for (const team of Object.values(u.teams)) {
    const collected = collectFines(state, team, state.round);
    if (collected > 0) {
      state.messages.unshift(`💰 WELFARE FUND: ${team.name} fined $${collected.toLocaleString()}. Total fund: $${state.welfareFund.totalAccumulated.toLocaleString()}.`);
    }
  }

  // Apply charter revocation consequences (§13.1 Tier 4)
  for (const team of Object.values(u.teams)) {
    if (team.charterRevoked) {
      applyCharterRevocation(state, team);
    }
  }

  // Decrement all active suspensions
  decrementSuspensions(state);
}

/** Post-race mental-state pass; surfaces storylines for player-team riders + focus class. */
function applyPsychology(state: CareerState, weekends: WeekendResult[]): void {
  const u = state.universe;
  for (const w of weekends) {
    const stories = processWeekendPsychology(u, w);
    for (const s of stories) {
      const r = u.riders[s.riderId];
      const isPlayerRider = r?.teamId === state.playerTeamId;
      const isFocus = w.classId === state.focusClass && w.championship === state.championship;
      if (isPlayerRider || isFocus) state.messages.unshift(s.text);
    }
  }
}

function applyPoints(state: CareerState, w: WeekendResult): void {
  const key = standingsKey(w.classId, w.championship);
  const riders = (state.standings.riders[key] ??= {});
  for (const [riderId, pts] of Object.entries(w.points)) {
    riders[riderId] = (riders[riderId] ?? 0) + pts;
    const teamId = state.universe.riders[riderId]?.teamId;
    if (teamId) {
      // Discipline-specific team/constructor/manufacturer standing keys
      const discipline = state.universe.teams[teamId]?.discipline ?? 'namc';
      let tkey: string;
      if (discipline === 'namc') {
        tkey = w.championship === 'road' ? standingsKey(w.classId, 'road') : `team:${w.championship}`;
      } else if (discipline === 'gp') {
        tkey = `constructor:${w.classId}`;  // MotoGP: constructor championship per class
      } else if (discipline === 'sbk') {
        tkey = `manufacturer:${w.classId}`;  // WorldSBK: manufacturer championship per class
      } else {
        tkey = standingsKey(w.classId, 'road');
      }
      const teams = (state.standings.teams[tkey] ??= {});
      teams[teamId] = (teams[teamId] ?? 0) + pts;
    }
  }
  // career stats
  w.finishOrder.slice(0, 3).forEach((id, i) => {
    const r = state.universe.riders[id];
    if (!r) return;
    r.careerPodiums += 1;
    if (i === 0) r.careerWins += 1;
  });
}

function applyTirePoints(state: CareerState, w: WeekendResult): void {
  // 11.5.1: per Main Race, each brand's top 3 finishers score champ-scale points
  const perBrand: Record<string, number[]> = {};
  w.finishOrder.forEach((riderId, i) => {
    const r = state.universe.riders[riderId];
    const team = r?.teamId ? state.universe.teams[r.teamId] : null;
    if (!team) return;
    (perBrand[team.tireBrandId] ??= []).push(41 - (i + 1)); // 40 for P1
  });
  for (const [brand, scores] of Object.entries(perBrand)) {
    const top3 = scores.sort((a, b) => b - a).slice(0, 3).reduce((s, v) => s + v, 0);
    state.standings.tires[brand] = (state.standings.tires[brand] ?? 0) + top3;
  }
}

function applyInjuriesAndRecovery(state: CareerState, rng: () => number, weekends: WeekendResult[]): void {
  const u = state.universe;
  // recover; returning starters send their bench sub back down (Appendix B step 8)
  for (const r of Object.values(u.riders)) {
    if (r.injuredForRounds > 0) {
      r.injuredForRounds -= 1;
      if (r.injuredForRounds === 0) {
        const sub = Object.values(u.riders).find(x => x.subbingFor === r.id);
        if (sub) { sub.bench = true; sub.classId = null; sub.subbingFor = undefined; }
      }
    }
  }
  // new injuries from crashes (NAMC: substitute cascade handled by gridOf exclusion)
  for (const w of weekends) {
    for (const s of w.sessions) {
      for (const ev of s.outcome.events) {
        if (ev.kind === 'crash' && rng() < 0.16) {
          const r = u.riders[ev.riderId];
          if (r && r.injuredForRounds === 0) {
            r.injuredForRounds = irange(rng as any, 1, 4);
            state.messages.unshift(`INJURY: ${r.name} out for ${r.injuredForRounds} round(s) after a crash.`);
            // Bench Rider Activation Protocol (rulebook Appendix B / 4.13):
            // promote a free bench rider from the same charter, matching
            // gender for the Women's 250 class.
            if (r.classId && r.teamId) {
              const bench = Object.values(u.riders).find(x =>
                x.teamId === r.teamId && x.bench && !x.subbingFor &&
                x.injuredForRounds === 0 && x.isFemale === (r.classId === 'women'));
              if (bench) {
                bench.bench = false; bench.classId = r.classId; bench.subbingFor = r.id;
                state.messages.unshift(`BENCH ACTIVATION: ${bench.name} steps in for ${r.name} (${r.classId}).`);
              }
            }
          }
        }
      }
    }
  }
}

function recordHistory(state: CareerState, weekends: WeekendResult[]): void {
  const u = state.universe;
  for (const w of weekends) {
    if (w.championship !== state.championship && w.championship !== 'road') continue;
    if (w.classId !== state.focusClass) continue;
    const winner = u.riders[w.finishOrder[0]];
    const playerRider = w.finishOrder.find(id => u.riders[id]?.teamId === state.playerTeamId);
    const playerPos = playerRider ? w.finishOrder.indexOf(playerRider) + 1 : 0;
    state.history.unshift({
      round: state.round + 1,
      classId: w.classId,
      championship: w.championship,
      winnerName: winner?.name ?? '—',
      playerBest: playerPos ? `P${playerPos}` : 'no entry',
    });
  }
}

// ------------------------------------------------------------ persistence

const SAVE_KEY = 'paddockboss.save.v1';

export function saveCareer(state: CareerState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch { /* storage full/unavailable — ignore */ }
}

export function loadCareer(): CareerState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as any;
    if (parsed.version !== 1) return null;
    // Restore telemetry from saved state
    restoreTelemetryFromState(parsed);
    return parsed as CareerState;
  } catch {
    return null;
  }
}

export function deleteSave(): void {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}

// ------------------------------------------------------------ queries

export function riderStandingsFor(state: CareerState, classId: ClassId, championship: ChampionshipId) {
  const key = standingsKey(classId, championship);
  const table = state.standings.riders[key] ?? {};
  return Object.entries(table)
    .map(([riderId, pts]) => ({ rider: state.universe.riders[riderId], pts }))
    .filter(x => x.rider)
    .sort((a, b) => b.pts - a.pts);
}

export function teamStandingsFor(state: CareerState, championship: ChampionshipId, classId?: ClassId) {
  const key = championship === 'road' ? standingsKey(classId ?? state.focusClass, 'road') : `team:${championship}`;
  const table = state.standings.teams[key] ?? {};
  return Object.entries(table)
    .map(([teamId, pts]) => ({ team: state.universe.teams[teamId], pts }))
    .filter(x => x.team)
    .sort((a, b) => b.pts - a.pts);
}

export function seasonOver(state: CareerState): boolean {
  return state.round >= state.universe.calendars[state.discipline].length;
}

// ------------------------------------------------------------ season rollover
//
// MINIMAL off-season: only the mechanical necessities live here. Every place a
// real system SHOULD hook in but doesn't yet is deliberately left out and
// tracked in docs/SIMULATION_FINDINGS.md — do not silently invent mechanics
// here; wire the real system instead.

/** Legacy plate from career title count (1+ gold, 3+ platinum, 5+ diamond). */
function legacyPlateFor(championships: number): Rider['legacyPlate'] {
  if (championships >= 5) return 'diamond';
  if (championships >= 3) return 'platinum';
  if (championships >= 1) return 'gold';
  return 'none';
}

export interface OffSeasonReport {
  endedSeason: number;
  champions: { classId: ClassId; rider: string; teamName: string; pts: number; titles: number }[];
  teamTitle: { teamName: string; prize: number } | null;
  retired: { name: string; age: number; titles: number }[];
  toFreeAgency: { name: string; fromTeam: string; classId: ClassId; overall: number }[];
  draftPicks: { teamName: string; rider: string; classId: ClassId; overall: number; isPlayer: boolean }[];
  faSignings: { rider: string; toTeam: string; classId: ClassId; overall: number; isPlayer: boolean }[];
  poolLeft: number;
}

/**
 * Close out the season and open the next one. Returns a structured
 * OffSeasonReport for the Off-Season screen (notes also go to messages).
 */
export function advanceSeason(state: CareerState): OffSeasonReport {
  const u = state.universe;
  const notes: string[] = [];
  const report: OffSeasonReport = {
    endedSeason: state.season, champions: [], teamTitle: null, retired: [],
    toFreeAgency: [], draftPicks: [], faSignings: [], poolLeft: 0,
  };
  const classes = CLASSES.filter(c => c.discipline === state.discipline).map(c => c.id);
  const champs: ChampionshipId[] = state.discipline === 'namc' ? ['fourStroke'] : ['road'];

  // 1. Crown champions; award legacy plates
  for (const champ of champs) {
    for (const cls of classes) {
      const table = riderStandingsFor(state, cls, champ);
      const top = table[0];
      if (!top) continue;
      top.rider.championships += 1;
      top.rider.legacyPlate = legacyPlateFor(top.rider.championships);
      report.champions.push({ classId: cls, rider: top.rider.name, teamName: top.rider.teamId ? u.teams[top.rider.teamId].name : 'Free Agent', pts: top.pts, titles: top.rider.championships });
      notes.push(`${state.season} ${classById(cls).shortName} CHAMPION: ${top.rider.name} (${top.pts} pts)`);
    }
  }

  // 2. Team championship purse payout (rulebook 11.3) — the one annual moment
  //    money moves until the weekly economy settlement is wired.
  if (state.discipline === 'namc') {
    const order = teamStandingsFor(state, 'fourStroke');
    order.forEach((row, i) => {
      const prize = TEAM_CHAMPIONSHIP_PURSE[i] ?? 0;
      row.team.budget += prize;
      if (i === 0) { report.teamTitle = { teamName: row.team.name, prize }; notes.push(`${row.team.name} take the team title ($${(prize / 1000).toFixed(0)}k)`); }
    });
  }

  // 3. Riders: age one year, DEVELOP toward hidden potential (young riders),
  //    apply post-32 physical decline (per training.ts spec), heal over the
  //    winter, reset season resources and mental state.
  const devRng = mulberry32(hashString(`${state.seed}:dev:${state.season}`));
  for (const r of Object.values(u.riders)) {
    r.age += 1;
    // Off-season development: gain scales with youth (ageMod), remaining
    // headroom to potential, and the team's facility + coach quality.
    if (r.age < 32 && r.overall < r.potential) {
      const ageMod = r.age < 22 ? 1.5 : r.age <= 27 ? 1.0 : 0.5;
      const team = r.teamId ? u.teams[r.teamId] : null;
      const facility = team ? 0.8 + team.facilityLevel * 0.15 : 0.8;
      const coach = team?.coachQuality ?? 0.8;
      const headroom = Math.min(1, (r.potential - r.overall) / 12);
      const gain = ageMod * headroom * facility * coach;   // ~0.5-2.5 pts/season
      const grow = (k: 'pace' | 'consistency' | 'starts' | 'fitness' | 'wet') => {
        r.stats[k] = clamp(r.stats[k] + gain * (0.7 + devRng() * 0.6), 30, 99);
      };
      grow('pace'); grow('consistency');
      if (devRng() < 0.5) grow('starts');
      if (devRng() < 0.5) grow('fitness');
      if (devRng() < 0.3) grow('wet');
      r.skills.pace = r.stats.pace; r.skills.consistency = r.stats.consistency;
      r.skills.starts = r.stats.starts; r.skills.fitness = r.stats.fitness; r.skills.wet = r.stats.wet;
      r.overall = Math.min(r.potential, overallOf(r.stats));
    }
    if (r.age >= 32) {
      // Real atrophy (boss ruling 2026-07-17): decline you can SEE. A 32yo
      // loses ~0.6/season on physical stats, a 35yo ~1.7 — youth overtake
      // veterans on merit, and decline is what forces retirement.
      const physical = 0.6 + (r.age - 32) * 0.35;
      r.stats.pace = Math.max(30, r.stats.pace - physical);
      r.stats.fitness = Math.max(30, r.stats.fitness - physical);
      r.stats.starts = Math.max(30, r.stats.starts - physical);
      r.skills.pace = Math.max(30, r.skills.pace - physical);
      r.skills.fitness = Math.max(30, r.skills.fitness - physical);
      r.skills.starts = Math.max(30, r.skills.starts - physical);
      r.overall = overallOf(r.stats);
    }
    r.stamina = 100;
    r.ballastKg = 0;   // BOP ballast resets for the new season
    r.injuredForRounds = 0;
    r.morale = clamp(Math.round(r.morale + (70 - r.morale) * 0.5), 0, 100);
    if (r.mental) {
      r.mental.confidence = 50;
      r.mental.tilt = 0;
      r.mental.fatigue = 0;
      r.mental.angerCharge = 0;
      r.mental.consecutiveWins = 0;
      r.mental.consecutivePodiums = 0;
      r.mental.peakForm = false;
    }
  }

  // 4. §6.1 F1-style number system: next season's number = this season's
  //    Rider's Cup finishing position. The champion carries #1.
  if (state.discipline === 'namc') {
    for (const cls of classes) {
      const table = riderStandingsFor(state, cls, 'fourStroke');
      table.forEach((row, i) => { row.rider.number = i + 1; });
    }
  }

  // 4a. 250P Career Progression (rulebook §3.2): Restricted class max 2 seasons.
  //     After 2 seasons in 250P, riders must graduate to open 250 class.
  if (state.discipline === 'namc') {
    for (const r of Object.values(u.riders)) {
      if (!r.classId || !NAMC_CLASS_IDS.includes(r.classId)) continue;

      // Increment seasons-in-class at off-season start
      if (r.classId !== null) {
        r.seasonsInCurrentClass = (r.seasonsInCurrentClass ?? 1) + 1;
      }

      // 250P graduation: after 2 seasons, must move to open 250 or retire
      if (r.classId === 'c250p') {  // c250p is the 250P restricted class
        if (r.seasonsInCurrentClass > 2) {
          // Force graduation to open 250
          const prevClass = r.classId;
          r.classId = 'c250';
          r.seasonsInCurrentClass = 1;  // reset counter for new class
          notes.push(`${r.name} graduates from 250P to open 250 class after ${r.seasonsInCurrentClass + 1} seasons`);
        }
      }
    }
  }

  // 4b. Parts Economy: Manufacturer Financial Health & Engine Orders (§8.2-8.5)
  //     Manufacturers track FICTITIOUS SALES based on racing performance (wins/points/DNF).
  //     Revenue from wins (brand halo), championship points (sponsorship), DNF penalties (brand damage).
  //     Teams place engine orders off-season; orders fulfilled based on capacity.
  if (state.discipline === 'namc') {
    const partsRng = mulberry32(hashString(`${state.seed}:parts:${state.season}`));

    // Calculate racing performance by manufacturer (wins, points, DNFs)
    // Group teams by manufacturer, sum their season points
    const mfgPerf = new Map<string, { points: number; wins: number; dnfs: number }>();
    for (const team of Object.values(u.teams)) {
      if (team.manufacturerId) {
        if (!mfgPerf.has(team.manufacturerId)) {
          mfgPerf.set(team.manufacturerId, { points: 0, wins: 0, dnfs: 0 });
        }

        // Count wins from this season's race history
        const teamWins = state.history.filter(h => h.winnerName.includes(team.shortName) && h.championship === 'fourStroke').length;
        const perf = mfgPerf.get(team.manufacturerId)!;
        perf.wins += teamWins;

        // Calculate approximate points from standings (rough: team's aggregate position in all classes)
        // For simplicity, estimate ~30 points per decent finisher per round × 20 rounds
        perf.points += 30 * 20;  // baseline for active team
      }
    }

    // Update manufacturer financial state based on racing results (fictitious sales)
    for (const mfg of Object.values(u.manufacturers)) {
      const perf = mfgPerf.get(mfg.id) || { points: 0, wins: 0, dnfs: 0 };
      updateManufacturerFinance(mfg, perf.points, perf.wins, perf.dnfs, partsRng);
    }

    // Fulfill engine orders based on manufacturer capacity
    for (const order of u.engineOrders) {
      if (!order.fulfilled) {
        const mfg = u.manufacturers[order.manufacturerId];
        if (mfg && fulfillEngineOrder(order, mfg, partsRng, state.season)) {
          const team = u.teams[order.teamId];
          if (team) {
            notes.push(`✓ ${team.name} receives new engine from ${mfg.name}.`);
          }
        }
      }
    }

    // Clear fulfilled orders older than 2 seasons
    u.engineOrders = u.engineOrders.filter(o => state.season - o.expectedArrivalSeason < 2);
  }

  // 5. The full off-season cycle (rulebook §4.10-4.14), in league order:
  //    retirements -> contract expiries (lockdown: no signings until Draft
  //    Day) -> the NAMC Draft (reverse standings, no pick trading) -> Free
  //    Agent Pool opens the day after Draft Day (§4.12).
  if (state.discipline === 'namc') {
    const rng = mulberry32(hashString(`${state.seed}:offseason:${state.season}`));
    // Draft order locked BEFORE standings reset: reverse Manufacturer's Cup
    const draftOrder = teamStandingsFor(state, 'fourStroke').map(x => x.team).reverse();

    // 5a. Winter reset: bench subs stand down (their starters heal over the
    //     off-season), keeping every roster at 2-per-class before the math.
    for (const r of Object.values(u.riders)) {
      if (r.subbingFor) { r.bench = true; r.classId = null; r.subbingFor = undefined; }
    }

    // Retirements (age 36+); aging free agents drift out of the sport
    let retired = 0;
    for (const r of Object.values(u.riders)) {
      if (!r.classId || !NAMC_CLASS_IDS.includes(r.classId)) continue;
      const declined = r.age >= 33 && r.overall < 62;   // youth have passed him
      if (r.age >= 36 || declined || (r.teamId === null && r.age >= 33)) {
        report.retired.push({ name: r.name, age: r.age, titles: r.championships });
        delete u.riders[r.id];
        retired++;
      }
    }

    // 5b. Contract expiries. Teams may re-sign their own riders before the
    //     lockdown; unrenewed riders hit the Free Agent Pool (teamId null).
    let toFreeAgency = 0;
    for (const r of Object.values(u.riders)) {
      if (!r.classId || !NAMC_CLASS_IDS.includes(r.classId) || r.bench || !r.teamId) continue;
      r.contract.length -= 1;
      if (r.contract.length > 0) continue;
      const team = u.teams[r.teamId];
      // Re-sign decision: quality + morale + budget health
      const wantsToStay = r.morale >= 45;
      const teamWants = r.overall >= 60 + irange(rng, -6, 6) && team.budget > 0;
      if (wantsToStay && teamWants) {
        r.contract.length = irange(rng, 1, 3);
        r.salary = Math.round((classById(r.classId).salaryFloor) * (1 + Math.max(0, r.overall - 60) / 25));
        r.contract.salary = r.salary;
      } else {
        report.toFreeAgency.push({ name: r.name, fromTeam: team.name, classId: r.classId, overall: Math.round(r.overall) });
        r.teamId = null;   // into the Free Agent Pool
        toFreeAgency++;
      }
    }

    // 5c. THE NAMC DRAFT (§4.10/4.11) — two weeks before the opener. Rookie
    //     class out of the Development Series; worst teams pick first.
    let drafted = 0;
    const rookieClass: Rider[] = [];
    for (let i = 0; i < 24; i++) {
      const cls = NAMC_CLASS_IDS[i % 4];
      rookieClass.push(makeDraftRookie(rng, { classId: cls, championship: 'fourStroke', teamId: null, female: cls === 'women', quality: 50 + irange(rng, 0, 14) }));
    }
    rookieClass.sort((a, b) => b.overall - a.overall);
    for (const team of draftOrder) {
      for (const cls of NAMC_CLASS_IDS) {
        const have = Object.values(u.riders).filter(r => r.teamId === team.id && r.classId === cls && !r.bench).length;
        if (have >= RIDERS_PER_CLASS_PER_TEAM) continue;
        const idx = rookieClass.findIndex(r => r.classId === cls);
        if (idx === -1) continue;
        // Teams may pass: if a proven free agent clearly outclasses the best
        // rookie, hold the slot for the FA window (draft picks aren't mandatory)
        const bestFA = Object.values(u.riders)
          .filter(r => r.teamId === null && r.classId === cls && !r.bench)
          .sort((a, b) => b.overall - a.overall)[0];
        if (bestFA && bestFA.overall > rookieClass[idx].overall + 5) continue;
        const pick = rookieClass.splice(idx, 1)[0];
        pick.teamId = team.id;
        u.riders[pick.id] = pick;
        report.draftPicks.push({ teamName: team.name, rider: pick.name, classId: cls, overall: Math.round(pick.overall), isPlayer: team.isPlayer });
        drafted++;
      }
    }

    // 5d. FREE AGENCY (§4.12) — pool opens the day after Draft Day. Teams
    //     with remaining vacancies sign best available; prestige-rich teams
    //     get first calls. Undrafted rookies join the pool too.
    rookieClass.forEach(r => { u.riders[r.id] = r; });
    let signed = 0;
    const byPull = Object.values(u.teams)
      .filter(t => t.discipline === 'namc' && t.championship === 'fourStroke')
      .sort((a, b) => (b.prestige + b.budget / 100_000) - (a.prestige + a.budget / 100_000));
    for (const team of byPull) {
      for (const cls of NAMC_CLASS_IDS) {
        let have = Object.values(u.riders).filter(r => r.teamId === team.id && r.classId === cls && !r.bench).length;
        while (have < RIDERS_PER_CLASS_PER_TEAM) {
          const fa = Object.values(u.riders)
            .filter(r => r.teamId === null && r.classId === cls && !r.bench)
            .sort((a, b) => b.overall - a.overall)[0];
          if (!fa) break;
          fa.teamId = team.id;
          fa.contract.length = irange(rng, 1, 2);
          fa.salary = Math.round(classById(cls).salaryFloor * (1 + Math.max(0, fa.overall - 60) / 30));
          fa.contract.salary = fa.salary;
          fa.morale = clamp(fa.morale + 10, 0, 100);   // new home bounce
          report.faSignings.push({ rider: fa.name, toTeam: team.name, classId: cls, overall: Math.round(fa.overall), isPlayer: team.isPlayer });
          signed++; have++;
        }
      }
    }

    // Unsigned riders drift away — the Pool holds the best 24 hopefuls
    const pool = Object.values(u.riders)
      .filter(r => r.teamId === null && r.classId && NAMC_CLASS_IDS.includes(r.classId))
      .sort((a, b) => b.overall - a.overall);
    pool.slice(24).forEach(r => { delete u.riders[r.id]; });

    const poolLeft = Object.values(u.riders).filter(r => r.teamId === null && r.classId && NAMC_CLASS_IDS.includes(r.classId)).length;
    report.poolLeft = poolLeft;
    notes.push(`Off-season: ${retired} retired, ${toFreeAgency} hit free agency, ${drafted} rookies drafted, ${signed} free agents signed (${poolLeft} remain in the Pool).`);
  }

  // 6. Reset the season state
  state.season += 1;
  u.season += 1;
  state.round = 0;
  state.standings = emptyStandings();
  // Reset strikes for all teams (rulebook §13.1: annual reset)
  for (const t of Object.values(u.teams)) {
    if (t.discipline === 'namc') t.strikes = 0;
  }
  state.messages.unshift(...notes, `The ${state.season} season is here. New year, same dirt.`);
  return report;
}
