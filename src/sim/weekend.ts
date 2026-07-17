// Race weekend formats.
// Road (GP/SBK): qualifying -> race. Points top 15.
// NAMC (rulebook v15.3 §3.5-3.7, §11.2, Appendix A): Friday hot-lap
// qualifying (sets gate pick order) -> SPRINT RACE (12 min + 1 lap, 0.5x
// points) -> MAIN EVENT (35 min + 2 laps, 1.0x points) on a unified 40-rider
// single gate. All four classes run identical formats.

import type { ChampionshipId, ClassId, Rider, Track, Universe } from '../data/types';
import {
  namcPointsFor, namcSprintPointsFor, roadPointsFor,
  gpMainPointsFor, gpSprintPointsFor,
  sbkRacePointsFor, sbkSuperpolePointsFor,
} from '../data/classes';
import { RACE_MINUTES } from '../data/namc';
import { gridOf } from '../data/universe';
import { simulateQualifying, simulateRace, lapsForMinutes, type Entrant, type RaceOutcome } from './engine';
import { simulatePracticeSession, type PracticeSessionOutcome } from './motocross';
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
  const race = simulateRace(rng, entrants, track, laps, { wet, allowRemount: false, round: roundNumber });

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

  // --- FRIDAY PRACTICE (§3.5): Two 30-minute practice sessions (AM and PM)
  // Riders can crash, sustain injuries, and dial in bike setup
  const entrants = toEntrants(u, grid, approachFor);
  const practiceOutcomes: Record<string, PracticeSessionOutcome> = {};
  let injuredRiders: Set<string> = new Set();

  for (let session = 0; session < 2; session++) {
    for (const e of entrants) {
      // Only run practice if rider not already out from first session
      if (injuredRiders.has(e.rider.id)) continue;

      const outcome = simulatePracticeSession(rng, e.rider, track, wet);
      practiceOutcomes[e.rider.id] = outcome;

      // Track severe injuries (riders who won't make qualifying/races)
      if (outcome.injurySidelines > 0) {
        injuredRiders.add(e.rider.id);
      }
    }
  }

  // Filter out severely injured riders from races
  const activeEntrants = entrants.filter(e => !injuredRiders.has(e.rider.id));

  // --- Friday hot-lap qualifying (§3.7): fastest qualifier picks his gate
  // first. Grid slot = qualifying rank until rider gate-selection lands.
  const qOrder = simulateQualifying(rng, activeEntrants, track, wet);
  const byId = new Map(activeEntrants.map(e => [e.rider.id, e]));
  const setGridFromQual = () => qOrder.forEach((id, i) => { byId.get(id)!.gridPos = i + 1; });

  // --- SPRINT RACE (§3.6): 12 min + 1 lap, half-scale points (§11.2)
  setGridFromQual();
  const sprintLaps = lapsForMinutes(track, RACE_MINUTES.sprint) + 1;
  const sprint = simulateRace(rng, activeEntrants, track, sprintLaps, { wet, round: roundNumber });
  const sprintPoints: Record<string, number> = {};
  sprint.rows.forEach(row => { sprintPoints[row.riderId] = Math.max(0.5, namcSprintPointsFor(row.pos)); });

  // --- MAIN EVENT (§3.6): 35 min + 2 laps, full points, gate pick from Friday qual
  setGridFromQual();
  const mainLaps = lapsForMinutes(track, RACE_MINUTES.main) + 2;
  const main = simulateRace(rng, activeEntrants, track, mainLaps, { wet, round: roundNumber });
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

export function runGPWeekend(
  rng: RNG, u: Universe, classId: ClassId, trackId: string,
  approachFor: (r: Rider) => Entrant['approach'] = defaultApproach,
  roundNumber?: number,
): WeekendResult {
  const track = u.tracks[trackId];
  const grid = gridOf(u, classId, 'road');
  const weatherBias = roundNumber ? getWeatherBiasForRound(trackId, roundNumber) : track.weatherBias;
  const wet = rng() < weatherBias;

  // --- FRIDAY & SATURDAY PRACTICE + QUALIFYING
  const entrants = toEntrants(u, grid, approachFor);
  const qOrder = simulateQualifying(rng, entrants, track, wet);
  const byId = new Map(entrants.map(e => [e.rider.id, e]));
  const setGridFromQual = () => qOrder.forEach((id, i) => { byId.get(id)!.gridPos = i + 1; });

  // --- SATURDAY SPRINT (12/9/7/6/5/4/3/2/1 points, ~13km = ~12 min)
  setGridFromQual();
  const sprintLaps = Math.max(5, Math.round(13 / (track.lengthKm) * 1.2)); // ~12 minutes
  const sprint = simulateRace(rng, entrants, track, sprintLaps, { wet, allowRemount: false, round: roundNumber });
  const sprintPoints: Record<string, number> = {};
  sprint.rows.forEach(row => { sprintPoints[row.riderId] = gpSprintPointsFor(row.pos); });

  // --- SUNDAY MAIN RACE (25/20/16/13/11/10/9.../1 points, ~105km = ~45 min)
  setGridFromQual();
  const mainLaps = Math.max(12, Math.round(105 / (track.lengthKm))); // ~45 minutes
  const main = simulateRace(rng, entrants, track, mainLaps, { wet, allowRemount: false, round: roundNumber });
  const finishOrder = main.rows.map(r => r.riderId);
  const mainPoints: Record<string, number> = {};
  finishOrder.forEach((id, i) => { mainPoints[id] = gpMainPointsFor(i + 1); });

  const points: Record<string, number> = {};
  for (const id of Object.keys(mainPoints)) points[id] = (sprintPoints[id] ?? 0) + mainPoints[id];

  const sessions: SessionResult[] = [
    { name: 'SPRINT RACE', outcome: sprint, points: sprintPoints },
    { name: 'MAIN RACE', outcome: main, points: mainPoints },
  ];
  return { classId, championship: 'road', trackId, sessions, finishOrder, points, weather: main.weather };
}

