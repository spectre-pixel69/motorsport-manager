/**
 * TEST: 5-Level Crash Severity System
 *
 * Validates:
 * 1. Crash severity calculation from multiple factors
 * 2. Severity level distribution across crash outcomes
 * 3. Bike damage trees per level
 * 4. Rider injury trees per level
 * 5. Sidelining rates by level
 */

import { buildUniverse } from './src/data/universe.ts';
import { simulateCrash, severityLevelFromPercent } from './src/sim/crash-severity.ts';
import { NAMC_CLASS_IDS } from './src/data/namc.ts';
import { mulberry32, hashString } from './src/util/rng.ts';

export function testCrashSeverity(seed?: number): void {
  const s = seed ?? 42;
  const universe = buildUniverse(s);

  console.log('='.repeat(80));
  console.log('CRASH SEVERITY SYSTEM TEST (5-LEVEL MODEL)');
  console.log('='.repeat(80));
  console.log('');

  const rng = mulberry32(hashString(`${s}:crash-severity-test`));

  // Collect statistics
  const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const injuryByLevel: Record<number, { sidelined: number; canRace: number }> = {
    1: { sidelined: 0, canRace: 0 },
    2: { sidelined: 0, canRace: 0 },
    3: { sidelined: 0, canRace: 0 },
    4: { sidelined: 0, canRace: 0 },
    5: { sidelined: 0, canRace: 0 },
  };
  const bikeCanContinue = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalCrashes = 0;
  let severeInjuries = 0;
  let catastrophicCrashes = 0;

  console.log('📊 CRASH SEVERITY DISTRIBUTION (200 simulated crashes):');
  console.log('');

  let crashCount = 0;
  for (const classId of NAMC_CLASS_IDS) {
    for (const rider of Object.values(universe.riders)) {
      if (rider.classId !== classId || crashCount >= 200) continue;

      // Simulate crash with typical bike wear (30%) and dry track (grip 0.95)
      const outcome = simulateCrash(rng, rider, 0.30, 0.95, false);
      totalCrashes++;
      levelCounts[outcome.level]++;
      injuryByLevel[outcome.level][outcome.rider.canRaceThisWeekend ? 'canRace' : 'sidelined']++;
      if (outcome.bike.canContinueRacing) bikeCanContinue[outcome.level]++;

      if (outcome.rider.sidelinesRounds > 0) {
        severeInjuries++;
      }
      if (outcome.level === 5) {
        catastrophicCrashes++;
        console.log(`  💥 LEVEL 5: ${rider.name} — severity ${outcome.severityPercent.toFixed(0)}%, engine blown, out ${outcome.rider.sidelinesRounds} rounds`);
      }

      crashCount++;
      if (crashCount >= 200) break;
    }
  }

  console.log('');
  console.log('📈 CRASH SEVERITY DISTRIBUTION:');
  console.log(`  Level 1 (0-20%): ${levelCounts[1]} crashes (${((levelCounts[1] / totalCrashes) * 100).toFixed(0)}%)`);
  console.log(`  Level 2 (20-40%): ${levelCounts[2]} crashes (${((levelCounts[2] / totalCrashes) * 100).toFixed(0)}%)`);
  console.log(`  Level 3 (40-60%): ${levelCounts[3]} crashes (${((levelCounts[3] / totalCrashes) * 100).toFixed(0)}%)`);
  console.log(`  Level 4 (60-85%): ${levelCounts[4]} crashes (${((levelCounts[4] / totalCrashes) * 100).toFixed(0)}%)`);
  console.log(`  Level 5 (85-100%): ${levelCounts[5]} crashes (${((levelCounts[5] / totalCrashes) * 100).toFixed(0)}%)`);
  console.log('');

  console.log('🚴 INJURY OUTCOMES BY LEVEL:');
  for (let level = 1; level <= 5; level++) {
    const total = injuryByLevel[level].canRace + injuryByLevel[level].sidelined;
    const sidelineRate = total > 0 ? ((injuryByLevel[level].sidelined / total) * 100).toFixed(0) : '0';
    console.log(`  Level ${level}: ${injuryByLevel[level].canRace} can race, ${injuryByLevel[level].sidelined} sidelined (${sidelineRate}%)`);
  }
  console.log('');

  console.log('🏍️  BIKE OUTCOMES BY LEVEL:');
  for (let level = 1; level <= 5; level++) {
    const total = levelCounts[level];
    const continueRate = total > 0 ? ((bikeCanContinue[level] / total) * 100).toFixed(0) : '0';
    console.log(`  Level ${level}: ${bikeCanContinue[level]} can continue, ${total - bikeCanContinue[level]} benched (${continueRate}% continue)`);
  }
  console.log('');

  console.log('⚡ INJURY STATISTICS:');
  console.log(`  Total crashes: ${totalCrashes}`);
  console.log(`  Riders sidelined (any level): ${severeInjuries} (${((severeInjuries / totalCrashes) * 100).toFixed(1)}%)`);
  console.log(`  Level 5 catastrophic: ${catastrophicCrashes} (${((catastrophicCrashes / totalCrashes) * 100).toFixed(1)}%)`);
  console.log('');

  console.log('✅ CRASH SEVERITY TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('Structure: 5 severity levels with graduated damage/injury outcomes');
  console.log('Gameplay: Level 1 = minor (can race), Level 5 = catastrophic (out weeks)');
  console.log('='.repeat(80));
}

testCrashSeverity(42);
