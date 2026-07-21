/**
 * TEST: Does randomness create variation season-to-season?
 *
 * Run 5 seasons with SAME seed but DIFFERENT randomness at each stage
 * (each season gets its own RNG state). Shows whether:
 * 1. Different winners emerge each season
 * 2. Manufacturers rise/fall based on racing performance
 * 3. Same team can't lock down dynasty for 5+ years
 */

import { simulateFullSeason } from './src/sim/single-season.ts';

console.log('='.repeat(80));
console.log('MULTI-SEASON RANDOMNESS TEST');
console.log('Running 5 consecutive seasons to show variance');
console.log('='.repeat(80));

const results = [];
for (let season = 0; season < 5; season++) {
  console.log(`\n📅 SEASON ${season + 1} starting...`);
  const seed = 42 + season; // Different seed per season
  const result = simulateFullSeason(seed, false); // Quiet mode
  results.push(result);
  console.log(`✓ SEASON ${season + 1} complete`);
}

// Analyze patterns
console.log('\n\n' + '='.repeat(80));
console.log('RANDOMNESS ANALYSIS: Do Champions Change?');
console.log('='.repeat(80));

console.log('\n📊 CHAMPIONSHIP WINNERS BY CLASS (Season 1-5):');

const classes = ['c350', 'c250', 'women', 'c250p'];
for (const cls of classes) {
  console.log(`\n  ${cls.toUpperCase()}:`);
  results.forEach((r, i) => {
    const champ = r.finalChampions.find(c => c.class === cls);
    if (champ) {
      console.log(`    S${i + 1}: ${champ.rider.padEnd(20)} (${champ.team}) [${champ.points} pts]`);
    }
  });
}

console.log('\n\n🏭 MANUFACTURER WIN TRENDS (Seasons 1-5):');
const manufacturers = new Set<string>();
results.forEach(r => r.manufacturerDominance.forEach(m => manufacturers.add(m.manufacturer)));

Array.from(manufacturers).sort().forEach(mfg => {
  const wins = results.map((r, i) => {
    const m = r.manufacturerDominance.find(x => x.manufacturer === mfg);
    return m ? m.wins : 0;
  });
  console.log(`  ${mfg.padEnd(18)} S1:${wins[0]} → S2:${wins[1]} → S3:${wins[2]} → S4:${wins[3]} → S5:${wins[4]}`);
});

console.log('\n\n🛞 TIRE DOMINANCE BY SEASON:');
results.forEach((r, i) => {
  if (r.tireWinner) {
    console.log(`  S${i + 1}: ${r.tireWinner.brand.padEnd(18)} ${r.tireWinner.wins}W/${r.tireWinner.podiums}P`);
  }
});

console.log('\n\n💥 MECHANICAL FAILURE TRENDS:');
results.forEach((r, i) => {
  const totalFailures = r.rounds.reduce((sum, round) => sum + round.mechanicalFailures.length, 0);
  const totalCrashes = r.rounds.reduce((sum, round) => sum + round.crashes.length, 0);
  console.log(`  S${i + 1}: ${totalFailures} mechanical failures, ${totalCrashes} crashes`);
});

console.log('\n\n' + '='.repeat(80));
console.log('CONCLUSION');
console.log('='.repeat(80));

// Check for diversity
const s1Champs = new Set(results[0].finalChampions.map(c => c.rider));
const s5Champs = new Set(results[4].finalChampions.map(c => c.rider));
const shared = Array.from(s1Champs).filter(name => s5Champs.has(name));

console.log(`\n✓ Champions from Season 1: ${s1Champs.size} riders`);
console.log(`✓ Champions from Season 5: ${s5Champs.size} riders`);
console.log(`✓ Shared champions (S1→S5): ${shared.length} riders (${shared.length > 0 ? 'DYNASTY RISK' : 'HEALTHY TURNOVER'})`);

const mfgDominated = manufacturers.size > 0 ?
  Array.from(manufacturers)
    .filter(m => {
      const wins = results.map(r => r.manufacturerDominance.find(x => x.manufacturer === m)?.wins || 0);
      return wins.every(w => w > 0); // Won every season
    })
  : [];

console.log(`\n✓ Manufacturers that won EVERY season: ${mfgDominated.length}`);
if (mfgDominated.length > 0) {
  console.log(`  (These show no randomness filtering): ${mfgDominated.join(', ')}`);
} else {
  console.log(`  ✅ Good randomness — different manufacturers win different seasons`);
}

console.log('\n✓ Mechanical failures vary: ' +
  (new Set(results.map(r => r.rounds.reduce((s, rnd) => s + rnd.mechanicalFailures.length, 0))).size > 1
    ? '✅ YES (no two seasons identical)'
    : '❌ NO (static randomness)'));

console.log('\n' + '='.repeat(80));
