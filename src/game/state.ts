// Game state: career save, standings, season progression, persistence.

import type { ChampionshipId, ClassId, DisciplineId, LogoSpec, Rider, Universe } from '../data/types';
import { buildUniverse, gridOf, teamsOf, ridersOfTeam } from '../data/universe';
import { classById, CLASSES } from '../data/classes';
import { runNamcWeekend, runRoadWeekend, type WeekendResult } from '../sim/weekend';
import { settleNamcRound, settleRoadRound, pursesFor, type RoundLedgerEntry } from './economy';
import { NAMC_CLASS_IDS } from '../data/namc';
import { mulberry32, hashString, clamp, irange } from '../util/rng';
import { seededLogo } from '../logo/logos';

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
    ? 'c125'
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

  const weekends: WeekendResult[] = [];
  let playerWeekend: WeekendResult | null = null;

  if (state.discipline === 'namc') {
    // Both championships race every round; sim all 8 class fields.
    for (const champ of ['fourStroke', 'twoStroke'] as ChampionshipId[]) {
      const champWeekends: WeekendResult[] = [];
      for (const cls of NAMC_CLASS_IDS) {
        const w = runNamcWeekend(rng, u, cls, champ, round.trackId, approachFor);
        champWeekends.push(w);
        weekends.push(w);
        applyPoints(state, w);
        applyTirePoints(state, w);
        if (champ === state.championship && cls === state.focusClass) playerWeekend = w;
      }
      const ledger = settleNamcRound(u, champ, champWeekends);
      state.leagueHealth.push({ round: round.round, championship: champ, ledger });
    }
  } else {
    // Road: all classes of the ladder race at the round's track.
    const ladder = CLASSES.filter(c => c.discipline === state.discipline).map(c => c.id);
    for (const cls of ladder) {
      const w = runRoadWeekend(rng, u, cls, round.trackId, approachFor);
      weekends.push(w);
      applyPoints(state, w);
      settleRoadRound(u, w);
      if (cls === state.focusClass) playerWeekend = w;
    }
  }

  applyInjuriesAndRecovery(state, rng, weekends);
  recordHistory(state, weekends);
  state.round += 1;
  return { weekends, playerWeekend };
}

function applyPoints(state: CareerState, w: WeekendResult): void {
  const key = standingsKey(w.classId, w.championship);
  const riders = (state.standings.riders[key] ??= {});
  for (const [riderId, pts] of Object.entries(w.points)) {
    riders[riderId] = (riders[riderId] ?? 0) + pts;
    const teamId = state.universe.riders[riderId]?.teamId;
    if (teamId) {
      const tkey = w.championship === 'road' ? standingsKey(w.classId, 'road') : `team:${w.championship}`;
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
  // recover
  for (const r of Object.values(u.riders)) {
    if (r.injuredForRounds > 0) r.injuredForRounds -= 1;
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
    const parsed = JSON.parse(raw) as CareerState;
    if (parsed.version !== 1) return null;
    return parsed;
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
