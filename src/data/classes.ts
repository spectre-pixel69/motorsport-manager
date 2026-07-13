// Class definitions and championship points tables.

import type { ClassDef, ClassId } from './types';

export const CLASSES: ClassDef[] = [
  // GP ladder (parody MotoGP): GP3 -> GP2 -> GP1
  { id: 'gp1', name: 'GP1 World Championship', shortName: 'GP1', discipline: 'gp', tier: 1, gridSize: 22, salaryFloor: 500_000 },
  { id: 'gp2', name: 'GP2 Intermediate', shortName: 'GP2', discipline: 'gp', tier: 2, gridSize: 26, salaryFloor: 150_000 },
  { id: 'gp3', name: 'GP3 Lightweight', shortName: 'GP3', discipline: 'gp', tier: 3, gridSize: 26, salaryFloor: 60_000 },
  // SBK ladder (parody WSBK): SS300 -> SS600 -> SBK
  { id: 'sbk', name: 'World Superbike', shortName: 'SBK', discipline: 'sbk', tier: 1, gridSize: 22, salaryFloor: 250_000 },
  { id: 'ss600', name: 'World Supersport', shortName: 'SS600', discipline: 'sbk', tier: 2, gridSize: 26, salaryFloor: 90_000 },
  { id: 'ss300', name: 'Supersport 300', shortName: 'SS300', discipline: 'sbk', tier: 3, gridSize: 30, salaryFloor: 40_000 },
  // NAMC classes (rulebook 3.1 / 4.3). Tier weighting order: 350 > 250 > Women's > 250P.
  { id: 'c350', name: '350 Class', shortName: '350', discipline: 'namc', tier: 1, gridSize: 40, salaryFloor: 400_000 },
  { id: 'c250', name: '250 Class', shortName: '250', discipline: 'namc', tier: 2, gridSize: 40, salaryFloor: 200_000 },
  { id: 'women', name: "Women's Pro Class", shortName: 'WPRO', discipline: 'namc', tier: 3, gridSize: 40, salaryFloor: 100_000, womenOnly: true },
  // 250P: a 250 tuned down to 125-spec output — the "P" denotes the restriction.
  // (Internal id stays 'c125' for save/key compatibility.)
  { id: 'c125', name: '250P Restricted', shortName: '250P', discipline: 'namc', tier: 4, gridSize: 40, salaryFloor: 100_000 },
];

export const classById = (id: ClassId): ClassDef => CLASSES.find(c => c.id === id)!;

/** Road racing points (MotoGP-style top 15). */
export const ROAD_POINTS = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

/**
 * NAMC Rider's Cup points — rulebook v15.1 §11.2, full 40-position scale.
 * Main Event (1.0x): 25/22/20/18/16/15/14/13/12/11, then 10..1 (P11-P20),
 * then 1 point each P21-P40. Every finisher scores.
 */
export const NAMC_MAIN_POINTS = [
  25, 22, 20, 18, 16, 15, 14, 13, 12, 11,
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  ...Array.from({ length: 20 }, () => 1),
];

/** Sprint Race (0.5x weight, §11.2): 12.5/11/10/9/8/7.5/7/6.5/6/5.5, then 5..0.5, then 0.5 each P21-P40. */
export const NAMC_SPRINT_POINTS = [
  12.5, 11, 10, 9, 8, 7.5, 7, 6.5, 6, 5.5,
  5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5,
  ...Array.from({ length: 20 }, () => 0.5),
];

export function roadPointsFor(pos: number): number {
  return pos >= 1 && pos <= ROAD_POINTS.length ? ROAD_POINTS[pos - 1] : 0;
}

export function namcPointsFor(pos: number): number {
  return pos >= 1 && pos <= 40 ? NAMC_MAIN_POINTS[pos - 1] : 0;
}

export function namcSprintPointsFor(pos: number): number {
  return pos >= 1 && pos <= 40 ? NAMC_SPRINT_POINTS[pos - 1] : 0;
}
