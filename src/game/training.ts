// Training System — skill development, stamina, age decline
// Per spec: stamina is free, tokens accelerate regen but never gate training

import type { Rider, RiderSkills, DisciplineId } from '../data/types';

export interface TrainingSession {
  riderId: string;
  skillFocus: keyof RiderSkills;  // which skill to train
  sessionCost: number;             // stamina cost (15 base)
  expectedGain: number;            // predicted skill gain
}

export interface TrainingResult {
  skillGain: number;
  newSkillValue: number;
  staminaCost: number;
  overtrained: boolean;     // stamina dropped below 20
  injuryRisk: number;       // if overtrained, 0-100 chance
}

const BASE_GAIN = 0.3;
const SESSION_STAMINA_COST = 15;
const STAMINA_REGEN_PER_DAY = 10;

function ageModifier(age: number): number {
  if (age < 22) return 1.5;
  if (age <= 27) return 1.0;
  if (age <= 31) return 0.6;
  return 0.3;
}

function headroomModifier(currentSkill: number, potential: number): number {
  const headroom = Math.max(0, potential - currentSkill);
  // Gains shrink to zero as skill approaches potential
  return Math.min(1.0, headroom / 20);
}

function facilityModifier(facilityLevel: number): number {
  const mods = { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.4, 5: 1.6 };
  return mods[facilityLevel as keyof typeof mods] ?? 1.0;
}

export function calculateTrainingGain(
  rider: Rider,
  skillFocus: keyof RiderSkills,
  facilityLevel: number,
  coachQuality: number,
): number {
  const currentSkill = rider.skills[skillFocus];
  const potential = rider.potential;

  const gain = BASE_GAIN
    * ageModifier(rider.age)
    * headroomModifier(currentSkill, potential)
    * facilityModifier(facilityLevel)
    * coachQuality;

  return gain;
}

export function trainRider(
  rider: Rider,
  skillFocus: keyof RiderSkills,
  facilityLevel: number,
  coachQuality: number,
): TrainingResult {
  const gain = calculateTrainingGain(rider, skillFocus, facilityLevel, coachQuality);
  const newSkill = Math.min(99, rider.skills[skillFocus] + gain);
  const staminaCost = SESSION_STAMINA_COST;
  const newStamina = Math.max(0, rider.stamina - staminaCost);

  const overtrained = newStamina < 20;
  let injuryRisk = 0;

  if (overtrained) {
    // Overtrain penalty: temporary skill loss + injury risk
    injuryRisk = Math.random() * 30; // 0-30% chance
  }

  return {
    skillGain: gain,
    newSkillValue: newSkill,
    staminaCost,
    overtrained,
    injuryRisk,
  };
}

export function regenStamina(currentStamina: number, daysResting: number): number {
  // 10 stamina per day while resting
  return Math.min(100, currentStamina + STAMINA_REGEN_PER_DAY * daysResting);
}

// Age decline: 32+ riders lose 0.1-0.3/skill per season on physical stats
export function applyAgeDecline(rider: Rider, discipline: DisciplineId): Partial<RiderSkills> {
  if (rider.age < 32) return {};

  const physicalSkills: (keyof RiderSkills)[] = ['pace', 'fitness', 'starts'];
  const experienceSkills: (keyof RiderSkills)[] = ['feedback', 'racecraft', 'consistency'];

  const decline: Partial<RiderSkills> = {};

  // Physical decline: 0.1-0.3 per skill
  for (const skill of physicalSkills) {
    const declineAmount = 0.1 + (rider.age - 32) * 0.05; // increases with age
    decline[skill] = Math.max(30, rider.skills[skill] - declineAmount);
  }

  // Experience skills decline slower
  for (const skill of experienceSkills) {
    const slowDecline = 0.05;
    decline[skill] = Math.max(50, rider.skills[skill] - slowDecline);
  }

  return decline;
}

// Calculate overall rating per discipline
export function calculateOverall(skills: RiderSkills, discipline: DisciplineId): number {
  if (discipline === 'gp') {
    return Math.round(
      skills.braking * 1.4
      + skills.cornerSpeed * 1.4
      + skills.pace * 1.3
      + (skills.consistency + skills.starts + skills.fitness + skills.wet + skills.feedback + skills.racecraft) / 6
    ) / 1.0;
  }

  if (discipline === 'sbk') {
    return Math.round(
      skills.braking * 1.3
      + skills.consistency * 1.3
      + skills.pace * 1.2
      + (skills.cornerSpeed + skills.starts + skills.fitness + skills.wet + skills.feedback + skills.racecraft) / 6
    ) / 1.0;
  }

  if (discipline === 'namc') {
    return Math.round(
      skills.starts * 1.4
      + skills.fitness * 1.4
      + skills.consistency * 1.3
      + (skills.pace + skills.braking + skills.cornerSpeed + skills.wet + skills.feedback + skills.racecraft) / 6
    ) / 1.0;
  }

  return Math.round(
    (skills.pace + skills.braking + skills.cornerSpeed + skills.racecraft
      + skills.consistency + skills.starts + skills.fitness + skills.wet + skills.feedback) / 9
  );
}
