/**
 * MOTOCROSS-SPECIFIC SIMULATION FEATURES
 *
 * Extends base race engine with motocross mechanics:
 * 1. Gate starts (40-rider single gate, all launch simultaneously)
 * 2. Terrain dynamics (surface grip variance, wear multiplication)
 * 3. Fitness impact (stamina degrades pace more aggressively)
 * 4. Moto format framework (support for motos + relegation)
 */

import type { Rider, Track } from '../data/types';
import type { Entrant } from './engine';
import { clamp, gauss, type RNG } from '../util/rng';

export interface GateStartResult {
  /** riderId -> time gain/loss from holeshot (seconds) */
  holeshotter: string;
  startSpread: number; // best to worst start gap (seconds)
  startAdjustments: Record<string, number>;
}

export interface TerrainProfile {
  gripMod: number;           // 0.6-1.2 (affects pace variance)
  wearMod: number;           // 1.0-1.8 (affects reliability/part wear)
  dustFactor: number;        // 0.0-0.3 (traffic dust impact)
  dampness: number;          // 0.0-1.0 (0 = dry, 1 = wet)
}

/** Motocross-specific gate start simulation. */
export function simulateGateStart(
  rng: RNG,
  entrants: Entrant[],
  track: Track,
): GateStartResult {
  // Gate starts: all riders launch from rest simultaneously.
  // Holeshot determined by: starts skill, aggression, approach, luck.
  const adjustments: Record<string, number> = {};

  for (const e of entrants) {
    const s = e.rider.stats;
    // Base: starts skill dominates (0-100)
    const skillBonus = s.starts * -0.015; // skilled riders get negative offset (time advantage)
    // Aggression helps launch (+/- 0.05s per 10 points)
    const aggressionBonus = (s.aggression - 50) * 0.005;
    // Approach affects willingness to risk bad launch
    const approachBonus = e.approach === 'push' ? -0.08 : e.approach === 'conserve' ? 0.12 : 0;
    // Randomness: good gate starts involve timing precision
    const gateLuck = gauss(rng, 0, 0.25); // wide variance; luck matters a lot
    // Mental state affects focus at the line
    const mentalMod = (e.rider.morale > 70 ? -0.05 : e.rider.morale < 40 ? 0.08 : 0);

    adjustments[e.rider.id] = skillBonus + aggressionBonus + approachBonus + gateLuck + mentalMod;
  }

  // Find holeshot winner (best/lowest start time)
  const sorted = Object.entries(adjustments).sort((a, b) => a[1] - b[1]);
  const holeshotter = sorted[0][0];
  const bestStart = sorted[0][1];
  const worstStart = sorted[sorted.length - 1][1];
  const startSpread = worstStart - bestStart;

  // Normalize adjustments to leader's time
  const normalized: Record<string, number> = {};
  for (const [id, adj] of Object.entries(adjustments)) {
    normalized[id] = adj - bestStart;
  }

  return {
    holeshotter,
    startSpread,
    startAdjustments: normalized,
  };
}

/**
 * Get terrain profile for a track based on conditions.
 * Motocross terrain varies (hard-pack, sand, loam, clay).
 * Same track can change significantly based on weather and prep.
 */
