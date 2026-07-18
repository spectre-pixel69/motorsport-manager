// Race simulation engine — lap-by-lap, deterministic under a seeded RNG.
// One engine serves all disciplines; formats differ in laps, grids and points.

import type { BikeComponent, Rider, Team, Track, TireBrand, Universe } from '../data/types';
import { clamp, gauss, type RNG } from '../util/rng';
import { mentalPaceFactor, mentalCrashFactor, mentalStartAdjust } from '../game/psychology';
import { calculateFailureChance, ENGINE_MODE_PACE } from '../game/reliability';
import { simulateGateStart, terrainProfileForRound, fitnessPenalty, aggressionCrashMod } from './motocross';

export interface Entrant {
  rider: Rider;
  team: Team;
  tire?: TireBrand;
  gridPos: number;      // 1-based start position
  approach: 'push' | 'normal' | 'conserve'; // strategy dial
}

export interface LapEvent {
  lap: number;
  kind: 'crash' | 'mechanical' | 'overtake' | 'fastLap' | 'remount';
  riderId: string;
  otherId?: string;
  text: string;
}

export interface RaceResultRow {
  riderId: string;
  teamId: string;
  pos: number;          // final classification (DNFs ranked last)
  totalTime: number;    // seconds (finishers)
  bestLap: number;
  status: 'finished' | 'dnf';
  gapToLeader: number;
  lapsDone: number;
}

export interface RaceOutcome {
  rows: RaceResultRow[];
  events: LapEvent[];
  laps: number;
  weather: 'dry' | 'wet';
  /** lap -> ordered riderIds (for live replay in the timing tower) */
  lapOrder: string[][];
  /** riderId -> cumulative time per lap (for gap display) */
  lapTimes: Record<string, number[]>;
}

const APPROACH_PACE: Record<Entrant['approach'], number> = { push: 0.35, normal: 0, conserve: -0.3 };
const APPROACH_RISK: Record<Entrant['approach'], number> = { push: 1.6, normal: 1.0, conserve: 0.55 };

// Engine mode pace deltas (conserve trades pace for parts life; attack is
// race-day-only maximum) live in game/reliability.ts — single source of truth.
// Global scale on per-component race failure chance so league-wide mechanical
// rates stay near the tuned ~3-5% DNF per race (severity split adds non-DNF
// minor/moderate issues on top).
const MECH_EVENT_SCALE = 0.5;

/** Per-race mechanical risk from the team's component set + engine mode. */
function mechProfile(e: Entrant, laps: number): number {
  const setup = e.team.bikeSetup;
  const mode = setup?.engineMode ?? 'standard';
  const comps: BikeComponent[] = setup?.components && Object.keys(setup.components).length > 0
    ? Object.values(setup.components)
    : [{
        id: 'engine', name: 'Engine', type: 'engine',
        reliability: e.team.bike.reliability, wear: 0, mileageMiles: 0,
      }];
  let raceChance = 0;
  for (const c of comps) {
    raceChance += calculateFailureChance(c, mode, false, e.rider.traits.includes('reckless'), 0, 1.0) / 100;
  }
  return Math.min(0.4, raceChance * MECH_EVENT_SCALE) / laps;
}

