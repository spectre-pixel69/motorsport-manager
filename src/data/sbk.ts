// World Superbike Championship constants, based on 2026 official rules
// This implements the NAMC pattern (championship-specific data + economy model)
// for production-based superbike racing across three classes: WorldSBK, WorldSSP, WorldSP300.

import type { ClassId } from './types';

// ============================================================================
// POINTS SYSTEMS (2026 Rules)
// ============================================================================

// Superpole Race (short sprint, ~12km): 12/9/7/6/5/4/3/2/1
export const POINTS_SBK_SUPERPOLE = [
  12, 9, 7, 6, 5, 4, 3, 2, 1,
  ...Array(31).fill(0), // positions 10-40 get 0 points
];

// Race 1 & Race 2 (full distance, ~50km): 25/20/16/13/11/10/9/8/7/6/5/4/3/2/1
export const POINTS_SBK_RACE = [
  25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  ...Array(25).fill(0), // positions 16-40 get 0 points
];

// SSP (Supersport 600cc, middle class) — same scale as SBK
export const POINTS_SSP_SUPERPOLE = POINTS_SBK_SUPERPOLE;
export const POINTS_SSP_RACE = POINTS_SBK_RACE;

// SP300 (300cc junior class) — same scale as SBK
export const POINTS_SP300_SUPERPOLE = POINTS_SBK_SUPERPOLE;
export const POINTS_SP300_RACE = POINTS_SBK_RACE;

// ============================================================================
// PURSE STRUCTURE (Prize Money Distribution)
// ============================================================================

// WorldSBK class: $15M championship purse (split across 12 rounds, 3 races per round, ~15 riders per class)
// Estimated per-round purse for all three classes combined: ~$1.8M
// SBK pattern: distribute proportionally by class (SBK 60%, SSP 25%, SP300 15%)

const SBK_PURSE_RACE = [
  120_000, 80_000, 60_000, 50_000, 40_000, 35_000, 30_000, 25_000, 20_000, 18_000,
  16_000, 14_000, 12_000, 10_000, 8_000,
  ...Array(25).fill(5_000), // P16-40: $5k minimum
];

export const PURSES_SBK: Record<string, number[]> = {
  sbk: SBK_PURSE_RACE,          // WorldSBK
  ss600: SBK_PURSE_RACE.map(p => Math.round(p * 0.55)),  // SSP 600 scaled to 55% of SBK
  ss300: SBK_PURSE_RACE.map(p => Math.round(p * 0.35)),  // SP300 scaled to 35% of SBK
};

// ============================================================================
// RIDER ECONOMICS
// ============================================================================

export const SALARY_FLOORS_SBK: Record<string, number> = {
  sbk: 800_000,    // WorldSBK factory contracts (production-based, less than GP)
  ss600: 200_000,  // SSP satellite teams
  ss300: 80_000,   // SP300 junior contracts
};

export const APPEARANCE_FEE_SBK = 3_000;       // per round (less than MotoGP's $5k, road racing)
export const PRO_DEBUT_BONUS_SBK = 25_000;    // Superbike first start premium

// ============================================================================
// CHAMPIONSHIP FORMAT
// ============================================================================

// 12-round calendar (typical 2026 schedule)
// Each round = Fri Free Practice + Sat Superpole (race) + Sun Race 1 + Sun Race 2
// Race 2 grid = reversed top 6 from Race 1 (Grid Reversal Rule, §4.2)
// Manufacturer championship (aggregate points from top riders per make)

export const SBK_ROUNDS = 12;

export const MANUFACTURER_CHAMPIONSHIP_PURSE_SBK: number[] = (() => {
  const p = [600_000, 400_000, 250_000, 150_000, 100_000];
  for (let i = 0; i < 10; i++) p.push(Math.round(50_000 - (25_000 * i) / 9));
  return p;
})();

// ============================================================================
// BALANCE OF PERFORMANCE (BoP)
// ============================================================================

// SBK uses BoP (Balance of Performance) adjustments every 3 rounds
// to keep manufacturer competitiveness balanced (§8.0)
// Adjustments are: engine RPM limiter, fuel flow restrictor, air restrictors

export type BoP_Adjustment = {
  rpmLimit: number;      // RPM limiter (e.g., 16500 RPM)
  fuelFlowMax: number;   // liters/min (e.g., 2.20 L/min)
  airRingSize: number;   // mm diameter (e.g., 36.5mm)
  minWeight: number;     // kg (e.g., 168kg)
};

// Baseline BoP (without adjustment)
export const BOP_BASELINE: BoP_Adjustment = {
  rpmLimit: 16500,
  fuelFlowMax: 2.20,
  airRingSize: 36.5,
  minWeight: 168,
};

// BoP evaluation every 3 rounds (after round 3, 6, 9, 12)
// Teams within top 6 of standings may receive restrictive adjustments
// Trailing teams may receive performance allowances

