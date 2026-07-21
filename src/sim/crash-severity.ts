/**
 * CRASH SEVERITY SYSTEM (5-Level Model)
 *
 * Motocross crash outcomes determined by:
 * 1. Crash severity percentage (0-100) - emerges from bike condition, track, rider, weather
 * 2. Severity level (1-5) - determines which components/body parts are affected
 * 3. Component damage tree - what breaks: handlebars → chain → swing arm → fork → engine
 * 4. Injury tree - what hurts: twisted ankle → rib → concussion → major injury → out 4-6 weeks
 *
 * Example: 15% crash = Level 1 (bent handlebars, twisted ankle)
 *          45% crash = Level 3 (swing arm damage, rib injury)
 *          92% crash = Level 5 (engine blows, major injury, out 4-6 weeks)
 */

import type { Rider } from '../data/types';
import type { RNG } from '../util/rng';

export type CrashSeverityLevel = 1 | 2 | 3 | 4 | 5;

export interface BikeDamageOutcome {
  level: CrashSeverityLevel;
  components: {
    handlebars?: { bent: boolean };           // Level 1: handlebars bent
    chain?: { damaged: boolean };              // Level 1: chain came off or kinked
    swingArm?: { bent: boolean };              // Level 2: swing arm bent
    tires?: { punctured: boolean };            // Level 2: tire damage
    forks?: { damaged: boolean };              // Level 3: fork brace cracked/bent
    engine?: { clogged: boolean; damaged: boolean }; // Level 4: engine clogged with mud, Level 5: blows
    frame?: { cracked: boolean };              // Level 4-5: frame damage
  };
  repairDifficulty: 'quick-fix' | 'workshop' | 'major' | 'diagnosis-required' | 'total-loss';
  totalBikeDamage: number;                   // 0-1 severity
  canContinueRacing: boolean;                // Level 1-2 yes, Level 3-4 maybe, Level 5 no
  estimatedRepairRounds: number;             // How many rounds to repair (0 = same day, 1+ = off-weeks)
}

export interface RiderInjuryOutcome {
  level: CrashSeverityLevel;
  injuries: {
    twistedAnkle?: { severity: 'mild' | 'moderate' };        // Level 1: can race
    pulledMuscle?: { location: string; severity: 'mild' };   // Level 1: can race
    ribInjury?: { severity: 'moderate' };                    // Level 2: ribs injured, can race
    thighContusion?: { severity: 'moderate' };               // Level 2: thigh contusion, can race
    concussion?: { severity: 'mild' | 'moderate' | 'severe' }; // Level 3-4
    brokenBone?: { location: string; severity: 'moderate' }; // Level 4
    majorInjury?: { description: string; severity: 'severe' }; // Level 5
  };
  sidelinesRounds: number;                  // Level 1: 0, Level 2: 0, Level 3: 0-1, Level 4: 1-3, Level 5: 4-6
  canRaceThisWeekend: boolean;
}

export interface CrashOutcome {
  severityPercent: number;                // 0-100, emergent from factors
  level: CrashSeverityLevel;              // 1-5, determined by severityPercent
  bike: BikeDamageOutcome;
  rider: RiderInjuryOutcome;
}

/**
 * Determine crash severity level from percentage (0-100).
 * Level 1: 0-20% (minor)
 * Level 2: 20-40% (moderate)
 * Level 3: 40-60% (major)
 * Level 4: 60-85% (severe)
 * Level 5: 85-100% (catastrophic)
 */
export function severityLevelFromPercent(percent: number): CrashSeverityLevel {
  if (percent < 20) return 1;
  if (percent < 40) return 2;
  if (percent < 60) return 3;
  if (percent < 85) return 4;
  return 5;
}

/**
 * Calculate crash severity percentage from multiple factors (0-100 scale).
 * Real-world basis (UF Health study, 20+ years motocross data):
 * - 30% of crashes → hospital admission (severe)
 * - 71% sustain fractures/dislocations (moderate to severe)
 * - 48% suffer concussions (significant impact)
 * - ~5% are catastrophic (season-ending)
 *
 * Factors:
 * - Bike wear (higher wear = more severe)
 * - Rider racecraft (inexperienced = worse injuries)
 * - Track grip (slippery = loss of control = severe)
 * - Fitness (low fitness = more impact injuries)
 * - Weather (wet = harder crashes)
 */
