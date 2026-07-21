// Parts Reliability System — failure chances, wear, graduated failures
// Spec: graduated failure (50% minor, 30% moderate, 20% terminal)

import type { BikeComponent, EngineMode, PartFailureSeverity, Rider } from '../data/types';

export interface FailureEvent {
  occurred: boolean;
  severity: PartFailureSeverity | null;  // null if no failure
  component: string;
  performanceLoss: number;                // 0-100: how much pace is lost
  isTerminal: boolean;                    // DNF if true
}

const FAILURE_BASE_CALC = 0.0025; // (100 - reliability) * 0.0025 = fail rate

// Engine mode multipliers on failure rate AND wear accumulation (spec: §Engine Modes)
export const ENGINE_MODE_MULTIPLIERS: Record<EngineMode, number> = {
  conserve: 0.6,
  standard: 1.0,
  push: 1.6,
  attack: 2.2,
};

// Engine mode effect on lap pace (seconds/lap; negative = faster). Conserve
// trades pace for parts life; attack is race-day maximum. Single source of
// truth — the race sim and the garage UI both read this.
export const ENGINE_MODE_PACE: Record<EngineMode, number> = {
  conserve: 0.10,
  standard: 0,
  push: -0.12,
  attack: -0.25,
};

/**
 * Standard six-component loadout derived from a team's headline bike
 * reliability. The engine carries the base rate; ancillaries run a little
 * more reliable. Used at universe creation and to migrate older saves.
 */
export function defaultBikeComponents(baseReliability: number): Record<string, BikeComponent> {
  const spec: [string, BikeComponent['type'], number][] = [
    ['engine', 'engine', 0],
    ['gearbox', 'gearbox', 4],
    ['suspension', 'suspension', 6],
    ['brakes', 'brakes', 8],
    ['chassis', 'chassis', 10],
    ['electronics', 'electronics', 2],
  ];
  const out: Record<string, BikeComponent> = {};
  for (const [id, type, offset] of spec) {
    out[id] = {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      type,
      reliability: Math.min(98, baseReliability + offset),
      wear: 0,
      mileageMiles: 0,
    };
  }
  return out;
}

export function calculateBaseFail(reliability: number): number {
  // baseFail% = max(1, (100 - reliability) × 0.25)
  // rel 100 = 1% · rel 80 = 5% · rel 50 = 12.5% · rel 0 = 25%
  return Math.max(1, (100 - reliability) * 0.25);
}

export function calculateFailureChance(
  component: BikeComponent,
  engineMode: EngineMode,
  isHotRace: boolean,
  hasRecklessTrait: boolean,
  reliabilityRdLevel: number,   // 0-5 (R&D investment)
  crewQuality: number,          // 0.7-1.0 (good crew = lower chance)
): number {
  let chance = calculateBaseFail(component.reliability);

  // Engine mode multiplier
  chance *= ENGINE_MODE_MULTIPLIERS[engineMode];

  // Wear multiplier (0% wear = 1.0, 100% wear = 1.8)
  const wearMultiplier = 1.0 + (component.wear / 100) * 0.8;
  chance *= wearMultiplier;

  // Hot race penalty
  if (isHotRace) chance *= 1.2;

  // Reckless rider penalty
  if (hasRecklessTrait) chance *= 1.15;

  // R&D investment and crew quality reduce chance
  const safetyMod = crewQuality * (1 - reliabilityRdLevel * 0.1); // R&D reduces by up to 50%
  chance *= safetyMod;

  return Math.min(100, Math.max(0.1, chance));
}

export function rollFailure(failChance: number): boolean {
  return Math.random() * 100 < failChance;
}

export function rollFailureSeverity(): PartFailureSeverity {
  const roll = Math.random() * 100;
  if (roll < 50) return 'minor';       // 50%
  if (roll < 80) return 'moderate';    // 30%
  return 'terminal';                   // 20%
}

export function calculatePerformanceLoss(severity: PartFailureSeverity): number {
  switch (severity) {
    case 'minor':
      // Smoke/limp: reduced performance but finishes
      return 15 + Math.random() * 25;  // 15-40% pace loss
    case 'moderate':
      // Forced mode dial-back: significant loss
      return 35 + Math.random() * 25;  // 35-60% pace loss
    case 'terminal':
      return 100; // DNF
  }
}

export function checkPartFailure(
  component: BikeComponent,
  engineMode: EngineMode,
  rider: Rider,
  isHotRace: boolean,
  reliabilityRdLevel: number,
  crewQuality: number,
): FailureEvent {
  const hasRecklessTrait = rider.traits.includes('reckless');
  const failChance = calculateFailureChance(
    component,
    engineMode,
    isHotRace,
    hasRecklessTrait,
    reliabilityRdLevel,
    crewQuality,
  );

  const failed = rollFailure(failChance);

  if (!failed) {
    return { occurred: false, severity: null, component: component.id, performanceLoss: 0, isTerminal: false };
  }

  const severity = rollFailureSeverity();
  const performanceLoss = calculatePerformanceLoss(severity);

  return {
    occurred: true,
    severity,
    component: component.id,
    performanceLoss,
    isTerminal: severity === 'terminal',
  };
}

export function applyWear(
  component: BikeComponent,
  mileageThisRound: number,
): BikeComponent {
  // Wear accumulates with mileage
  // Typical round mileage might be 50-100 miles depending on discipline
  const wearIncrease = (mileageThisRound / 500) * 5; // ~1 wear per 100 miles

  return {
    ...component,
    wear: Math.min(100, component.wear + wearIncrease),
    mileageMiles: component.mileageMiles + mileageThisRound,
  };
}

export function rebuildComponent(component: BikeComponent, roundNumber: number): BikeComponent {
  return {
    ...component,
    wear: 0,
    mileageMiles: 0,
    lastRebuild: roundNumber,
  };
}

export function estimateRebuildCost(component: BikeComponent, baseEngineCost: number): number {
  // Rebuild cost is ~30% of base engine cost, varies by component type
  const costMultipliers: Record<string, number> = {
    engine: 1.0,
    gearbox: 0.6,
    suspension: 0.4,
    brakes: 0.3,
    chassis: 0.5,
    electronics: 0.35,
  };

  const mult = costMultipliers[component.type] ?? 0.5;
  return Math.round(baseEngineCost * 0.3 * mult);
}
