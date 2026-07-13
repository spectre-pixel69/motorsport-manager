// NAMC economics & format constants, faithful to the 2027 Official Rulebook.
// This file is the "case study" heart: real numbers from the rulebook so the
// sim's League Health reporting reflects the real league design.

import type { ClassId } from './types';

// ---- 5.10.1 Race purse scales (40 positions each)
// Tier weighting order: 350 > 250 > Women's > 250P.
// The rulebook printed ONE table labeled "125" and served it to two classes —
// resolved (audit log #7): the printed table is the WOMEN'S table ($385,250);
// the rulebook's stated total ($341,200) is the 250P's, rebuilt below.
const steps = (from: number, step: number, n: number): number[] =>
  Array.from({ length: n }, (_, i) => from - step * i);

// 350 Class — EXACT rulebook table. Actual sum $619,000/round.
// (Rulebook states $585,000 — arithmetic mismatch, open in audit log.)
export const PURSE_350 = [
  75_000, 37_500, 22_500,
  ...steps(22_000, 500, 17),   // P4-P20: 22000 -> 14000
  ...steps(13_500, 500, 10),   // P21-P30: 13500 -> 9000
  8_500, 8_000, 7_500, 7_000, 6_500,        // P31-P35
  6_200, 5_900, 5_600, 5_300, 5_000,        // P36-P40
];
// 250 Class — EXACT rulebook table. Actual sum $499,500/round.
// (Rulebook states $486,600 — arithmetic mismatch, open in audit log.)
export const PURSE_250 = [
  60_000, 30_000, 18_000,
  ...steps(17_600, 400, 17),   // P4-P20: 17600 -> 11200
  ...steps(10_800, 400, 10),   // P21-P30: 10800 -> 7200
  6_800, 6_400, 6_100, 5_800, 5_600,        // P31-P35
  5_400, 5_300, 5_200, 5_100, 5_000,        // P36-P40
];
// Women's Pro — the rulebook's printed "125" table. Sum $385,250/round.
export const PURSE_WOMEN = [
  45_000, 22_500, 13_500,
  ...steps(13_200, 300, 17),   // P4-P20: 13200 -> 8400
  ...steps(8_100, 300, 7),     // P21-P27: 8100 -> 6300
  6_100, 5_900, 5_700,         // P28-P30 (step changes to -200 in the table)
  5_600, 5_500, 5_400, 5_300, 5_250,        // P31-P35
  5_200, 5_150, 5_100, 5_050, 5_000,        // P36-P40
];
// 250P Restricted — bottom tier, built to the rulebook's stated total of
// EXACTLY $341,200/round, same shape as the other tables, P40 = $5,000
// minimum finish payout preserved.
export const PURSE_250P = [
  40_000, 20_000, 12_500,
  ...steps(11_600, 300, 17),   // P4-P20: 11600 -> 6800
  ...steps(6_750, 150, 10),    // P21-P30: 6750 -> 5400
  5_350, 5_300, 5_250, 5_200, 5_150,        // P31-P35
  5_120, 5_090, 5_060, 5_030, 5_000,        // P36-P40
];

export const PURSES: Record<string, number[]> = {
  c350: PURSE_350,
  c250: PURSE_250,
  c125: PURSE_250P,   // 250P Restricted (internal id c125)
  women: PURSE_WOMEN,
};

// ---- 4.3 / 4.4 rider compensation
export const SALARY_FLOORS: Record<string, number> = {
  c350: 400_000, c250: 200_000, c125: 100_000, women: 100_000,
};
export const APPEARANCE_FEE = 1_000;        // per round
export const RESERVE_RETAINER = 50_000;     // bench riders
export const PRO_DEBUT_BONUS = 25_000;      // newly drafted rider

// ---- 5.3 weekly LEAGUE REVENUE split (swag/merch/TV — NOT purse winnings;
// purse money is the rider's, minus a contract-negotiated team cut ≤25%).
// Boss quotes the split as riders 25 / teams 45 / NAMC personnel 20 /
// operational 20 — which sums to 110%. Code keeps the closing version below
// (with a 10% tire slice) until the rulebook settles it. Audit log #10.
export const REVENUE_SPLIT = { teams: 0.45, riders: 0.25, tires: 0.10, league: 0.20 };
// 5.4 team pool: 60% equal base, 40% merit
export const TEAM_POOL_BASE_SHARE = 0.60;
// Assumed weekly league revenue (TV/merch/digital/sponsorship) — the sim's
// tunable knob for stress-testing the business model.
export const WEEKLY_LEAGUE_REVENUE = 8_000_000;

// ---- 11.3 team championship purse (single-charter only)
export const TEAM_CHAMPIONSHIP_PURSE: number[] = (() => {
  const p = [400_000, 250_000, 150_000, 100_000, 50_000];
  // 6th-20th scaled 20k down to 5k
  for (let i = 0; i < 15; i++) p.push(Math.round(20_000 - (15_000 * i) / 14));
  return p;
})();

// ---- 11.4 dual-charter (constructors) championship
export const DUAL_CHARTER_FIRST_PRIZE = 5_000_000;

// ---- 11.5 tire manufacturer championship
export const TIRE_CHAMPIONSHIP_PURSE = [200_000, 125_000, 100_000, 75_000];

// ---- format constants
export const NAMC_ROUNDS = 20;    // all-outdoor championship per v15.1 rulebook
export const NAMC_GRID = 40;      // unified 40-rider single gate per class
export const CHARTERS_PER_CHAMPIONSHIP = 20;
export const RIDERS_PER_CLASS_PER_TEAM = 2;
export const BENCH_SIZE = 3;      // 2 male + 1 female (4.8.1)

// Tier weighting order: 350 > 250 > Women's > 250P (c125 = 250P internal id)
export const NAMC_CLASS_IDS: ClassId[] = ['c350', 'c250', 'women', 'c125'];

// Race lengths (minutes) — 3.5.1 / 3.5.2 (used to scale sim laps)
// NAMC uses outdoor times for all 20 rounds (all-outdoor format)
export const RACE_MINUTES = {
  stadium: { qual: 15, main: 25 },
  outdoor: { qual: 20, main: 30 },
  scaled: { qual: 9, main: 15 },   // 125 + women's stadium (60%)
  scaledOutdoor: { qual: 12, main: 18 },
};

/** Which classes use the 60% scaled durations. */
export const SCALED_CLASSES: ClassId[] = ['c125', 'women'];
