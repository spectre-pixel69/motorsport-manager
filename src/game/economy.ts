// NAMC Economy System: Purses, rider salaries, budgets, cash flow
// Per v15.1 rulebook Section 4-5

import type { ChassisId, EngineId, TireId } from '../data/bikes';
import type { ElectronicsType, ExhaustType } from '../data/setups';
import type { Team } from '../data/types';
import { ENGINES, CHASSIS, TIRES, calculateBikeBuildCost } from '../data/bikes';
import { ELECTRONICS_SYSTEMS, EXHAUST_SYSTEMS, calculateRoundSetupCost } from '../data/setups';
import { ALL_STAFF } from '../data/staff';
import { PURSES, WEEKLY_LEAGUE_REVENUE, REVENUE_SPLIT, APPEARANCE_FEE } from '../data/namc';
import { PURSES_GP, WEEKLY_LEAGUE_REVENUE_GP, REVENUE_SPLIT_GP, APPEARANCE_FEE_GP } from '../data/gp';
import { PURSES_SBK, WEEKLY_LEAGUE_REVENUE_SBK, REVENUE_SPLIT_SBK, APPEARANCE_FEE_SBK } from '../data/sbk';

export type RiderClass = '350-pro' | '250' | '250p' | 'womens-250';
export type FinishPosition = number; // 1-40

// ============================================================================
// RIDER SALARY STRUCTURE (Per v15.1 Section 4.1)
// ============================================================================

export const RIDER_SALARY_FLOOR: Record<RiderClass, number> = {
  '350-pro': 400000,
  '250': 200000,
  '250p': 100000,
  'womens-250': 100000,
};

export const APPEARANCE_FEE_PER_ROUND = 1000; // $1,000 per round, 20 rounds = $20,000 season
export const PRO_DEBUT_BONUS = 25000; // One-time bonus for first-time pros
export const BENCH_RIDER_RETAINER = 50000; // Annual retainer
export const ROUND_PURSE = 800000; // $800,000 per round distributed across 4 classes
export const MIN_FINISH_PAYOUT = 5000; // $5,000 minimum for 40th place

// ============================================================================
// TEAM OPERATING EXPENSES (NAMC v15.3 — Realistic Drain)
// ============================================================================
// These represent the real costs teams incur each season.
// Together they consume 60-80% of race winnings.

export const ANNUAL_OPERATING_EXPENSES = {
  staffSalaries: 2_500_000,      // Crew chiefs, mechanics, engineers, logistics
  facilityLease: 400_000,        // Track time, shop lease, utilities
  travelLogistics: 800_000,      // 20 rounds × 4 classes = multiple crews on road
  insurance: 200_000,            // Equipment, riders, facility liability
  medicalTeam: 300_000,          // Track doctors, physios on payroll
  equipmentFleet: 300_000,        // Truck maintenance, fuel, transportation
  partsStorage: 500_000,         // Inventory management, storage facility
  licensing: 100_000,            // NAMC fees, regulatory compliance
  depreciation: 400_000,         // Equipment wear, bike age
  contingency: 400_000,          // Crash damage, emergency repairs

  TOTAL: 2_500_000 + 400_000 + 800_000 + 200_000 + 300_000 + 300_000 + 500_000 + 100_000 + 400_000 + 400_000,
};

// ============================================================================
// R&D PROGRESSION RATES (Slow & Incremental)
// ============================================================================
// Updated from 0.5 pts/$100k to 0.1 pts/$100k (5x slower)
// Encourages long-term investment, not quick optimization

export const RND_GAINS_PER_100K = {
  engine: 0.1,        // 1 point per $1M invested (was 0.5)
  handling: 0.1,      // 1 point per $1M invested (was 0.5)
  reliability: 0.06,  // 1 point per ~$1.67M invested (was 0.3)
};

// Win bonuses per class
export const WIN_BONUS: Record<RiderClass, number> = {
  '350-pro': 75000,
  '250': 40000,
  '250p': 20000,
  'womens-250': 20000,
};

// ============================================================================
// SEASONAL BUDGET ALLOCATION
// ============================================================================

export interface TeamBudget {
  totalCapital: number; // $2,500,000 base
  staffCosts: number; // Annual staff salaries
  riderSalaries: number; // Annual rider compensation
  bikeHardware: number; // Engine + Chassis leases
  equipmentMaintenance: number; // Tires, repairs, consumables
  rdInvestment: number; // R&D unlocks
  reserved: number; // Cash buffer

  spent: number; // Total spent (calculated)
  remaining: number; // Available for use (calculated)
}

export interface CashFlowEntry {
  round: number;
  source: 'purse' | 'appearance' | 'win-bonus' | 'other';
  amount: number;
  description: string;
}

// ============================================================================
// ROUND SETTLEMENT & LEDGER
// ============================================================================

