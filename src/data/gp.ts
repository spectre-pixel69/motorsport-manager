// MotoGP championship constants, based on 2025-2026 official rules
// This implements the NAMC pattern (championship-specific data + economy model)
// for FIM Grand Prix motorcycle racing across three classes: MotoGP, Moto2, Moto3.

import type { ClassId } from './types';

// ============================================================================
// POINTS SYSTEMS (2025-2026 Rules)
// ============================================================================

// MotoGP Main Race: 25/20/16/13/11/10/9/8/7/6/5/4/3/2/1 (+ DNF/OOT = 0)
export const POINTS_GP1_MAIN = [
  25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  ...Array(25).fill(0), // positions 16-40 get 0 points
];

// MotoGP Sprint: 12/9/7/6/5/4/3/2/1 (+ rest = 0)
export const POINTS_GP1_SPRINT = [
  12, 9, 7, 6, 5, 4, 3, 2, 1,
  ...Array(31).fill(0), // positions 10-40 get 0 points
];

// Moto2 (middle class) — same scale as MotoGP
export const POINTS_GP2_MAIN = POINTS_GP1_MAIN;
export const POINTS_GP2_SPRINT = POINTS_GP1_SPRINT;

// Moto3 (junior class) — same scale as MotoGP
export const POINTS_GP3_MAIN = POINTS_GP1_MAIN;
export const POINTS_GP3_SPRINT = POINTS_GP1_SPRINT;

// ============================================================================
// PURSE STRUCTURE (Prize Money Distribution)
// ============================================================================

// MotoGP class: $25M championship purse (split across 22 rounds, 40 riders)
// Estimated per-round purse for all three classes combined: ~$2.5M
// NAMC pattern: distribute proportionally by class (MotoGP 50%, Moto2 30%, Moto3 20%)

const GP_PURSE_MAIN = [
  300_000, 200_000, 150_000, 120_000, 100_000, 85_000, 75_000, 65_000, 55_000, 50_000,
  45_000, 40_000, 35_000, 30_000, 25_000, 20_000, 18_000, 16_000, 14_000, 12_000,
  ...Array(20).fill(10_000), // P21-40: $10k each
];

export const PURSES_GP: Record<string, number[]> = {
  gp1: GP_PURSE_MAIN,      // MotoGP
  gp2: GP_PURSE_MAIN.map(p => Math.round(p * 0.6)),  // Moto2 scaled to 60% of MotoGP
  gp3: GP_PURSE_MAIN.map(p => Math.round(p * 0.4)),  // Moto3 scaled to 40% of MotoGP
};

// ============================================================================
// RIDER ECONOMICS
// ============================================================================

export const SALARY_FLOORS_GP: Record<string, number> = {
  gp1: 2_000_000,  // MotoGP factory contracts start high
  gp2: 500_000,    // Moto2 satellite teams
  gp3: 200_000,    // Moto3 junior contracts
};

export const APPEARANCE_FEE_GP = 5_000;        // per round (higher than NAMC's $1k)
export const PRO_DEBUT_BONUS_GP = 50_000;     // MotoGP first start premium

// ============================================================================
// CHAMPIONSHIP FORMAT
// ============================================================================

// 22-round calendar (typical 2025-2026 schedule)
// Each round = Fri Practice + Sat Sprint (points) + Sun Main (points)
// Constructor championship (team points) = rider points sum (same as NAMC dual-charter)

export const GP_ROUNDS = 22;

export const CONSTRUCTOR_CHAMPIONSHIP_PURSE: number[] = (() => {
  const p = [1_000_000, 600_000, 400_000, 250_000, 150_000];
  for (let i = 0; i < 15; i++) p.push(Math.round(100_000 - (50_000 * i) / 14));
  return p;
})();

export const MANUFACTURER_CHAMPIONSHIP_PURSE: number[] = (() => {
  const p = [800_000, 500_000, 300_000, 200_000, 100_000];
  for (let i = 0; i < 15; i++) p.push(Math.round(80_000 - (40_000 * i) / 14));
  return p;
})();