export function terrainProfileForRound(
  rng: RNG,
  track: Track,
  wet: boolean,
  round: number,
): TerrainProfile {
  // Terrain type is track-dependent (hardcoded in track DB)
  // But variance adds round-to-round difference
  const baseGrip = track.baseGrip ?? 0.95; // some tracks have naturally higher/lower grip
  const baseDust = track.dustiness ?? 0.15; // how dusty is this track naturally?

  // Weather affects terrain dramatically
  let dampness = 0;
  let gripMod = baseGrip;
  let dustFactor = baseDust;

  if (wet) {
    dampness = 0.7 + rng() * 0.3; // 0.7-1.0 dampness when wet
    gripMod = baseGrip * 0.75; // wet = less traction
    dustFactor = 0; // no dust when wet
  } else {
    dampness = Math.max(0, gauss(rng, 0.1, 0.15)); // natural moisture variance
    gripMod = baseGrip * (0.85 + rng() * 0.3); // 0.85-1.15 grip variance in dry
    dustFactor = baseDust * (0.8 + rng() * 0.4); // dust varies day-to-day
  }

  // Season affects terrain (early season = rougher, mid-season = worn/slick, late = packed down)
  const seasonMod = 1.0 - (round / 40) * 0.15; // slight degradation through season
  gripMod *= seasonMod;

  // Wear multiplier: softer terrain = faster wear
  let wearMod = 1.0;
  if (baseGrip < 0.85) {
    // soft tracks (sand, clay) wear components faster
    wearMod = 1.4 + rng() * 0.4; // 1.4-1.8x wear
  } else if (baseGrip > 1.1) {
    // hard-pack tracks wear slower
    wearMod = 0.7 + rng() * 0.3; // 0.7-1.0x wear
  } else {
    wearMod = 1.0 + rng() * 0.2; // moderate variance
  }

  return {
    gripMod: clamp(gripMod, 0.6, 1.2),
    wearMod: clamp(wearMod, 0.8, 1.8),
    dustFactor: clamp(dustFactor, 0, 0.3),
    dampness: clamp(dampness, 0, 1),
  };
}

/**
 * Fitness impact on motocross pace.
 * Motocross is extremely cardio-intensive; fitness loss = significant pace loss.
 * Formula: base pace + fitness degradation over race duration
 */
export function fitnessPenalty(
  rider: Rider,
  lap: number,
  totalLaps: number,
  startStamina: number,
): number {
  // Fitness score (0-100) affects how long rider can maintain pace
  const fitness = rider.stats.fitness;
  const staminaRemaining = Math.max(0, startStamina - (lap / totalLaps) * 100);

  // Fatigue ramps up over race. Fitness riders maintain better.
  const lapRatio = lap / totalLaps;
  const fatigueFactor = lapRatio ** 1.8; // exponential fatigue curve

  // Base penalty per lap (fitness = 70 gets 0 penalty at lap 1)
  const basePenalty = Math.max(0, (100 - fitness) * 0.0015) * fatigueFactor;

  // Stamina depletion has direct pace cost (training system reduces this)
  const staminaCost = Math.max(0, (100 - staminaRemaining) * 0.0008);

  return basePenalty + staminaCost;
}

/**
 * Aggression impact on motocross (more aggressive = higher crash risk).
 * Motocross riders with high aggression naturally accept higher crash rates.
 */
export function aggressionCrashMod(rider: Rider): number {
  const agg = rider.stats.aggression;
  // 50 = neutral (1.0x), 100 = +2.0x crash rate, 0 = -0.5x crash rate
  return 0.5 + (agg / 100);
}

/**
 * Moto format framework (future use).
 * Tracks whether this race is structured as motos (multiple races) or single moto.
 * Supports relegation tiers, chase races, etc.
 */
export interface MotoFormat {
  isMotoFormat: boolean;      // true = multiple motos, false = single race
  motos: number;              // 1, 2, or 3
  relegation: boolean;        // true = bottom finishers relegated to next tier
  relegationThreshold: number; // e.g., bottom 20 riders compete in "B moto"
  chaseRace: boolean;         // true = inverted grid on moto 2/3
}

export const NAMC_SINGLE_MOTO: MotoFormat = {
  isMotoFormat: false,
  motos: 1,
  relegation: false,
  relegationThreshold: 0,
  chaseRace: false,
};

export const NAMC_DUAL_MOTO: MotoFormat = {
  isMotoFormat: true,
  motos: 2,
  relegation: false,
  relegationThreshold: 0,
  chaseRace: true, // moto 2 uses inverted grid from moto 1
};
