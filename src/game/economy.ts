// NAMC economy: purses, revenue pool distribution, salaries — per rulebook.
// Road disciplines use a simpler prize-money model.

import type { ChampionshipId, ClassId, Team, Universe } from '../data/types';
import {
  APPEARANCE_FEE, PURSES, REVENUE_SPLIT, TEAM_POOL_BASE_SHARE, WEEKLY_LEAGUE_REVENUE,
  CHARTERS_PER_CHAMPIONSHIP, NAMC_CLASS_IDS,
} from '../data/namc';
import { teamsOf, ridersOfTeam } from '../data/universe';
import type { WeekendResult } from '../sim/weekend';

export interface RoundLedgerEntry {
  teamId: string;
  purse: number;          // riders' purse credited to team ledger (team manages payroll)
  revenuePool: number;
  salaries: number;       // per-round salary + appearance fees paid out
  net: number;
}

/** Rider purse for a class weekend: position -> dollars (40 deep). */
export function pursesFor(classId: ClassId, finishOrder: string[]): Record<string, number> {
  const scale = PURSES[classId] ?? PURSES.c125;
  const out: Record<string, number> = {};
  finishOrder.forEach((id, i) => { out[id] = scale[i] ?? scale[scale.length - 1]; });
  return out;
}

/**
 * Weekly revenue pool for ONE championship (4S or 2S).
 * Team pool = 45% x half weekly revenue; 60% equal base + 40% merit by round points.
 * Dual-charter teams: full share in fourStroke, $0 in twoStroke (cascades) — rulebook 2.6.3.
 */
export function distributeRevenuePool(
  u: Universe, championship: ChampionshipId, roundPointsByTeam: Record<string, number>,
): Record<string, number> {
  const champRevenue = WEEKLY_LEAGUE_REVENUE / 2;
  const teamPool = champRevenue * REVENUE_SPLIT.teams;
  const teams = teamsOf(u, 'namc', championship);
  const base = (teamPool * TEAM_POOL_BASE_SHARE) / CHARTERS_PER_CHAMPIONSHIP;
  const meritPool = teamPool * (1 - TEAM_POOL_BASE_SHARE);
  const totalPts = Object.values(roundPointsByTeam).reduce((s, v) => s + v, 0) || 1;

  const out: Record<string, number> = {};
  // First pass: nominal shares
  let cascadePot = 0;
  const eligibleSingles: Team[] = [];
  for (const t of teams) {
    const merit = (meritPool * (roundPointsByTeam[t.id] ?? 0)) / totalPts;
    const share = base + merit;
    if (championship === 'twoStroke' && t.dualCharter) {
      cascadePot += share;         // forfeited, cascades to single-charter 2S teams
      out[t.id] = 0;
    } else {
      out[t.id] = share;
      if (!t.dualCharter) eligibleSingles.push(t);
    }
  }
  if (cascadePot > 0 && eligibleSingles.length > 0) {
    const bonus = cascadePot / eligibleSingles.length;
    for (const t of eligibleSingles) out[t.id] += bonus;
  }
  return out;
}

/** Process a full NAMC round for one championship: returns per-team ledger. */
export function settleNamcRound(
  u: Universe, championship: ChampionshipId, weekendResults: WeekendResult[],
): RoundLedgerEntry[] {
  // aggregate round champ points per team
  const roundPointsByTeam: Record<string, number> = {};
  const purseByTeam: Record<string, number> = {};

  for (const w of weekendResults) {
    const purse = pursesFor(w.classId, w.finishOrder);
    for (const [riderId, pts] of Object.entries(w.points)) {
      const r = u.riders[riderId];
      if (!r?.teamId) continue;
      roundPointsByTeam[r.teamId] = (roundPointsByTeam[r.teamId] ?? 0) + pts;
    }
    for (const [riderId, dollars] of Object.entries(purse)) {
      const r = u.riders[riderId];
      if (!r?.teamId) continue;
      // team banks purse, pays riders via salary line (manager-game abstraction)
      purseByTeam[r.teamId] = (purseByTeam[r.teamId] ?? 0) + dollars * 0.5;
    }
  }

  const pool = distributeRevenuePool(u, championship, roundPointsByTeam);
  const ledger: RoundLedgerEntry[] = [];
  for (const team of teamsOf(u, 'namc', championship)) {
    const riders = ridersOfTeam(u, team.id);
    const salaries = riders.reduce((s, r) => s + r.salary / 24 + (r.bench ? 0 : APPEARANCE_FEE), 0);
    const purse = purseByTeam[team.id] ?? 0;
    const revenuePool = pool[team.id] ?? 0;
    const net = purse + revenuePool - salaries;
    team.budget += Math.round(net);
    ledger.push({ teamId: team.id, purse, revenuePool, salaries, net });
  }
  return ledger;
}

/** Road round prize money (simple ladder-scaled model). */
export function settleRoadRound(u: Universe, weekend: WeekendResult): void {
  const tierMoney: Record<string, number> = {
    gp1: 220_000, gp2: 60_000, gp3: 30_000,
    sbk: 140_000, ss600: 45_000, ss300: 22_000,
  };
  const winnerPrize = tierMoney[weekend.classId] ?? 30_000;
  weekend.finishOrder.forEach((riderId, i) => {
    const r = u.riders[riderId];
    if (!r?.teamId) return;
    const team = u.teams[r.teamId];
    const prize = Math.round(winnerPrize * Math.max(0, 1 - i * 0.09));
    team.budget += prize;
  });
  // salaries: paid per round
  const seen = new Set<string>();
  for (const riderId of weekend.finishOrder) {
    const r = u.riders[riderId];
    if (!r?.teamId || seen.has(r.teamId)) continue;
    seen.add(r.teamId);
    const team = u.teams[r.teamId];
    const roster = ridersOfTeam(u, team.id);
    const rounds = u.calendars[team.discipline].length;
    team.budget -= Math.round(roster.reduce((s, x) => s + x.salary / rounds, 0));
  }
}
