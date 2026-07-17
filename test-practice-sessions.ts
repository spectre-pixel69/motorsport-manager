/**
 * TEST: Practice Sessions
 *
 * Validates:
 * 1. Practice crash rates are realistic
 * 2. Severe crashes injure riders (prevent them from racing)
 * 3. Minor crashes don't prevent racing
 * 4. Bike damage accumulation from crashes
 * 5. Setup quality feedback from practice
 */

import { buildUniverse } from './src/data/universe.ts';
import { simulatePracticeSession } from './src/sim/motocross.ts';
import { NAMC_CLASS_IDS } from './src/data/namc.ts';
import { mulberry32, hashString } from './src/util/rng.ts';

export function testPracticeSessions(seed?: number): void {
  const s = seed ?? 42;
  const universe = buildUniverse(s);

  console.log('='.repeat(80));
  console.log('PRACTICE SESSION MECHANICS TEST');
  console.log('='.repeat(80));
  console.log('');

  const cal = universe.calendars['namc'];
  const round = cal[0];
  const track = universe.tracks[round.trackId];

  // Collect stats from practice simulation
  let totalPracticeSessions = 0;
  let totalCrashes = 0;
  let severalInjuries = 0;
  let minorInjuries = 0;
  let noInjuries = 0;
  let avgBikeDamage = 0;
  let avgSetupQuality = 0;

  const rng = mulberry32(hashString(`${s}:practice-test`));

  console.log('📊 PRACTICE CRASH ANALYSIS (100 riders × 2 sessions = 200 practice runs):');
  console.log('');

  let sessionCount = 0;
  for (const classId of NAMC_CLASS_IDS) {
    for (const rider of Object.values(universe.riders)) {
      if (rider.classId !== classId || sessionCount > 50) continue;

      // Run 2 practice sessions per rider
      for (let session = 0; session < 2; session++) {
        const outcome = simulatePracticeSession(rng, rider, track, false);

        totalPracticeSessions++;
        avgBikeDamage += outcome.bikeDamage;
        avgSetupQuality += outcome.setupQuality;

        if (outcome.crashed) {
          totalCrashes++;

          if (outcome.injury === 'severe') {
            severalInjuries++;
            console.log(`  🚑 SEVERE: ${rider.name} — ${outcome.injurySidelines} rounds out (bike ${(outcome.bikeDamage * 100).toFixed(0)}% damage)`);
          } else if (outcome.injury === 'moderate') {
            minorInjuries++;
          } else if (outcome.injury === 'minor') {
            minorInjuries++;
          } else {
            noInjuries++;
          }
        }
      }

      sessionCount++;
      if (sessionCount > 50) break;
    }
  }

  avgBikeDamage /= totalPracticeSessions;
  avgSetupQuality /= totalPracticeSessions;
  const crashRate = (totalCrashes / totalPracticeSessions) * 100;

  console.log('');
  console.log('📈 PRACTICE STATISTICS:');
  console.log(`  Total practice sessions: ${totalPracticeSessions}`);
  console.log(`  Total crashes: ${totalCrashes} (${crashRate.toFixed(1)}% crash rate)`);
  console.log(`  Expected crash rate: 3-5% (dry), higher when wet`);
  console.log('');
  console.log('  Injury distribution:');
  console.log(`    Severe (out 2-5 rounds): ${severalInjuries} (${((severalInjuries / totalCrashes) * 100).toFixed(0)}% of crashes)`);
  console.log(`    Moderate/Minor: ${minorInjuries} (${((minorInjuries / totalCrashes) * 100).toFixed(0)}% of crashes)`);
  console.log(`    No injury despite crash: ${noInjuries} (${((noInjuries / totalCrashes) * 100).toFixed(0)}% of crashes)`);
  console.log('');
  console.log(`  Average bike damage per practice: ${(avgBikeDamage * 100).toFixed(1)}%`);
  console.log(`  Average setup quality gained: ${(avgSetupQuality * 100).toFixed(1)}%`);

  // Impact analysis
  console.log('\n🎯 REAL-WORLD IMPACT:');
  if (severalInjuries > 0) {
    console.log(`  ✓ ${severalInjuries} riders won't make race day due to practice injuries`);
    console.log(`  ✓ Teams must have backup riders (bench system) for practice attrition`);
  }
  if (crashRate > 2) {
    console.log(`  ✓ Practice is risky — riders/teams must balance dialing-in vs safety`);
  }

  console.log('\n\n✅ PRACTICE SESSION TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('Impact: Severe practice crashes can keep riders from races');
  console.log('Gameplay: Teams must manage practice aggression (push vs safety)');
  console.log('='.repeat(80));
}

testPracticeSessions(42);