// ============================================================================
// CONCESSION TIERS (Engine Allocation by Manufacturer Competitiveness)
// ============================================================================

export type ConcessionTier = 'A' | 'B' | 'C' | 'D';

export interface ConcessionAllowance {
  tier: ConcessionTier;
  maxEnginesPerRound: number;  // how many engines the manufacturer can supply
  developmentConcessions: number; // extra development tokens per season
  carryOverRounds: number;      // rounds before tier is re-evaluated
}

export const CONCESSION_TIERS: Record<ConcessionTier, ConcessionAllowance> = {
  A: { tier: 'A', maxEnginesPerRound: 7, developmentConcessions: 0, carryOverRounds: 3 },  // top team
  B: { tier: 'B', maxEnginesPerRound: 8, developmentConcessions: 4, carryOverRounds: 3 },
  C: { tier: 'C', maxEnginesPerRound: 8, developmentConcessions: 6, carryOverRounds: 3 },
  D: { tier: 'D', maxEnginesPerRound: 10, developmentConcessions: 10, carryOverRounds: 2 }, // junior team
};

// Tier is assigned based on previous season championship standing
export function assignConcessionTier(previousChampionshipPosition: number): ConcessionTier {
  if (previousChampionshipPosition <= 3) return 'A';
  if (previousChampionshipPosition <= 6) return 'B';
  if (previousChampionshipPosition <= 12) return 'C';
  return 'D';
}

// ============================================================================
// REVENUE & ECONOMY
// ============================================================================

export const WEEKLY_LEAGUE_REVENUE_GP = 12_000_000;  // TV rights + sponsorship
export const REVENUE_SPLIT_GP = {
  teams: 0.50,    // increased from NAMC's 45% (road racing pays better)
  riders: 0.30,   // 30% to rider purse (higher than NAMC's 25%)
  constructors: 0.10,
  league: 0.10,
};

// Team budget per season (similar to NAMC's $2.5M)
export const TEAM_BUDGET_GP = 2_500_000;
export const TEAM_BUDGET_GP2 = 1_200_000;  // Moto2 satellite
export const TEAM_BUDGET_GP3 = 600_000;    // Moto3 junior

// ============================================================================
// TECHNICAL REGULATIONS
// ============================================================================

// Ballast system for competitiveness (§7.3)
export const BALLAST_BASE_KG = 157;  // minimum weight for all bikes
export const BALLAST_CAP_KG = 10;    // success handicap cap (+10kg max)
export const WEIGHT_PENALTY_PER_KG = 0.12; // seconds/lap per kg (higher than NAMC's 0.07 due to road racing)

// BoP (Balance of Performance): minimum engine performance thresholds
// Engines below the BoP floor can claim development concessions
export const BOP_POWER_FLOOR = 265;  // BHP minimum
export const BOP_TORQUE_FLOOR = 140; // NM minimum

// ============================================================================
// PENALTIES (Technical Regulation)
// ============================================================================

// Grid penalties (§12.2)
export type GridPenalty = 'warning' | '-3pos' | '-6pos' | 'back-grid' | 'ride-through' | 'long-lap' | 'race-ban';

// Infraction thresholds for escalation
export const TECH_INFRACTION_ESCALATION = {
  firstOffense: 'warning' as GridPenalty,
  secondOffense: '-3pos' as GridPenalty,
  thirdOffense: '-6pos' as GridPenalty,
  fourthOffense: 'back-grid' as GridPenalty,
  seasonalBan: 'race-ban' as GridPenalty,
};

export const FINE_TIER_GP = {
  warning: 0,
  '-3pos': 10_000,
  '-6pos': 25_000,
  'back-grid': 50_000,
  'ride-through': 15_000,
  'long-lap': 10_000,
  'race-ban': 250_000,
};