export interface BoPAdjustmentTable {
  round: number;  // round number when adjustment takes effect
  adjustments: Record<string, BoP_Adjustment>;  // manufacturerId -> BoP
}

// ============================================================================
// BALLAST SYSTEM (Weight Handicap)
// ============================================================================

// SBK ballast is weight-based (different from GP's success ballast)
// Base weight: 168kg (enforced at scales)
// Ballast can be 0-10kg additional weight (stickers + mechanical)
// Success handicap: win Race 1 → +1kg ballast in Race 2

export const BALLAST_BASE_KG_SBK = 168;
export const BALLAST_CAP_KG_SBK = 10;
export const BALLAST_PER_WIN = 1;  // +1kg for Race 1 winner in Race 2

// ============================================================================
// FUEL & CONSUMPTION TRACKING
// ============================================================================

// SBK 2026: ~22L fuel capacity, 25-minute race distance
// Fuel consumption tracking is crucial for race strategy
// Teams can adjust lean mixture during race (fuel flow rules restrict to 2.20 L/min max)

export const FUEL_CAPACITY_LITERS = 22;
export const FUEL_CONSUMPTION_PER_LAP = 1.1; // liters per lap (varies by track)
export const FUEL_FLOW_LIMIT = 2.20; // liters per minute (regulated)

// ============================================================================
// GRID REVERSAL (Race 2)
// ============================================================================

// After Race 1, top 6 finishers are reversed for Race 2 grid
// This ensures competitive racing in both races

export function applyGridReversal(race1FinishOrder: string[]): string[] {
  const reversed = race1FinishOrder.slice(0, 6).reverse();
  const rest = race1FinishOrder.slice(6);
  return [...reversed, ...rest];
}

// ============================================================================
// REVENUE & ECONOMY
// ============================================================================

export const WEEKLY_LEAGUE_REVENUE_SBK = 8_000_000;  // TV rights + sponsorship (less than MotoGP)
export const REVENUE_SPLIT_SBK = {
  teams: 0.48,    // 48% to teams
  riders: 0.27,   // 27% to rider purse
  manufacturers: 0.15,
  league: 0.10,
};

// Team budget per season (less than MotoGP/NAMC due to production-based costs)
export const TEAM_BUDGET_SBK = 1_500_000;   // WorldSBK factory support
export const TEAM_BUDGET_SSP = 500_000;    // SSP satellite
export const TEAM_BUDGET_SP300 = 250_000;  // SP300 junior

// ============================================================================
// TECHNICAL REGULATIONS
// ============================================================================

// Engine specifications (spec rules for classes)
export const ENGINE_SPECIFICATIONS = {
  sbk: {
    capacity: 999,       // cc
    cylinders: 4,
    strokeType: '4S',    // 4-stroke only
    rpmLimitFactory: 16_500,
    fuelCapacity: 22,    // liters
  },
  ss600: {
    capacity: 599,
    cylinders: 4,
    strokeType: '4S',
    rpmLimitFactory: 16_000,
    fuelCapacity: 20,
  },
  ss300: {
    capacity: 299,
    cylinders: 1,
    strokeType: '4S',
    rpmLimitFactory: 13_500,
    fuelCapacity: 13,
  },
};

// ============================================================================
// PENALTIES (Technical Regulation)
// ============================================================================

// Grid penalties (§11.2)
export type GridPenalty_SBK = 'warning' | '-3pos' | '-6pos' | 'back-grid' | 'ride-through' | 'long-lap' | 'race-ban';

// Infraction escalation
export const TECH_INFRACTION_ESCALATION_SBK = {
  firstOffense: 'warning' as GridPenalty_SBK,
  secondOffense: '-3pos' as GridPenalty_SBK,
  thirdOffense: '-6pos' as GridPenalty_SBK,
  fourthOffense: 'back-grid' as GridPenalty_SBK,
  seasonalBan: 'race-ban' as GridPenalty_SBK,
};

export const FINE_TIER_SBK = {
  warning: 0,
  '-3pos': 8_000,
  '-6pos': 20_000,
  'back-grid': 40_000,
  'ride-through': 12_000,
  'long-lap': 8_000,
  'race-ban': 150_000,
};

// Common SBK violations (production-based bike focus)
export const COMMON_VIOLATIONS = {
  noncompliantEngine: 'Engine does not meet homologation spec',
  illegalModification: 'Bodywork or chassis not per blueprint',
  fuelFlowViolation: 'Fuel flow exceeds 2.20 L/min limit',
  airIntakeViolation: 'Air intake ring exceeds 36.5mm',
  weightBelowMinimum: 'Bike underweight (below 168kg+ballast)',
  ecrViolation: 'Engine Control Unit not homologated',
  tyreViolation: 'Non-approved tyre or illegal compound use',
  safetyEquipmentMissing: 'Missing mandated safety equipment',
};
