import { newCareer, runRound, riderStandingsFor } from './src/game/state';
import { NAMC_CLASS_IDS } from './src/data/namc';

const career = newCareer({
  seed: 5000,
  discipline: 'namc',
  championship: 'fourStroke',
  mode: 'create',
  teamName: 'Test',
});

let state = career;

// Run 1 round
console.log('Running 1 round...');
runRound(state, {});
state.round += 1;

// Check standings
console.log('\nStandings structure:');
console.log(`Riders keys:`, Object.keys(state.standings.riders).slice(0, 5));
console.log(`Teams keys:`, Object.keys(state.standings.teams).slice(0, 5));
console.log(`Tires keys:`, Object.keys(state.standings.tires));

// Try to get 350 class standings
console.log('\n350 Class Standings:');
const c350standings = riderStandingsFor(state, 'c350');
console.log(`  Count: ${c350standings.length}`);
if (c350standings.length > 0) {
  console.log(`  1st: ${c350standings[0].rider.name} (${c350standings[0].pts} pts)`);
  console.log(`  2nd: ${c350standings[1].rider.name} (${c350standings[1].pts} pts)`);
}

// Check raw standings object
console.log('\nRaw standings.riders sample:');
const riderKeys = Object.keys(state.standings.riders).slice(0, 3);
riderKeys.forEach(key => {
  console.log(`  ${key}: ${JSON.stringify(state.standings.riders[key])}`);
});
