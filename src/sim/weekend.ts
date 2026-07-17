// Race weekend formats.
// Road (GP/SBK): qualifying -> race. Points top 15.
// NAMC (rulebook v15.3 §3.5-3.7, §11.2, Appendix A): Friday hot-lap
// qualifying (sets gate pick order) -> SPRINT RACE (12 min + 1 lap, 0.5x
// points) -> MAIN EVENT (35 min + 2 laps, 1.0x points) on a unified 40-rider
// single gate. All four classes run identical formats.

import type { ChampionshipId, ClassId, Rider, Track, Universe } from '../data/types';
import { namcPointsFor, namcSprintPointsFor, roadPointsFor } from '../data/classes';
import { RACE_MINUTES } from '../data/namc';
import { gridOf } from '../data/universe';
import { simulateQualifying, simulateRace, lapsForMinutes, type Entrant, type RaceOutcome } from './engine';
import { type RNG } from '../util/rng';
import { getWeatherBiasForRound } from '../data/seasonal-weather';

export interface SessionResult {
  name: string;
  outcome: RaceOutcome;
  /** riderId -> championship points earned in this session */
  points: Record<string, number>;
}

export interface WeekendResult {
  classId: ClassId;
  championship: ChampionshipId;
  trackId: string;
  sessions: SessionResult[];
  /** final classification riderIds in order (Main/feature race) */
  finishOrder: string[];
  points: Record<string, number>;   // total champ points this weekend
  weather: 'dry' | 'wet';
}

function toEntrants(u: Universe, riders: Rider[], approach: (r: Rider) => Entrant['approach']): Entrant[] {
  return riders.map((r, i) => ({
    rider: r,
    team: u.teams[r.teamId!],
    tire: u.teams[r.teamId!] ? u.tireBrands[u.teams[r.teamId!].tireBrandId] : undefined,
    gridPos: i + 1,
    approach: approach(r),
  }));
}

const defaultApproach = (): Entrant['approach'] => 'normal';

export function runRoadWeekend(
  rng: RNG, u: Universe, classId: ClassId, trackId: string,
  approachFor: (r: Rider) => Entrant['approach'] = defaultApproach,
  roundNumber?: number,
): WeekendResult {
  const track = u.tracks[trackId];
  const grid = gridOf(u, classId, 'road');
  // Use seasonal weather bias if round number provided, else static bias
  const weatherBias = roundNumber ? getWeatherBiasForRound(trackId, roundNumber) : track.weatherBias;
  const wet = rng() < weatherBias;

  const entrants = toEntrants(u, grid, approachFor);
  const qOrder = simulateQualifying(rng, entrants, track, wet);
  const byId = new Map(entrants.map(e => [e.rider.id, e]));
  qOrder.forEach((id, i) => { byId.get(id)!.gridPos = i + 1; });

  const laps = Math.max(10, Math.round(105 / (track.baseLapSec / 60) / 4)); // ~26 min race
  const race = simulateRace(rng, entrants, track, laps, { wet, allowRemount: false });

  const points: Record<string, number> = {};
  for (const row of race.rows) {
    if (row.status === 'finished') points[row.riderId] = roadPointsFor(row.pos);
  }

  return {
    classId, championship: 'road', trackId,
    sessions: [{ name: 'Race', outcome: race, points }],
    finishOrder: race.rows.map(r => r.riderId),
    points,
    weather: race.weather,
  };
}

export function runNamcWeekend(
  rng: RNG, u: Universe, classId: ClassId, championship: ChampionshipId, trackId: string,
  approachFor: (r: Rider) => Entrant['approach'] = defaultApproach,
  roundNumber?: number,
): WeekendResult {
  const track = u.tracks[trackId];
  const grid = gridOf(u, classId, championship);
  // Use seasonal weather bias if round number provided, else static bias
  const weatherBias = roundNumber ? getWeatherBiasForRound(trackId, roundNumber) : track.weatherBias;
  const wet = rng() < weatherBias;

  // --- Friday hot-lap qualifying (§3.7): fastest qualifier picks his gate
  // first. Grid slot = qualifying rank until rider gate-selection lands.
  const entrants = toEntrants(u, grid, approachFor);
  const qOrder = simulateQualifying(rng, entrants, track, wet);
  const byId = new Map(entrants.map(e => [e.rider.id, e]));
  const setGridFromQual = () => qOrder.forEach((id, i) => { byId.get(id)!.gridPos = i + 1; });

  // --- SPRINT RACE (§3.6): 12 min + 1 lap, half-scale points (§11.2)
  setGridFromQual();
  const sprintLaps = lapsForMinutes(track, RACE_MINUTES.sprint) + 1;
  const sprint = simulateRace(rng, entrants, track, sprintLaps, { wet });
  const sprintPoints: Record<string, number> = {};
  sprint.rows.forEach(row => { sprintPoints[row.riderId] = Math.max(0.5, namcSprintPointsFor(row.pos)); });

  // --- MAIN EVENT (§3.6): 35 min + 2 laps, full points, gate pick from Friday qual
  setGridFromQual();
  const mainLaps = lapsForMinutes(track, RACE_MINUTES.main) + 2;
  const main = simulateRace(rng, entrants, track, mainLaps, { wet });
  const finishOrder = main.rows.map(r => r.riderId);
  const mainPoints: Record<string, number> = {};
  finishOrder.forEach((id, i) => { mainPoints[id] = Math.max(1, namcPointsFor(i + 1)); });

  const points: Record<string, number> = {};
  for (const id of Object.keys(mainPoints)) points[id] = (sprintPoints[id] ?? 0) + mainPoints[id];

  const sessions: SessionResult[] = [
    { name: 'SPRINT RACE', outcome: sprint, points: sprintPoints },
    { name: 'MAIN EVENT', outcome: main, points: mainPoints },
  ];
  return { classId, championship, trackId, sessions, finishOrder, points, weather: main.weather };
}