export function calculateCrashSeverity(
  rng: RNG,
  rider: Rider,
  bikeWear: number,        // 0-1 (0 = new, 1 = worn out)
  trackGrip: number,       // 0.6-1.2 (lower = slippery)
  wet: boolean,
): number {
  const s = rider.stats;

  // Factor 1: Bike condition (worn bikes = more severe crashes)
  // Base severity multiplier: 0.8-1.5x
  const wearFactor = 0.8 + (bikeWear * 0.7);

  // Factor 2: Rider racecraft/experience (skill reduces injury severity)
  // Racecraft 80 = 0.7x; racecraft 30 = 1.5x
  const racecroftSkill = rider.skills?.racecraft ?? 50;
  const racecroftFactor = 1.6 - Math.min(0.9, (racecroftSkill / 100) * 0.9);

  // Factor 3: Track grip (slippery = loss of control = more severe crashes)
  // Grip 1.2 (grippy) = 0.7x; grip 0.6 (slippery) = 1.8x
  const gripFactor = 1.5 - (trackGrip * 0.75);

  // Factor 4: Fitness (low fitness = absorb impact worse)
  // Fitness 90 = 0.6x; fitness 30 = 1.4x
  const fitnessFactor = 1.5 - (s.fitness / 100) * 0.9;

  // Factor 5: Weather (wet = reduced control = harder crashes)
  const weatherFactor = wet ? 1.5 : 1.0;

  // Base severity: 40-60% for typical crash
  // Real data: mean ~50%, range 10-100% across all crash outcomes
  const baseSeverity = 40 + 30 * rng();

  // Combine factors multiplicatively, then normalize
  let severity = baseSeverity * wearFactor * racecroftFactor * gripFactor * fitnessFactor * weatherFactor;

  // Add variance (luck factor ±20%)
  severity += (rng() - 0.5) * 40;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, severity));
}

/**
 * Generate bike damage outcome for a given severity level.
 */
export function generateBikeDamage(level: CrashSeverityLevel, rng: RNG): BikeDamageOutcome {
  const components: BikeDamageOutcome['components'] = {};
  let totalDamage = 0;
  let repairDifficulty: BikeDamageOutcome['repairDifficulty'] = 'quick-fix';

  if (level >= 1) {
    // Level 1: Minor cosmetic + drivetrain
    components.handlebars = { bent: rng() < 0.7 };  // 70% chance bent handlebars
    components.chain = { damaged: rng() < 0.4 };    // 40% chance chain issue
    totalDamage = 0.15 + rng() * 0.15;              // 15-30% bike damage
    repairDifficulty = 'quick-fix';
  }

  if (level >= 2) {
    // Level 2: Suspension/frame damage
    components.swingArm = { bent: rng() < 0.5 };    // 50% swing arm bent
    components.tires = { punctured: rng() < 0.3 };  // 30% tire puncture
    totalDamage = 0.30 + rng() * 0.20;              // 30-50% bike damage
    repairDifficulty = 'workshop';
  }

  if (level >= 3) {
    // Level 3: Front end/engine damage
    components.forks = { damaged: rng() < 0.6 };    // 60% fork damage
    totalDamage = 0.50 + rng() * 0.20;              // 50-70% bike damage
    repairDifficulty = 'major';
  }

  if (level >= 4) {
    // Level 4: Engine damage (clogged or broken)
    components.engine = {
      clogged: rng() < 0.4,                         // 40% mud clogged
      damaged: rng() < 0.6,                         // 60% internal damage
    };
    components.frame = { cracked: rng() < 0.3 };    // 30% frame crack
    totalDamage = 0.70 + rng() * 0.25;              // 70-95% bike damage
    repairDifficulty = 'diagnosis-required';        // Needs full diagnostic
  }

  if (level >= 5) {
    // Level 5: Catastrophic failure
    components.engine = { clogged: true, damaged: true }; // Engine blown
    components.frame = { cracked: true };           // Frame definitely damaged
    totalDamage = 1.0;                              // 100% bike damage = total loss
    repairDifficulty = 'total-loss';
  }

  return {
    level,
    components,
    repairDifficulty,
    totalBikeDamage: Math.min(1.0, totalDamage),
    canContinueRacing: level <= 2,                  // Level 3+ can't continue
    estimatedRepairRounds: level <= 1 ? 0 : level <= 2 ? 1 : level <= 3 ? 2 : level === 4 ? 3 : 999,
  };
}

