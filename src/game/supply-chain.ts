/**
 * SUPPLY CHAIN INTEGRATION SYSTEM
 *
 * Handles motocross parts reliability, lead times, manufacturer capacity, and scarcity:
 * 1. Component wear interconnection (soft tracks accelerate wear faster)
 * 2. Manufacturer financial health affects parts availability
 * 3. Lead times: parts ordered now arrive in 1-2 weeks (or mid-round if rushed)
 * 4. Supply scarcity: stressed/crisis manufacturers can't fulfill all orders
 * 5. Weather interaction: wet races cause more failures, spike demand
 *
 * RULES:
 * - Standard lead time: 1-2 weeks (1-2 rounds)
 * - Rush order premium: +40% cost, 1-week guarantee
 * - Production capacity reflects financial state:
 *   * stable: 100% (all orders fulfilled)
 *   * stressed: 65-80% (some orders delayed)
 *   * crisis: 30-50% (most orders delayed)
 *   * recovering: 75-90% (gradual improvement)
 */

import type { Manufacturer, BikeComponent, EngineOrder, Universe } from '../data/types';
import { clamp, type RNG } from '../util/rng';

export interface PartFailureContext {
  componentType: string;
  componentReliability: number;  // 0-100
  componentWear: number;         // 0-100
  trackGrip: number;             // 0-1.2 (terrain grip modifier)
  wet: boolean;                  // track weather
  engineMode: string;            // conserve/standard/push/attack
}

/**
 * Calculate failure probability for a bike component.
 * Integrates: base reliability, wear, track conditions, engine mode.
 */
export function failureChance(context: PartFailureContext): number {
  const { componentReliability, componentWear, trackGrip, wet, engineMode } = context;

  // Base failure rate: 100-rel = 1%, 80-rel = 5%, 60-rel = 10%
  let p = Math.max(0.01, (100 - componentReliability) * 0.0025);

  // Wear multiplier: accumulates over season (1% per ~100 miles)
  const wearFactor = 1.0 + (componentWear / 100) * 0.8; // 1.0x at 0%, 1.8x at 100%
  p *= wearFactor;

  // Track grip affects stress: lower grip = more stress on parts
  // Hard-pack (grip 1.1+) = 0.8x stress, soft (grip <0.85) = 1.4x stress
  const gripStress = Math.max(0.7, 2.0 - trackGrip * 1.5); // ranges 0.7-1.3
  p *= gripStress;

  // Weather: wet = more stress, slip = more component wear
  if (wet) p *= 1.4;

  // Engine mode: conserve = 0.6x, standard = 1.0x, push = 1.6x, attack = 2.2x
  const modeMultipliers: Record<string, number> = {
    conserve: 0.6,
    standard: 1.0,
    push: 1.6,
    attack: 2.2,
  };
  p *= modeMultipliers[engineMode] ?? 1.0;

  return clamp(p, 0.001, 0.3); // cap at 30% per lap
}

/**
 * Determine if a parts order will be fulfilled.
 * Depends on manufacturer financial state and production capacity.
 */
export function willOrderBeFulfilled(
  rng: RNG,
  manufacturer: Manufacturer,
  isMidRound: boolean,
): boolean {
  const capacity = manufacturer.productionCapacity;
  const delayPenalty = isMidRound ? 0.15 : 0; // mid-round orders hit a penalty

  // Base fulfillment rate
  const fulfillmentChance = capacity - delayPenalty;

  return rng() < fulfillmentChance;
}

/**
 * Calculate cost multiplier based on manufacturer financial state.
 * Crisis = high prices (suppliers exploit scarcity)
 * Stable = normal pricing
 */
export function costMultiplierForManufacturer(manufacturer: Manufacturer): number {
  const stateMultipliers: Record<string, number> = {
    stable: 1.0,
    stressed: 1.15,
    crisis: 1.5,
    recovering: 1.08,
  };
  return stateMultipliers[manufacturer.financialState] ?? 1.0;
}

/**
 * Calculate lead time in rounds.
 * Depends on: rush order flag, manufacturer capacity, current queue size.
 */