export interface RoundLedgerEntry {
  teamId: string;
  purse: number;          // prize money to team
  revenuePool: number;    // operational revenue (75% of purse share)
  salaries: number;       // rider payroll this round
  appearance: number;     // appearance fees
}

export function pursesFor(championship: 'road' | 'fourStroke' | 'twoStroke'): number {
  return ROUND_PURSE;
}

/**
 * Weekly settlement — rulebook v15.1 §4.2 (appearance fees), §4.9 (24-hour
 * payment rule), §5.2 (round purse). Purse money is the RIDER'S; the team
 * receives only its contract-negotiated cut (purseShareTeamPct, cap 25%).
 * Teams pay per-round salary draws (annual/20) + appearance fees, and
 * receive a league revenue share (interim model pending §5.1 team split).
 */
export function settleNamcRound(u: any, championship: any, weekends: any[]): RoundLedgerEntry[] {
  const revenueSharePerTeam = (WEEKLY_LEAGUE_REVENUE * REVENUE_SPLIT.teams) / 20;
  const byTeam: Record<string, RoundLedgerEntry> = {};
  const entry = (teamId: string): RoundLedgerEntry =>
    (byTeam[teamId] ??= { teamId, purse: 0, revenuePool: 0, salaries: 0, appearance: 0 });

  // Purse by Main Event finishing position; team collects its contract cut only
  for (const w of weekends) {
    const table = PURSES[w.classId] ?? [];
    w.finishOrder.forEach((riderId: string, i: number) => {
      const r = u.riders[riderId];
      if (!r?.teamId) return;
      const payout = table[i] ?? MIN_FINISH_PAYOUT;
      const teamCut = Math.round(payout * Math.min(25, r.contract?.purseShareTeamPct ?? 0) / 100);
      entry(r.teamId).purse += teamCut;
    });
  }

  // Team obligations + league revenue share
  for (const team of Object.values(u.teams)) {
    const t = team as any;
    if (t.discipline !== 'namc' || t.championship !== championship) continue;
    const e = entry(t.id);
    const roster = Object.values(u.riders).filter((r: any) => r.teamId === t.id) as any[];
    for (const r of roster) {
      e.salaries += Math.round((r.salary ?? 0) / 20);           // per-round salary draw
      if (!r.bench && r.injuredForRounds === 0) e.appearance += APPEARANCE_FEE_PER_ROUND;
    }
    e.revenuePool = Math.round(revenueSharePerTeam);
    t.budget += e.purse + e.revenuePool - e.salaries - e.appearance;
  }
  return Object.values(byTeam);
}

/**
 * Road championship settlement (MotoGP, WorldSBK).
 * Handles single race (GP per race) or aggregated races (SBK 3 races per round).
 * Updates team budgets with purse winnings, revenue share, and rider costs.
 */
export function settleRoadRound(u: any, weekend: any): void {
  if (!weekend) return;

  const teams = Object.values(u.teams) as Team[];
  const discipline = weekend.championship === 'road'
    ? teams.find((t: Team) => t.discipline === 'gp')?.discipline ?? 'sbk'
    : 'sbk';

  // Determine purse table and revenue model based on discipline
  const getPurseTable = (classId: string): number[] => {
    if (discipline === 'gp') return PURSES_GP[classId] ?? [];
    if (discipline === 'sbk') return PURSES_SBK[classId] ?? [];
    return [];
  };

  const getRevenueSplit = () => {
    if (discipline === 'gp') return REVENUE_SPLIT_GP;
    if (discipline === 'sbk') return REVENUE_SPLIT_SBK;
    return REVENUE_SPLIT;
  };

  const getWeeklyRevenue = () => {
    if (discipline === 'gp') return WEEKLY_LEAGUE_REVENUE_GP;
    if (discipline === 'sbk') return WEEKLY_LEAGUE_REVENUE_SBK;
    return WEEKLY_LEAGUE_REVENUE;
  };

  const getAppearanceFee = () => {
    if (discipline === 'gp') return APPEARANCE_FEE_GP;
    if (discipline === 'sbk') return APPEARANCE_FEE_SBK;
    return APPEARANCE_FEE;
  };

  const revenueSplit = getRevenueSplit();
  const weeklyRevenue = getWeeklyRevenue();
  const appearanceFee = getAppearanceFee();

  // Calculate teams per discipline (GP: 11 teams, SBK: 12 teams, NAMC: 20 teams)
  const teamsInDiscipline = Object.values(u.teams).filter((t: any) => {
    if (discipline === 'gp') return t.discipline === 'gp';
    if (discipline === 'sbk') return t.discipline === 'sbk';
    return false;
  }).length;

  const revenueSharePerTeam = teamsInDiscipline > 0
    ? (weeklyRevenue * revenueSplit.teams) / teamsInDiscipline
    : 0;

  const byTeam: Record<string, RoundLedgerEntry> = {};
  const entry = (teamId: string): RoundLedgerEntry =>
    (byTeam[teamId] ??= { teamId, purse: 0, revenuePool: 0, salaries: 0, appearance: 0 });

  // Process race results: purse by finishing position
  const purseTable = getPurseTable(weekend.classId);
  weekend.finishOrder.forEach((riderId: string, i: number) => {
    const r = u.riders[riderId];
    if (!r?.teamId) return;
    const payout = purseTable[i] ?? 0;  // Road racing: no minimum payout for out-of-points
    const teamCut = Math.round(payout * Math.min(25, r.contract?.purseShareTeamPct ?? 0) / 100);
    entry(r.teamId).purse += teamCut;
  });

  // Team obligations + league revenue share
  for (const teamId in u.teams) {
    const t = u.teams[teamId] as Team;
    if (discipline === 'gp' && t.discipline !== 'gp') continue;
    if (discipline === 'sbk' && t.discipline !== 'sbk') continue;

    const e = entry(t.id);
    const roster = Object.values(u.riders).filter((r: any) => r.teamId === t.id) as any[];

    // Calculate round count for salary draw
    const roundsPerSeason = discipline === 'gp' ? 22 : discipline === 'sbk' ? 12 : 20;

    for (const r of roster) {
      e.salaries += Math.round((r.salary ?? 0) / roundsPerSeason);
      if (!r.bench && r.injuredForRounds === 0) e.appearance += appearanceFee;
    }

    e.revenuePool = Math.round(revenueSharePerTeam);
    t.budget += e.purse + e.revenuePool - e.salaries - e.appearance;
  }
}

