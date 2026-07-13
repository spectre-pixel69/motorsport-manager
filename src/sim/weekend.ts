// Race weekend formats.
// Road (GP/SBK): qualifying -> race. Points top 15.
// NAMC (v15.1): hot-lap qualifying (sets gate pick order) -> MAIN RACE on a
// unified 40-rider single gate. No motos, no A/B split, no relegation.
// Points 40-1. (The old A/B-Main structure was the 2S/4S-era rule — removed.)

import type { ChampionshipId, ClassId, Rider, Track, Universe } from '../data/types';
import { namcPointsFor, roadPointsFor } from '../data/classes';
import { RACE_MINUTES, SCALED_CLASSES } from '../data/namc';
import { gridOf } from '../data/universe';
import { simulateQualifying, simulateRace, lapsForMinutes, type Entrant, type RaceOutcome } from './engine';
import { type RNG } from '../util/rng';

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
): WeekendResult {
  const track = u.tracks[trackId];
  const grid = gridOf(u, classId, 'road');
  const wet = rng() < track.weatherBias;

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
): WeekendResult {
  const track = u.tracks[trackId];
  const grid = gridOf(u, classId, championship);
  const wet = rng() < track.weatherBias;
  const scaled = SCALED_CLASSES.includes(classId);
  const mainMin = scaled ? RACE_MINUTES.scaledOutdoor.main : RACE_MINUTES.outdoor.main;

  // --- Hot-lap qualifying (3.4): fastest qualifier picks his gate first.
  // Grid slot = qualifying rank until the rider gate-selection system lands.
  const entrants = toEntrants(u, grid, approachFor);
  const qOrder = simulateQualifying(rng, entrants, track, wet);
  const byId = new Map(entrants.map(e => [e.rider.id, e]));
  qOrder.forEach((id, i) => { byId.get(id)!.gridPos = i + 1; });

  // --- MAIN RACE: unified 40-rider single gate, points 40-1 (3.9)
  const mainLaps = lapsForMinutes(track, mainMin);
  const race = simulateRace(rng, entrants, track, mainLaps, { wet });

  const finishOrder = race.rows.map(r => r.riderId);
  const points: Record<string, number> = {};
  finishOrder.forEach((id, i) => {
    // DNF in the Main still scores 1 pt minimum (rulebook DNF definition)
    points[id] = Math.max(1, namcPointsFor(i + 1));
  });

  const sessions: SessionResult[] = [{ name: 'MAIN RACE', outcome: race, points }];
  return { classId, championship, trackId, sessions, finishOrder, points, weather: race.weather };
}