export function leadTimeInRounds(
  rng: RNG,
  manufacturer: Manufacturer,
  rushOrder: boolean,
  currentQueueSize: number, // how many orders ahead of this one
): number {
  if (rushOrder) {
    // Rush orders: 1-week guarantee = 1 round, +10% variance
    return Math.max(1, Math.round(1 + (rng() * 0.1 - 0.05)));
  }

  // Standard lead time: 1-2 weeks = 1-2 rounds
  let baseLeadTime = 1 + Math.floor(rng() * 2); // 1-2 rounds

  // Queue effects: every 10 orders in queue = +0.5 rounds delay
  const queueDelay = Math.floor(currentQueueSize / 10) * 0.5;

  // Financial state affects lead time:
  // crisis: +1 round delay (overloaded), stressed: +0.5, stable: 0, recovering: -0.2
  const stateDelay: Record<string, number> = {
    stable: 0,
    stressed: 0.5,
    crisis: 1.0,
    recovering: -0.2,
  };
  const delayMod = stateDelay[manufacturer.financialState] ?? 0;

  const totalLeadTime = baseLeadTime + queueDelay + delayMod;
  return Math.max(1, Math.round(totalLeadTime));
}

/**
 * Update manufacturer financial state based on orders fulfilled.
 * Tracks cash from fulfilled orders, adjusts capacity.
 */
export function updateManufacturerHealth(
  manufacturer: Manufacturer,
  ordersPlaced: number,
  ordersFulfilled: number,
  averageOrderValue: number,
): Manufacturer {
  const updated = { ...manufacturer };

  // Cash flow: revenue from fulfilled orders
  const revenue = ordersFulfilled * averageOrderValue;
  updated.cashOnHand += revenue;

  // Cash outflow: production costs (assume 60% of order value per unit)
  const productionCost = ordersFulfilled * averageOrderValue * 0.6;
  updated.cashOnHand -= productionCost;

  // State transitions based on cash and fulfillment ratio
  const fulfillmentRatio = ordersPlaced > 0 ? ordersFulfilled / ordersPlaced : 1.0;

  if (updated.financialState === 'crisis') {
    // Crisis → Recovering: need 2+ weeks of stable cash + high fulfillment
    if (updated.cashOnHand > 500000 && fulfillmentRatio > 0.85) {
      updated.financialState = 'recovering';
      updated.productionCapacity = 0.75 + Math.random() * 0.15;
    } else if (fulfillmentRatio < 0.4) {
      // Getting worse: capacity drops
      updated.productionCapacity *= 0.95;
    }
  } else if (updated.financialState === 'stressed') {
    // Stressed → Crisis: bad cash flow + low fulfillment
    if (updated.cashOnHand < 200000 || fulfillmentRatio < 0.5) {
      updated.financialState = 'crisis';
      updated.productionCapacity = 0.3 + Math.random() * 0.2;
    }
    // Stressed → Stable: good fulfillment + healthy cash
    else if (updated.cashOnHand > 1000000 && fulfillmentRatio > 0.9) {
      updated.financialState = 'stable';
      updated.productionCapacity = 1.0;
    }
  } else if (updated.financialState === 'stable') {
    // Stable → Stressed: sustained losses or order backlog
    if (updated.cashOnHand < 500000 || fulfillmentRatio < 0.75) {
      updated.financialState = 'stressed';
      updated.productionCapacity = 0.65 + Math.random() * 0.15;
    }
  } else if (updated.financialState === 'recovering') {
    // Recovering → Stable: steady improvement
    if (updated.cashOnHand > 1000000 && fulfillmentRatio > 0.9) {
      updated.financialState = 'stable';
      updated.productionCapacity = 1.0;
    }
    // Recovering → Crisis: setback
    else if (updated.cashOnHand < 300000 || fulfillmentRatio < 0.4) {
      updated.financialState = 'crisis';
      updated.productionCapacity = 0.3 + Math.random() * 0.2;
    }
  }

  // Capacity bounds
  updated.productionCapacity = clamp(updated.productionCapacity, 0.3, 1.0);
  updated.cashOnHand = Math.max(0, updated.cashOnHand); // can't go negative

  return updated;
}

/**
 * Weather-driven parts demand surge.
 * Wet rounds cause more failures, spike parts demand.
 */
export function demandMultiplierForWeather(wet: boolean, recentCrashRate: number): number {
  if (!wet) return 1.0;

  // Wet racing: base 1.3x demand + crash-rate dependent
  return 1.3 + (recentCrashRate * 0.3);
}

/**
 * Calculate ATK engine availability modifier.
 * ATK (Always-There Kit) manufacturer offers parts that are ALWAYS available
 * at a premium cost, good for emergency situations.
 */
export function atkPremium(): number {
  return 1.8; // ATK parts cost 80% more but always in stock
}