/** Per-lap pace in seconds for one rider (lower = faster). */
function lapPace(
  rng: RNG,
  e: Entrant,
  track: Track,
  wet: boolean,
  lap: number,
  laps: number,
  stamina: number,
  terrain: { gripMod: number; dustFactor: number },
): number {
  const s = e.rider.stats;
  const bike = e.team.bike;
  const skill = wet ? s.pace * 0.7 + s.wet * 0.3 : s.pace;
  // 100-rated package hits baseLap; every point below costs time.
  const skillDeficit = (100 - (skill * 0.62 + bike.engine * 0.19 + bike.handling * 0.19)) * (track.baseLapSec * 0.0022);
  const tireEdge = e.tire ? (78 - e.tire.grip) * 0.012 : 0;
  // fatigue in the final third, mitigated by fitness
  const fatigue = lap > laps * 0.66 ? (lap - laps * 0.66) * (0.05 * (1 - s.fitness / 110)) : 0;
  const noise = Math.abs(gauss(rng, 0, (110 - s.consistency) * 0.012));
  const wetPenalty = wet ? track.baseLapSec * 0.08 : 0;
  const ballast = (e.rider.ballastKg ?? 0) * 0.07;   // BOP success ballast: ~0.07s/lap per kg
  // Motocross-specific fitness penalty (stamina matters more)
  const fitnessCost = track.discipline === 'namc' ? fitnessPenalty(e.rider, lap, laps, stamina) : 0;
  // Grip variance affects pace (tracks with lower grip = slower, dusty = less consistent)
  const gripVariance = track.discipline === 'namc' ? (1.0 - terrain.gripMod) * 0.02 : 0;
  const modePace = ENGINE_MODE_PACE[e.team.bikeSetup?.engineMode ?? 'standard'] ?? 0;
  const raw = track.baseLapSec + skillDeficit + tireEdge + fatigue + noise + wetPenalty + ballast + fitnessCost + gripVariance + modePace - APPROACH_PACE[e.approach];
  // mental state nudges the edges (hard-capped ±1% inside the factor)
  return raw * mentalPaceFactor(e.rider);
}

/** Start performance: lower = better launch. */
function startBonus(rng: RNG, e: Entrant): number {
  return (100 - e.rider.stats.starts) * 0.02 + rng() * 1.2 - APPROACH_PACE[e.approach] * 0.5
    + mentalStartAdjust(e.rider);
}

function crashChance(e: Entrant, wet: boolean, laps: number): number {
  const s = e.rider.stats;
  // per-lap probability; season-long ≈ realistic DNF rates
  let p = 0.0022 + (s.aggression / 100) * 0.0035 * APPROACH_RISK[e.approach] + (100 - s.consistency) * 0.00003;
  // Aggression affects crash risk more in motocross (natural terrain variance)
  p *= aggressionCrashMod(e.rider);
  if (wet) p *= 2.1;
  p *= mentalCrashFactor(e.rider); // a tilted rider forces it
  return clamp(p * (24 / laps) ** 0.25, 0.0005, 0.05);
}

