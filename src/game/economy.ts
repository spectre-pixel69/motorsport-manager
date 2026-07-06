// NAMC Economy System: Purses, rider salaries, budgets, cash flow
// Per v15.1 rulebook Section 4-5

import type { ChassisId, EngineId, TireId } from '../data/bikes';
import type { ElectronicsType, ExhaustType } from '../data/setups';
import { ENGINES, CHASSIS, TIRES, calculateBikeBuildCost } from '../data/bikes';
import { ELECTRONICS_SYSTEMS, EXHAUST_SYSTEMS, calculateRoundSetupCost } from '../data/setups';
import { ALL_STAFF } from '../data/staff';

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