export function runSBKWeekend(
  rng: RNG, u: Universe, classId: ClassId, trackId: string,
  approachFor: (r: Rider) => Entrant['approach'] = defaultApproach,
  roundNumber?: number,
): WeekendResult {
  const track = u.tracks[trackId];
  const grid = gridOf(u, classId, 'road');
  const weatherBias = roundNumber ? getWeatherBiasForRound(trackId, roundNumber) : track.weatherBias;
  const wet = rng() < weatherBias;

  // --- FRIDAY & SATURDAY PRACTICE + SUPERPOLE
  const entrants = toEntrants(u, grid, approachFor);
  const qOrder = simulateQualifying(rng, entrants, track, wet);
  const byId = new Map(entrants.map(e => [e.rider.id, e]));
  const setGridFromQual = () => qOrder.forEach((id, i) => { byId.get(id)!.gridPos = i + 1; });

  // --- SATURDAY SUPERPOLE RACE (12/9/7/6/5/4/3/2/1 points, ~12km = ~12 min)
  setGridFromQual();
  const superpoleLaps = Math.max(5, Math.round(12 / (track.lengthKm) * 1.2)); // ~12 minutes
  const superpole = simulateRace(rng, entrants, track, superpoleLaps, { wet, allowRemount: false, round: roundNumber });
  const superpolePoints: Record<string, number> = {};
  superpole.rows.forEach(row => { superpolePoints[row.riderId] = sbkSuperpolePointsFor(row.pos); });

  // --- SUNDAY RACE 1 (25/20/16/13/11/10/9.../1 points, ~25km = ~25 min)
  setGridFromQual();
  const race1Laps = Math.max(8, Math.round(25 / (track.lengthKm) * 1.1)); // ~25 minutes
  const race1 = simulateRace(rng, entrants, track, race1Laps, { wet, allowRemount: false, round: roundNumber });
  const race1Points: Record<string, number> = {};
  const race1FinishOrder: string[] = [];
  race1.rows.forEach(row => {
    race1Points[row.riderId] = sbkRacePointsFor(row.pos);
    race1FinishOrder.push(row.riderId);
  });

  // --- SUNDAY RACE 2 (with grid reversal for top 6)
  // Build reversed grid: top 6 from Race 1 are reversed, rest in order
  const race2Grid: string[] = [];
  const top6 = race1FinishOrder.slice(0, 6).reverse();
  const rest = race1FinishOrder.slice(6);
  race2Grid.push(...top6, ...rest);

  // Update grid positions for Race 2 entrants
  race2Grid.forEach((riderId, idx) => {
    const e = byId.get(riderId);
    if (e) e.gridPos = idx + 1;
  });

  const race2 = simulateRace(rng, entrants, track, race1Laps, { wet, allowRemount: false, round: roundNumber });
  const finishOrder = race2.rows.map(r => r.riderId);
  const race2Points: Record<string, number> = {};
  finishOrder.forEach((id, i) => { race2Points[id] = sbkRacePointsFor(i + 1); });

  // Aggregate points
  const points: Record<string, number> = {};
  for (const id of Object.keys(superpolePoints)) points[id] = (superpolePoints[id] ?? 0);
  for (const id of Object.keys(race1Points)) points[id] = (points[id] ?? 0) + race1Points[id];
  for (const id of Object.keys(race2Points)) points[id] = (points[id] ?? 0) + race2Points[id];

  const sessions: SessionResult[] = [
    { name: 'SUPERPOLE RACE', outcome: superpole, points: superpolePoints },
    { name: 'RACE 1', outcome: race1, points: race1Points },
    { name: 'RACE 2', outcome: race2, points: race2Points },
  ];
  return { classId, championship: 'road', trackId, sessions, finishOrder, points, weather: race2.weather };
}
