// Race weekend formats.
// Road (GP/SBK): qualifying -> race. Points top 15.
// NAMC (rulebook 3.x): hot-lap qualifying -> A/B split -> Race 1 + Race 2
// (qualifying races, aggregate sets Main grid) -> Main Race (points 40-1).

import type { ChampionshipId, ClassId, Rider, Track, Universe } from '../data/types';
import { classById, namcPointsFor, roadPointsFor } from '../data/classes';
import { A_MAIN_SIZE, RACE_MINUTES, SCALED_CLASSES } from '../data/namc';
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
  const kind = track.kind === 'stadium' ? 'stadium' : 'outdoor';
  const qualMin = kind === 'stadium' ? (scaled ? RACE_MINUTES.scaled.qual : RACE_MINUTES.stadium.qual)
    : (scaled ? RACE_MINUTES.scaledOutdoor.qual : RACE_MINUTES.outdoor.qual);
  const mainMin = kind === 'stadium' ? (scaled ? RACE_MINUTES.scaled.main : RACE_MINUTES.stadium.main)
    : (scaled ? RACE_MINUTES.scaledOutdoor.main : RACE_MINUTES.outdoor.main);

  const sessions: SessionResult[] = [];

  // --- Hot-lap qualifying (3.4): sets A-Main (top 20) / B-Main (21-40)
  const entrants = toEntrants(u, grid, approachFor);
  const qOrder = simulateQualifying(rng, entrants, track, wet);
  const aIds = new Set(qOrder.slice(0, A_MAIN_SIZE));
  const aField = entrants.filter(e => aIds.has(e.rider.id));
  const bField = entrants.filter(e => !aIds.has(e.rider.id));
  aField.sort((x, y) => qOrder.indexOf(x.rider.id) - qOrder.indexOf(y.rider.id));
  bField.sort((x, y) => qOrder.indexOf(x.rider.id) - qOrder.indexOf(y.rider.id));

  // --- Race 1 + Race 2 (qualifying races; low aggregate = better Main grid)
  const aggregate: Record<string, number> = {};
  const qualLaps = lapsForMinutes(track, qualMin);
  for (const field of [aField, bField]) {
    field.forEach((e, i) => { e.gridPos = i + 1; });
  }
  for (let raceNo = 1; raceNo <= 2; raceNo++) {
    for (const [label, field] of [['B-Main', bField], ['A-Main', aField]] as const) {
      if (field.length === 0) continue;
      const res = simulateRace(rng, field, track, qualLaps, { wet });
      res.rows.forEach(row => {
        // qualifying points = finish position (DNF = field size), rulebook 3.6.1
        aggregate[row.riderId] = (aggregate[row.riderId] ?? 0) + (row.status === 'finished' ? row.pos : field.length);
      });
      sessions.push({ name: `Race ${raceNo} (${label})`, outcome: res, points: {} });
      // next race grid = this race finish order
      const finished = res.rows.map(r => r.riderId);
      field.sort((x, y) => finished.indexOf(x.rider.id) - finished.indexOf(y.rider.id));
      field.forEach((e, i) => { e.gridPos = i + 1; });
    }
  }

  // --- Main Race grids from aggregate: A-Main = best 20 aggregate overall
  const allByAgg = entrants.slice().sort((x, y) =>
    (aggregate[x.rider.id] ?? 999) - (aggregate[y.rider.id] ?? 999) ||
    qOrder.indexOf(x.rider.id) - qOrder.indexOf(y.rider.id));
  const mainA = allByAgg.slice(0, A_MAIN_SIZE);
  const mainB = allByAgg.slice(A_MAIN_SIZE);
  mainA.forEach((e, i) => { e.gridPos = i + 1; });
  mainB.forEach((e, i) => { e.gridPos = i + 1; });

  const mainLaps = lapsForMinutes(track, mainMin);
  const points: Record<string, number> = {};
  let finishOrder: string[] = [];
  let bResult: RaceOutcome | null = null;

  if (mainB.length > 0) {
    bResult = simulateRace(rng, mainB, track, mainLaps, { wet });
    sessions.push({ name: 'B-Main', outcome: bResult, points: {} });
  }
  const aResult = simulateRace(rng, mainA, track, mainLaps, { wet });

  // championship points: A-Main = positions 1-20, B-Main = 21-40 (rulebook 5.10/3.9)
  const aOrder = aResult.rows.map(r => r.riderId);
  const bOrder = bResult ? bResult.rows.map(r => r.riderId) : [];
  finishOrder = [...aOrder, ...bOrder];
  finishOrder.forEach((id, i) => {
    const pos = i + 1;
    // DNF in the Main still scores 1 pt minimum (rulebook DNF definition)
    points[id] = Math.max(1, namcPointsFor(pos));
  });
  const aPoints: Record<string, number> = {};
  aOrder.forEach((id) => { aPoints[id] = points[id]; });
  sessions.push({ name: 'MAIN RACE (A-Main)', outcome: aResult, points: aPoints });

  return { classId, championship, trackId, sessions, finishOrder, points, weather: aResult.weather };
}
