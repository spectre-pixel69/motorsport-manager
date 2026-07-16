// Race simulation engine — lap-by-lap, deterministic under a seeded RNG.
// One engine serves all disciplines; formats differ in laps, grids and points.

import type { Rider, Team, Track, TireBrand, Universe } from '../data/types';
import { clamp, gauss, type RNG } from '../util/rng';
import { mentalPaceFactor, mentalCrashFactor, mentalStartAdjust } from '../game/psychology';

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

/** Per-lap pace in seconds for one rider (lower = faster). */
function lapPace(rng: RNG, e: Entrant, track: Track, wet: boolean, lap: number, laps: number): number {
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
  const raw = track.baseLapSec + skillDeficit + tireEdge + fatigue + noise + wetPenalty + ballast - APPROACH_PACE[e.approach];
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
  if (wet) p *= 2.1;
  p *= mentalCrashFactor(e.rider); // a tilted rider forces it
  return clamp(p * (24 / laps) ** 0.25, 0.0005, 0.05);
}

export function simulateRace(
  rng: RNG, entrants: Entrant[], track: Track, laps: number,
  opts: { wet?: boolean; allowRemount?: boolean } = {},
): RaceOutcome {
  const wet = opts.wet ?? rng() < track.weatherBias;
  const allowRemount = opts.allowRemount ?? track.discipline === 'namc';
  const events: LapEvent[] = [];
  const cumTime: Record<string, number> = {};
  const lapTimes: Record<string, number[]> = {};
  const bestLap: Record<string, number> = {};
  const out: Record<string, { status: 'finished' | 'dnf'; lapsDone: number }> = {};
  const lapOrder: string[][] = [];

  // race-day form: per-rider, per-race pace offset (seconds/lap). Champions
  // still win seasons, but everyone has off weekends — real variance, no
  // rubber-banding. Consistency shrinks the swing.
  const form: Record<string, number> = {};
  for (const e of entrants) {
    form[e.rider.id] = gauss(rng, 0, 0.32 * (1.2 - e.rider.stats.consistency / 250));
  }

  // grid start: convert grid slot into time offset + launch quality
  for (const e of entrants) {
    cumTime[e.rider.id] = e.gridPos * (track.discipline === 'namc' ? 0.18 : 0.35) + startBonus(rng, e);
    lapTimes[e.rider.id] = [];
    bestLap[e.rider.id] = Infinity;
    out[e.rider.id] = { status: 'finished', lapsDone: 0 };
  }

  const holeshot = entrants.slice().sort((a, b) => cumTime[a.rider.id] - cumTime[b.rider.id])[0];
  events.push({ lap: 0, kind: 'fastLap', riderId: holeshot.rider.id, text: `${holeshot.rider.name} grabs the holeshot!` });

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
      } else if (rng() < (100 - e.team.bike.reliability) * 0.00012) {
        st.status = 'dnf';
        st.lapsDone = lap - 1;
        events.push({ lap, kind: 'mechanical', riderId: e.rider.id, text: `${e.rider.name} — mechanical failure. The ${teamMakerName(e)} lets go.` });
        continue;
      }

      const t = lapPace(rng, e, track, wet, lap, laps) + form[e.rider.id];
      cumTime[e.rider.id] += t;
      lapTimes[e.rider.id].push(cumTime[e.rider.id]);
      if (t < bestLap[e.rider.id]) bestLap[e.rider.id] = t;
      st.lapsDone = lap;
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
  const times = entrants.map(e => ({
    id: e.rider.id,
    t: lapPace(rng, e, track, wet, 1, 10) - gauss(rng, 0.3, 0.4), // hot lap: everything on the line
  }));
  times.sort((a, b) => a.t - b.t);
  return times.map(x => x.id);
}

export function lapsForMinutes(track: Track, minutes: number): number {
  return Math.max(4, Math.round((minutes * 60) / track.baseLapSec));
}
