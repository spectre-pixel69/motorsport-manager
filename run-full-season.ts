import { simulateFullSeason } from './src/sim/single-season.ts';

console.log('='.repeat(80));
console.log('FULL SEASON SIMULATION TEST — WITH ACTUAL RACE SIMULATION');
console.log('='.repeat(80));
console.log('');

const result = simulateFullSeason(42, true);

console.log('\n\n' + '='.repeat(80));
console.log('FINAL SEASON REPORT');
console.log('='.repeat(80));

console.log('\n📊 CHAMPIONSHIP WINNERS:');
result.finalChampions.forEach(c => {
  console.log(`  ${c.class.padEnd(10)} → ${c.rider.padEnd(20)} (${c.team}) [${c.points} pts]`);
});

console.log('\n🏁 CHAMPIONSHIP SWINGS (Leadership Changes):');
if (result.championshipSwings.length > 0) {
  result.championshipSwings.forEach(s => {
    console.log(`  Round ${s.round.toString().padStart(2)}: ${s.class.padEnd(10)} → ${s.leader.padEnd(20)} (${s.reason.substring(0, 50)}...)`);
  });
} else {
  console.log('  (None recorded)');
}

console.log('\n🏭 MANUFACTURER RANKINGS (End of Season):');
result.manufacturerDominance.slice(0, 8).forEach((m, i) => {
  console.log(`  ${(i + 1)}. ${m.manufacturer.padEnd(18)} ${m.wins}W/${m.points}pts (${m.finalState})`);
});

console.log('\n💰 MANUFACTURER CASH RESERVES (End of Season):');
const finalRound = result.rounds[result.rounds.length - 1];
if (finalRound) {
  finalRound.manufacturerStates.forEach(m => {
    const cash = m.cash.toLocaleString();
    const capacity = (m.capacity * 100).toFixed(0);
    const program = m.cash >= 100_000_000 ? '✅ CAN START ENGINE PROGRAM' :
                    m.cash >= 150_000_000 ? '✅ CAN START ENGINE + CHASSIS' :
                    m.cash >= 50_000_000 ? '⚠️  Growing (50M+)' : '📉 Limited (<50M)';
    console.log(`  ${m.name.padEnd(18)} $${cash.padStart(12)}  [${program}]  (${capacity}% capacity)`);
  });
}

console.log(`\n🛞 TIRE DOMINANCE:`);
if (result.tireWinner) {
  console.log(`  ${result.tireWinner.brand.padEnd(15)} ${result.tireWinner.wins}W/${result.tireWinner.podiums}P`);
} else {
  console.log('  (None recorded)');
}

console.log('\n📝 ROUND-BY-ROUND SUMMARY:');
result.rounds.forEach((r, i) => {
  const leader = r.standings[0];
  const failures = r.mechanicalFailures.length;
  const crashes = r.crashes.length;
  console.log(`  R${r.round}: Leader ${leader?.rider ?? '?'}`.padEnd(45) +
              `| ${failures} mech, ${crashes} crashes`);
});

console.log('\n' + '='.repeat(80));
console.log(`SEASON ${result.season} COMPLETE (Seed: ${result.seed})`);
console.log('='.repeat(80));