export class EconomyManager {
  private seasonYear: number;
  private teamBudget: TeamBudget;
  private cashFlow: CashFlowEntry[] = [];
  private riderRaceStarts: Map<string, number> = new Map();

  constructor(seasonYear: number = 2027) {
    this.seasonYear = seasonYear;
    this.teamBudget = {
      totalCapital: 2500000,
      staffCosts: 0,
      riderSalaries: 0,
      bikeHardware: 0,
      equipmentMaintenance: 0,
      rdInvestment: 0,
      reserved: 0,
      spent: 0,
      remaining: 2500000,
    };
  }

  allocateStaff(staffIds: string[]): { success: boolean; totalCost: number; error?: string } {
    let totalCost = 0;
    for (const staffId of staffIds) {
      const staff = ALL_STAFF[staffId];
      if (!staff) return { success: false, totalCost: 0, error: `Staff ${staffId} not found` };
      totalCost += staff.salary;
    }
    if (this.teamBudget.remaining < totalCost) {
      return { success: false, totalCost, error: 'Insufficient budget for staff allocation' };
    }
    this.teamBudget.staffCosts = totalCost;
    this.updateBudget();
    return { success: true, totalCost };
  }

  calculatePurseForFinish(riderClass: RiderClass, finishPosition: FinishPosition): number {
    const classShare = ROUND_PURSE / 4;
    if (finishPosition === 1) return WIN_BONUS[riderClass];
    if (finishPosition <= 3) return WIN_BONUS[riderClass] * 0.6;
    if (finishPosition <= 5) return WIN_BONUS[riderClass] * 0.35;
    if (finishPosition <= 10) return classShare / 10 * (1 - (finishPosition - 1) / 10);
    return MIN_FINISH_PAYOUT;
  }

  processRaceResults(
    round: number,
    results: { riderId: string; riderClass: RiderClass; finishPosition: FinishPosition }[],
  ): { totalPayout: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {};
    let totalPayout = 0;
    for (const result of results) {
      const purse = this.calculatePurseForFinish(result.riderClass, result.finishPosition);
      const appearanceFee = APPEARANCE_FEE_PER_ROUND;
      const total = purse + appearanceFee;
      breakdown[result.riderId] = total;
      totalPayout += total;
      this.riderRaceStarts.set(result.riderId, (this.riderRaceStarts.get(result.riderId) ?? 0) + 1);
      this.cashFlow.push({ round, source: 'purse', amount: purse, description: `P${result.finishPosition} purse` });
      this.cashFlow.push({ round, source: 'appearance', amount: appearanceFee, description: 'Appearance fee' });
    }
    return { totalPayout, breakdown };
  }

  getBudgetState(): TeamBudget {
    return { ...this.teamBudget };
  }

  getCashFlowHistory(): CashFlowEntry[] {
    return [...this.cashFlow];
  }

  private updateBudget(): void {
    this.teamBudget.spent =
      this.teamBudget.staffCosts +
      this.teamBudget.riderSalaries +
      this.teamBudget.bikeHardware +
      this.teamBudget.equipmentMaintenance +
      this.teamBudget.rdInvestment +
      this.teamBudget.reserved;
    this.teamBudget.remaining = this.teamBudget.totalCapital - this.teamBudget.spent;
  }
}
