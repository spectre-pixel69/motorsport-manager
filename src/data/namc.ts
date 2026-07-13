// NAMC economics & format constants, faithful to the 2027 Official Rulebook.
// This file is the "case study" heart: real numbers from the rulebook so the
// sim's League Health reporting reflects the real league design.

import type { ClassId } from './types';

// ---- §5.2 Round Purse — rulebook v15.1 defines only the endpoints per class:
// win payout (350: $75k, 250: $40k, 250P: $20k, Women's: $20k) and the $5,000
// 40th-place minimum (§4.3). Graduation between them is unspecified; the 350
// table keeps the established shape and the others scale from it.
//
// KNOWN RULEBOOK CONTRADICTION (audit log): §5.2 states an "$800,000 round
// purse across all classes", but 160 finishers x $5,000 minimum is already
// $800,000 BEFORE win money. Actual table totals below are ~$1.31M/round.
// Awaiting a boss ruling; the tables honor the specified endpoints.
const steps = (from: number, step: number, n: number): number[] =>
  Array.from({ length: n }, (_, i) => from - step * i);

// 350 Pro — win $75,000 (§5.2), P40 $5,000. Sum $619,000/round.
export const PURSE_350 = [
  75_000, 37_500, 22_500,
  ...steps(22_000, 500, 17),   // P4-P20: 22000 -> 14000
  ...steps(13_500, 500, 10),   // P21-P30: 13500 -> 9000
  8_500, 8_000, 7_500, 7_000, 6_500,        // P31-P35
  6_200, 5_900, 5_600, 5_300, 5_000,        // P36-P40
];

/** Scale the 350 table's shape to a class win payout, preserving the $5k floor. */
const scaledPurse = (winPayout: number): number[] => {
  const f = (winPayout - 5_000) / (75_000 - 5_000);
  return PURSE_350.map(p => 5_000 + Math.round(((p - 5_000) * f) / 50) * 50);
};

export const PURSE_250 = scaledPurse(40_000);    // win $40,000 (§5.2), sum ~$312k
export const PURSE_WOMEN = scaledPurse(20_000);  // win $20,000 (§5.2), sum ~$186k
export const PURSE_250P = scaledPurse(20_000);   // win $20,000 (§5.2), sum ~$186k

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

// Race lengths — rulebook v15.1 §3.6: Sprint 12 min + 1 lap (0.5x),
// Main Event 35 min + 2 laps (1.0x). ALL four classes run identical
// durations (Appendix A) — the old 60% "scaled classes" rule does not exist.
export const RACE_MINUTES = { sprint: 12, main: 35 };

/**
 * 2027 Master Racing Calendar — rulebook v15.1 §10.2, all 20 venues in order.
 * [id, name, location, nation]. 24-week span with 5 bye weeks (3 standard +
 * 2 maritime, §10.1/10.3 — byes are calendar metadata, not race rounds).
 */
export const NAMC_2027_CALENDAR: [string, string, string, string][] = [
  ['fox', 'Fox Raceway', 'Pala, CA', 'USA'],
  ['estero', 'Estero Beach MX', 'Ensenada, BC', 'MEX'],
  ['compedge', 'Competitive Edge MX', 'Adelanto, CA', 'USA'],
  ['motoland', 'Motoland MX Park', 'Casa Grande, AZ', 'USA'],
  ['hangtown', 'Hangtown MX', 'Rancho Murieta, CA', 'USA'],
  ['washougal', 'Washougal MX Park', 'Washougal, WA', 'USA'],
  ['motopark', 'Motopark', 'Chilliwack, BC', 'CAN'],
  ['bigair', 'Big Air Motocross', 'Big Sky, MT', 'USA'],
  ['thunder', 'Thunder Valley MX', 'Lakewood, CO', 'USA'],
  ['freestone', 'Freestone MX', 'Wortham, TX', 'USA'],
  ['springcreek', 'Spring Creek MX', 'Millville, MN', 'USA'],
  ['ironman', 'Ironman Raceway', 'Crawfordsville, IN', 'USA'],
  ['redbud', 'RedBud MX', 'Buchanan, MI', 'USA'],
  ['southwick', 'Southwick MX', 'Southwick, MA', 'USA'],
  ['highpoint', 'High Point Raceway', 'Mt. Morris, PA', 'USA'],
  ['buddscreek', 'Budds Creek MX', 'Mechanicsville, MD', 'USA'],
  ['whistler', 'Whistler MX', 'Whistler, BC', 'CAN'],
  ['anchorage', 'Anchorage MX', 'Anchorage, AK', 'USA'],
  ['waikoloa', 'Waikoloa MX', 'Waikoloa, HI', 'USA'],
  ['glenhelen', 'Glen Helen Raceway', 'Devore, CA', 'USA'],   // SEASON FINALE
];