export function simulateRace(
  rng: RNG, entrants: Entrant[], track: Track, laps: number,
  opts: { wet?: boolean; allowRemount?: boolean; round?: number } = {},
): RaceOutcome {
  const wet = opts.wet ?? rng() < track.weatherBias;
  const allowRemount = opts.allowRemount ?? track.discipline === 'namc';
  const round = opts.round ?? 1;
  const events: LapEvent[] = [];
  const cumTime: Record<string, number> = {};
  const lapTimes: Record<string, number[]> = {};
  const bestLap: Record<string, number> = {};
  const out: Record<string, { status: 'finished' | 'dnf'; lapsDone: number }> = {};
  const lapOrder: string[][] = [];

  // Terrain profile (motocross only): affects grip, wear, dust
  const terrain = track.discipline === 'namc'
    ? terrainProfileForRound(rng, track, wet, round)
    : { gripMod: 1.0, wearMod: 1.0, dustFactor: 0, dampness: wet ? 0.8 : 0.1 };

  // race-day form: per-rider, per-race pace offset (seconds/lap). Champions
  // still win seasons, but everyone has off weekends — real variance, no
  // rubber-banding. Consistency shrinks the swing.
  const form: Record<string, number> = {};
  const stamina: Record<string, number> = {}; // rider stamina per race (0-100)
  // per-rider mechanical state: per-lap failure odds + accumulated pace
  // penalty from minor/moderate failures (graduated failure spec)
  const mech: Record<string, { perLap: number; penalty: number }> = {};
  for (const e of entrants) {
    form[e.rider.id] = gauss(rng, 0, 0.32 * (1.2 - e.rider.stats.consistency / 250));
    stamina[e.rider.id] = 100; // start at full stamina
    mech[e.rider.id] = { perLap: mechProfile(e, laps), penalty: 0 };
  }

  // grid start: motocross uses gate starts (all riders launch simultaneously)
  // road disciplines use staggered starts (grid position → time offset)
  let holeshot: Entrant;
  if (track.discipline === 'namc') {
    const gateStart = simulateGateStart(rng, entrants, track);
    for (const e of entrants) {
      cumTime[e.rider.id] = gateStart.startAdjustments[e.rider.id];
      lapTimes[e.rider.id] = [];
      bestLap[e.rider.id] = Infinity;
      out[e.rider.id] = { status: 'finished', lapsDone: 0 };
    }
    holeshot = entrants.find(e => e.rider.id === gateStart.holeshotter)!;
    events.push({
      lap: 0,
      kind: 'fastLap',
      riderId: holeshot.rider.id,
      text: `${holeshot.rider.name} grabs the holeshot! (gap to last: ${gateStart.startSpread.toFixed(2)}s)`,
    });
  } else {
    // road: staggered start based on grid position
    for (const e of entrants) {
      cumTime[e.rider.id] = e.gridPos * 0.35 + startBonus(rng, e);
      lapTimes[e.rider.id] = [];
      bestLap[e.rider.id] = Infinity;
      out[e.rider.id] = { status: 'finished', lapsDone: 0 };
    }
    holeshot = entrants.slice().sort((a, b) => cumTime[a.rider.id] - cumTime[b.rider.id])[0];
    events.push({ lap: 0, kind: 'fastLap', riderId: holeshot.rider.id, text: `${holeshot.rider.name} grabs the holeshot!` });
  }

  let prevOrder: string[] = [];
  for (let lap = 1; lap <= laps; lap++) {
    for (const e of entrants) {
      const st = out[e.rider.id];
      if (st.status === 'dnf') continue;

      // incident roll
      if (rng() < crashChance(e, wet, laps)) {
        if (allowRemount && rng() < 0.55) {
          const loss = 8 + rng() * 20;
          cumTime[e.rider.id] += loss;
          events.push({ lap, kind: 'remount', riderId: e.rider.id, text: `${e.rider.name} goes down but remounts! Loses ${loss.toFixed(0)}s` });
        } else {
          st.status = 'dnf';
          st.lapsDone = lap - 1;
          const p = posOf(e.rider.id, prevOrder);
          events.push({ lap, kind: 'crash', riderId: e.rider.id, text: p ? `${e.rider.name} CRASHES OUT of P${p}!` : `${e.rider.name} CRASHES OUT on the opening lap!` });
          continue;
        }
      } else if (rng() < mech[e.rider.id].perLap) {
        // Graduated failure (spec): 50% minor / 30% moderate / 20% terminal
        const sev = rng();
        if (sev < 0.5) {
          const loss = 1.2 + rng() * 2.0;
          mech[e.rider.id].penalty += loss;
          events.push({ lap, kind: 'mechanical', riderId: e.rider.id, text: `${e.rider.name}'s ${teamMakerName(e)} is smoking — nursing it home ~${loss.toFixed(1)}s/lap down.` });
        } else if (sev < 0.8) {
          const loss = 2.8 + rng() * 2.0;
          mech[e.rider.id].penalty += loss;
          events.push({ lap, kind: 'mechanical', riderId: e.rider.id, text: `${e.rider.name} forced to dial the engine right back — ~${loss.toFixed(1)}s/lap slower.` });
        } else {
          st.status = 'dnf';
          st.lapsDone = lap - 1;
          events.push({ lap, kind: 'mechanical', riderId: e.rider.id, text: `${e.rider.name} — mechanical failure. The ${teamMakerName(e)} lets go.` });
          continue;
        }
      }

      const t = lapPace(rng, e, track, wet, lap, laps, stamina[e.rider.id], terrain) + form[e.rider.id] + mech[e.rider.id].penalty;
      cumTime[e.rider.id] += t;
      lapTimes[e.rider.id].push(cumTime[e.rider.id]);
      if (t < bestLap[e.rider.id]) bestLap[e.rider.id] = t;
      st.lapsDone = lap;

      // Motocross stamina decay: riders tire as race progresses
      if (track.discipline === 'namc') {
        stamina[e.rider.id] = Math.max(0, stamina[e.rider.id] - (100 / laps));
      }
    }

    const order = entrants
      .filter(e => out[e.rider.id].status !== 'dnf')
      .sort((a, b) => cumTime[a.rider.id] - cumTime[b.rider.id])
      .map(e => e.rider.id);
    // overtake events for position changes at the front
    if (prevOrder.length > 0) {
      for (let i = 0; i < Math.min(6, order.length); i++) {
        const id = order[i];
        const prev = prevOrder.indexOf(id);
        if (prev > i && prev !== -1) {
          const passed = prevOrder[i];
          if (passed && order.includes(passed)) {
            const r = entrants.find(x => x.rider.id === id)!.rider;
            events.push({ lap, kind: 'overtake', riderId: id, otherId: passed, text: `${r.name} moves up to P${i + 1}!` });
          }
        }
      }
    }
    prevOrder = order;
    lapOrder.push(order);
  }

  // classification
  const finishers = entrants
    .filter(e => out[e.rider.id].status === 'finished')
    .sort((a, b) => cumTime[a.rider.id] - cumTime[b.rider.id]);
  const dnfs = entrants
    .filter(e => out[e.rider.id].status === 'dnf')
    .sort((a, b) => out[b.rider.id].lapsDone - out[a.rider.id].lapsDone);

  const leaderTime = finishers.length ? cumTime[finishers[0].rider.id] : 0;
  const rows: RaceResultRow[] = [];
  finishers.forEach((e, i) => rows.push({
    riderId: e.rider.id, teamId: e.team.id, pos: i + 1,
    totalTime: cumTime[e.rider.id], bestLap: bestLap[e.rider.id],
    status: 'finished', gapToLeader: cumTime[e.rider.id] - leaderTime,
    lapsDone: out[e.rider.id].lapsDone,
  }));
  dnfs.forEach((e, i) => rows.push({
    riderId: e.rider.id, teamId: e.team.id, pos: finishers.length + i + 1,
    totalTime: Infinity, bestLap: bestLap[e.rider.id] === Infinity ? 0 : bestLap[e.rider.id],
    status: 'dnf', gapToLeader: Infinity,
    lapsDone: out[e.rider.id].lapsDone,
  }));

  return { rows, events, laps, weather: wet ? 'wet' : 'dry', lapOrder, lapTimes };
}

function posOf(id: string, order: string[]): number {
  const i = order.indexOf(id);
  return i === -1 ? 0 : i + 1;
}
function teamMakerName(e: Entrant): string {
  return e.team.name.split(' ')[0];
}

/** One-lap qualifying: returns riders sorted fastest-first. */
export function simulateQualifying(rng: RNG, entrants: Entrant[], track: Track, wet: boolean): string[] {
  const terrain = track.discipline === 'namc'
    ? terrainProfileForRound(rng, track, wet, 1)
    : { gripMod: 1.0, dustFactor: 0, wearMod: 1.0, dampness: 0 };
  const times = entrants.map(e => ({
    id: e.rider.id,
    t: lapPace(rng, e, track, wet, 1, 10, 100, terrain) - gauss(rng, 0.3, 0.4), // hot lap: everything on the line
  }));
  times.sort((a, b) => a.t - b.t);
  return times.map(x => x.id);
}

export function lapsForMinutes(track: Track, minutes: number): number {
  return Math.max(4, Math.round((minutes * 60) / track.baseLapSec));
}
