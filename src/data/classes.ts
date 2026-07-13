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

/** NAMC Main Race points: 40 down to 1 (rulebook 3.9). */
export const NAMC_POINTS = Array.from({ length: 40 }, (_, i) => 40 - i);

export function roadPointsFor(pos: number): number {
  return pos >= 1 && pos <= ROAD_POINTS.length ? ROAD_POINTS[pos - 1] : 0;
}

export function namcPointsFor(pos: number): number {
  return pos >= 1 && pos <= 40 ? NAMC_POINTS[pos - 1] : 0;
}
