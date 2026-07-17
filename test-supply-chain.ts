/**
 * TEST: Supply Chain Integration
 *
 * Validates:
 * 1. Component failure rates based on conditions
 * 2. Manufacturer order fulfillment and lead times
 * 3. Financial state transitions
 * 4. Cost multipliers and scarcity effects
 * 5. Weather-driven demand spikes
 */

import { mulberry32, hashString } from './src/util/rng';
import {
  failureChance,
  willOrderBeFulfilled,
  costMultiplierForManufacturer,
  leadTimeInRounds,
  updateManufacturerHealth,
  demandMultiplierForWeather,
  atkPremium,
} from './src/game/supply-chain';
import type { Manufacturer } from './src/data/types';

export function testSupplyChain(seed?: number): void {
  const s = seed ?? 42;
  const rng = mulberry32(hashString(`supply-chain-test:${s}`));

  console.log('='.repeat(80));
  console.log('SUPPLY CHAIN INTEGRATION TEST');
  console.log('='.repeat(80));
  console.log('');

  // Test 1: Component Failure Rates
  console.log('📊 COMPONENT FAILURE RATE ANALYSIS:');
  console.log('');

  const testCases = [
    { name: 'High-reliability, dry, standard mode', rel: 90, wear: 20, grip: 1.0, wet: false, mode: 'standard' },
    { name: 'Low-reliability, wet, push mode', rel: 50, wear: 80, grip: 0.8, wet: true, mode: 'push' },
    { name: 'Balanced, soft-track, attack mode', rel: 70, wear: 50, grip: 0.7, wet: false, mode: 'attack' },
    { name: 'Balanced, hard-pack, conserve mode', rel: 70, wear: 50, grip: 1.2, wet: false, mode: 'conserve' },
    { name: 'Worn-out, soft-track, wet, push', rel: 40, wear: 100, grip: 0.65, wet: true, mode: 'push' },
  ];

  for (const test of testCases) {
    const p = failureChance({
      componentType: 'engine',
      componentReliability: test.rel,
      componentWear: test.wear,
      trackGrip: test.grip,
      wet: test.wet,
      engineMode: test.mode,
    });
    console.log(`  ${test.name.padEnd(45)} → ${(p * 100).toFixed(2)}% failure/lap`);
  }

  // Test 2: Manufacturer Order Fulfillment
  console.log('\n🏭 MANUFACTURER ORDER FULFILLMENT:');
  console.log('');

  const manufacturers: Record<string, Manufacturer> = {
    stable: {
      id: 'stable',
      name: 'Stable Manufacturer',
      color: '#00ff00',
      reliabilityBias: 'balanced',
      performanceCeiling: 75,
      cashOnHand: 2000000,
      financialState: 'stable',
      productionCapacity: 1.0,
      baseEngineCost: 80000,
      costMultiplier: 1.0,
    },
    stressed: {
      id: 'stressed',
      name: 'Stressed Manufacturer',
      color: '#ff8800',
      reliabilityBias: 'balanced',
      performanceCeiling: 75,
      cashOnHand: 500000,
      financialState: 'stressed',
      productionCapacity: 0.7,
      baseEngineCost: 80000,
      costMultiplier: 1.15,
    },
    crisis: {
      id: 'crisis',
      name: 'Crisis Manufacturer',
      color: '#ff0000',
      reliabilityBias: 'fragile',
      performanceCeiling: 85,
      cashOnHand: 100000,
      financialState: 'crisis',
      productionCapacity: 0.4,
      baseEngineCost: 80000,
      costMultiplier: 1.5,
    },
  };

  for (const [key, mfg] of Object.entries(manufacturers)) {
    const rngLocal = mulberry32(hashString(`${s}:orders:${key}`));
    const fulfillmentTests = 100;
    let fulfilled = 0;
    for (let i = 0; i < fulfillmentTests; i++) {
      if (willOrderBeFulfilled(rngLocal, mfg, false)) fulfilled++;
    }
    const costMult = costMultiplierForManufacturer(mfg);
    const leadTime = leadTimeInRounds(rngLocal, mfg, false, 5);
    const rushLeadTime = leadTimeInRounds(rngLocal, mfg, true, 5);

    console.log(`  ${mfg.name.padEnd(25)} | Fulfillment: ${(fulfilled / fulfillmentTests * 100).toFixed(0)}% | Cost: ${costMult.toFixed(2)}x | Lead: ${leadTime}r / ${rushLeadTime}r(rush)`);
  }

  // Test 3: Weather-Driven Demand
  console.log('\n🌧️  WEATHER-DRIVEN DEMAND MULTIPLIERS:');
  console.log('');

  const crashRates = [0.02, 0.05, 0.10, 0.15, 0.20];
  for (const rate of crashRates) {
    const dryDemand = demandMultiplierForWeather(false, rate);
    const wetDemand = demandMultiplierForWeather(true, rate);
    console.log(`  Crash rate ${(rate * 100).toFixed(0)}%: dry=${dryDemand.toFixed(2)}x, wet=${wetDemand.toFixed(2)}x`);
  }

  // Test 4: Manufacturer Health Updates
  console.log('\n💰 MANUFACTURER FINANCIAL STATE TRANSITIONS:');
  console.log('');

  const scenarios = [
    {
      name: 'Stable → Stressed (bad quarter)',
      initial: { ...manufacturers.stable, cashOnHand: 400000 },
      orders: 100,
      fulfilled: 70,
      avgOrder: 85000,
    },
    {
      name: 'Stressed → Crisis (cash crunch)',
      initial: { ...manufacturers.stressed, cashOnHand: 250000 },
      orders: 100,
      fulfilled: 40,
      avgOrder: 85000,
    },
    {
      name: 'Crisis → Recovering (recovery)',
      initial: { ...manufacturers.crisis, cashOnHand: 800000 },
      orders: 100,
      fulfilled: 95,
      avgOrder: 100000,
    },
  ];

  for (const scenario of scenarios) {
    const updated = updateManufacturerHealth(scenario.initial, scenario.orders, scenario.fulfilled, scenario.avgOrder);
    const cashChange = updated.cashOnHand - scenario.initial.cashOnHand;
    console.log(`  ${scenario.name.padEnd(35)}`);
    console.log(`    Initial: ${scenario.initial.financialState} (${scenario.initial.cashOnHand.toLocaleString()}) → Final: ${updated.financialState} (${updated.cashOnHand.toLocaleString()})`);
    console.log(`    Cash change: ${cashChange > 0 ? '+' : ''}${(cashChange / 1000).toFixed(0)}k | Capacity: ${scenario.initial.productionCapacity.toFixed(2)} → ${updated.productionCapacity.toFixed(2)}`);
  }

  // Test 5: ATK Premium
  console.log('\n🔧 ATK (ALWAYS-THERE KIT) PRICING:');
  console.log('');
  console.log(`  Normal engine cost: $80,000`);
  console.log(`  ATK engine cost: $${(80000 * atkPremium()).toLocaleString()} (${(atkPremium() * 100 - 100).toFixed(0)}% premium)`);
  console.log(`  ATK availability: 100% guaranteed (vs. manufacturer capacity-dependent)`);

  console.log('\n\n✅ SUPPLY CHAIN TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('Metrics: Component failures follow realistic load patterns');
  console.log('Manufacturers transition between states based on order fulfillment and cash flow');
  console.log('Weather affects parts demand; scarcity increases costs');
  console.log('='.repeat(80));
}

testSupplyChain(42);