/**
 * Generate rider injury outcome for a given severity level.
 */
export function generateRiderInjury(level: CrashSeverityLevel, rider: Rider, rng: RNG): RiderInjuryOutcome {
  const injuries: RiderInjuryOutcome['injuries'] = {};
  let sidelinesRounds = 0;

  const durability = (rider.stats.fitness + (rider.traits?.includes('fragile') ? -15 : 0)) / 100;

  if (level >= 1) {
    // Level 1: Minor injuries (can race)
    if (rng() < 0.6 * durability) {
      injuries.twistedAnkle = { severity: 'mild' };
    }
    if (rng() < 0.4 * durability) {
      injuries.pulledMuscle = { location: 'shoulder or leg', severity: 'mild' };
    }
    sidelinesRounds = 0;
  }

  if (level >= 2) {
    // Level 2: Moderate injuries (most can race, ~10% sideline for 1 round)
    if (rng() < 0.6 * durability) {
      injuries.ribInjury = { severity: 'moderate' };
    }
    if (rng() < 0.5 * durability) {
      injuries.thighContusion = { severity: 'moderate' };
    }
    // Small chance of sidelining at Level 2 (real data: some moderate crashes = hospitalization)
    if (rng() < 0.08 * (1 - durability)) {
      sidelinesRounds = 1;
    }
  }

  if (level >= 3) {
    // Level 3: Significant injuries (50%+ sideline for 1 round, real data shows 30% hospitalized)
    if (rng() < 0.8 * durability) {
      injuries.concussion = { severity: 'mild' };
      sidelinesRounds = Math.max(sidelinesRounds, rng() < 0.6 ? 1 : 0);  // 60% sideline after concussion
    }
    if (rng() < 0.4 * durability) {
      injuries.brokenBone = { location: 'minor (toe, finger)', severity: 'moderate' };
      sidelinesRounds = Math.max(sidelinesRounds, 1);  // Broken bones sideline
    }
    if (sidelinesRounds === 0 && rng() < 0.4) {
      sidelinesRounds = 1;  // 40% of Level 3 get sidelined for other reasons
    }
  }

  if (level >= 4) {
    // Level 4: Severe injuries (sideline 1-3 rounds)
    if (rng() < 0.8 * durability) {
      injuries.concussion = { severity: 'moderate' };
    }
    if (rng() < 0.5 * durability) {
      injuries.brokenBone = { location: 'arm or leg', severity: 'moderate' };
    }
    sidelinesRounds = Math.ceil(1 + rng() * 2);  // 1-3 rounds
  }

  if (level >= 5) {
    // Level 5: Major injury (out 4-6 weeks)
    injuries.majorInjury = {
      description: 'severe impact injury',
      severity: 'severe',
    };
    sidelinesRounds = Math.ceil(4 + rng() * 2);  // 4-6 rounds (or ~2 weeks)
  }

  return {
    level,
    injuries,
    sidelinesRounds,
    canRaceThisWeekend: sidelinesRounds === 0,
  };
}

/**
 * Simulate a crash with full outcome (bike damage + rider injury).
 */
export function simulateCrash(
  rng: RNG,
  rider: Rider,
  bikeWear: number,
  trackGrip: number,
  wet: boolean,
): CrashOutcome {
  const severityPercent = calculateCrashSeverity(rng, rider, bikeWear, trackGrip, wet);
  const level = severityLevelFromPercent(severityPercent);

  return {
    severityPercent,
    level,
    bike: generateBikeDamage(level, rng),
    rider: generateRiderInjury(level, rider, rng),
  };
}
