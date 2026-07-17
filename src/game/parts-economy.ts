// Parts Economy: Engine/Chassis Orders, Supply Chain, Manufacturer Financial Health (§8.2-8.5)
// Lead times: parts ordered off-season, arrive next season (or mid-season rush with premium)
// Manufacturer dynamics: cash flow issues → production delays, cost premiums, scarcity

import type { Manufacturer, ManufacturerFinancialState, EngineOrder } from '../data/types';
import { clamp } from '../util/rng';

/**
 * Simulate manufacturer financial state each season.
 * Cash flow comes from engine sales revenue. In crisis, they can't fulfill orders.
 * ATK (parts company origin) is more resilient: higher cash buffer, lower cost multipliers.
 */
export function updateManufacturerFinance(
  mfg: Manufacturer,
  orderCount: number,
  rng: () => number,
): void {
  // Revenue from engine orders (simplified: $50k per fulfilled order)
  const revenue = orderCount * 50_000;
  mfg.cashOnHand += revenue;

  // Operating costs (fixed: ~$200k/season for infrastructure; ATK $150k due to efficiency)
  const operatingCost = mfg.id === 'atk' ? 150_000 : 200_000;
  mfg.cashOnHand -= operatingCost;

  // ATK: always stable with lower cost multipliers (parts company resilience)
  if (mfg.id === 'atk') {
    mfg.financialState = 'stable';
    mfg.productionCapacity = 1.0;    // always 100% capacity
    mfg.costMultiplier = 0.95;       // slightly cheaper than baseline
    return;
  }

  // Determine financial state based on cash reserves (for non-ATK manufacturers)
  const threshold = {
    crisis: 100_000,      // below $100k = crisis
    stressed: 300_000,    // $100k-$300k = stressed
    stable: 500_000,      // $300k+ = stable
  };

  const prevState = mfg.financialState;

  if (mfg.cashOnHand < threshold.crisis) {
    mfg.financialState = 'crisis';
    mfg.productionCapacity = 0.5;    // only fulfill 50% of orders
    mfg.costMultiplier = 1.5;        // 50% price increase
  } else if (mfg.cashOnHand < threshold.stressed) {
    mfg.financialState = 'stressed';
    mfg.productionCapacity = 0.7;    // fulfill 70% of orders
    mfg.costMultiplier = 1.2;        // 20% price increase
  } else if (mfg.cashOnHand > 800_000) {
    mfg.financialState = 'stable';
    mfg.productionCapacity = 1.0;    // fulfill all orders
    mfg.costMultiplier = 1.0;        // no premium
  } else if (prevState === 'crisis' && mfg.cashOnHand > threshold.stressed) {
    mfg.financialState = 'recovering';
    mfg.productionCapacity = 0.8;    // coming back online
    mfg.costMultiplier = 1.15;
  }
}

/**
 * Calculate engine cost with manufacturer state and rush premium.
 */
export function calculateEngineCost(
  mfg: Manufacturer,
  rushOrder: boolean,
): number {
  let cost = mfg.baseEngineCost * mfg.costMultiplier;

  // Rush order premium: +40% if crisis/stressed, +20% if stable
  if (rushOrder) {
    const rushPremium = mfg.financialState === 'stable' ? 1.2 : 1.4;
    cost *= rushPremium;
  }

  return Math.round(cost);
}

/**
 * Fulfill engine order based on manufacturer production capacity.
 * ATK (parts company) always fulfills 100%. Others: capacity-based random selection.
 * Lead time: 1-2 weeks (essentially 0-1 round delay for mid-season orders).
 */
export function fulfillEngineOrder(
  order: EngineOrder,
  mfg: Manufacturer,
  rng: () => number,
  currentSeason: number,
): boolean {
  if (order.fulfilled) return true;

  // Check if order is due for delivery
  if (currentSeason < order.expectedArrivalSeason) return false;

  // ATK (parts company) always has parts available
  if (mfg.id === 'atk') {
    order.fulfilled = true;
    return true;
  }

  // Other manufacturers: random fulfillment based on capacity
  if (rng() < mfg.productionCapacity) {
    order.fulfilled = true;
    return true;
  }

  // Unfulfilled: delay 1-2 rounds (1-2 week lead time)
  order.delayedRounds = Math.floor(1 + rng() * 2);
  return false;
}

/**
 * Apply engine performance modifier to bike.
 * Older engines degrade over time.
 */
export function getEnginePerformanceModifier(engineAge: number): number {
  // Performance degrades 2% per season
  const degradation = 0.02 * engineAge;
  return Math.max(0.7, 1.0 - degradation);  // cap at 70% (very old engines)
}

/**
 * Apply chassis setup performance based on development level (0-100).
 */
export function getChassisPerformanceModifier(developmentLevel: number): number {
  // 0 = baseline, 100 = +5% performance
  return 1.0 + (developmentLevel / 100) * 0.05;
}
