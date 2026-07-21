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
  // 250P: a 250 tuned down to restricted output — the "P" denotes the restriction.
  { id: 'c250p', name: '250P Restricted', shortName: '250P', discipline: 'namc', tier: 4, gridSize: 40, salaryFloor: 100_000 },
];

export const classById = (id: ClassId): ClassDef => CLASSES.find(c => c.id === id)!;

/** Road racing points (MotoGP-style top 15). */
export const ROAD_POINTS = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

/**
 * NAMC Rider's Cup points — rulebook v15.3 §11.2, full 40-position scale.
 * Main Event (1.0x): Every position unique, podium cliff 3rd→4th (52→37 = 15pt gap).
 * P1-P10: 75/60/52/37/36/35/34/33/32/31
 * P11-P20: 30/29/28/27/26/25/24/23/22/21
 * P21-P30: 20/19/18/17/16/15/14/13/12/11
 * P31-P40: 10/9/8/7/6/5/4/3/2/1
 */
export const NAMC_MAIN_POINTS = [
  75, 60, 52, 37, 36, 35, 34, 33, 32, 31,
  30, 29, 28, 27, 26, 25, 24, 23, 22, 21,
  20, 19, 18, 17, 16, 15, 14, 13, 12, 11,
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
];

/** Sprint Race (exactly 0.5x Main Event, §11.2 v15.3): every position value halved. */
export const NAMC_SPRINT_POINTS = [
  37.5, 30.0, 26.0, 18.5, 18.0, 17.5, 17.0, 16.5, 16.0, 15.5,
  15.0, 14.5, 14.0, 13.5, 13.0, 12.5, 12.0, 11.5, 11.0, 10.5,
  10.0, 9.5, 9.0, 8.5, 8.0, 7.5, 7.0, 6.5, 6.0, 5.5,
  5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5,
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

/** MotoGP Main Race points (25/20/16/13/11/10/9.../1/0...). */
export const GP_MAIN_POINTS = [
  25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  ...Array(25).fill(0), // P16-40 get 0 points
];

/** MotoGP Sprint Race points (12/9/7/6/5/4/3/2/1/0...). */
export const GP_SPRINT_POINTS = [
  12, 9, 7, 6, 5, 4, 3, 2, 1,
  ...Array(31).fill(0), // P10-40 get 0 points
];

export function gpMainPointsFor(pos: number): number {
  return pos >= 1 && pos <= GP_MAIN_POINTS.length ? GP_MAIN_POINTS[pos - 1] : 0;
}

export function gpSprintPointsFor(pos: number): number {
  return pos >= 1 && pos <= GP_SPRINT_POINTS.length ? GP_SPRINT_POINTS[pos - 1] : 0;
}

/** WorldSBK Race points (25/20/16/13/11/10/9.../1/0...). Same as GP main. */
export const SBK_RACE_POINTS = GP_MAIN_POINTS;

/** WorldSBK Superpole Race points (12/9/7/6/5/4/3/2/1/0...). Same as GP sprint. */
export const SBK_SUPERPOLE_POINTS = GP_SPRINT_POINTS;

export function sbkRacePointsFor(pos: number): number {
  return pos >= 1 && pos <= SBK_RACE_POINTS.length ? SBK_RACE_POINTS[pos - 1] : 0;
}

export function sbkSuperpolePointsFor(pos: number): number {
  return pos >= 1 && pos <= SBK_SUPERPOLE_POINTS.length ? SBK_SUPERPOLE_POINTS[pos - 1] : 0;
}
