import { buildUniverse } from './src/data/universe.ts';
import { mulberry32, hashString } from './src/util/rng.ts';
import { NAMC_2027_CALENDAR } from './src/data/namc.ts';

const seed = 42;
const universe = buildUniverse(seed);
const cal = universe.calendars['namc'];

console.log('NAMC Calendar Weather Bias Check:\n');
console.log('Round | Track        | Location           | Bias   | Random | Wet?');
console.log('─────────────────────────────────────────────────────────────────');

let wetCount = 0;
for (let i = 0; i < cal.length; i++) {
  const round = cal[i];
  const track = universe.tracks[round.trackId];
  const rng = mulberry32(hashString(`${seed}:${universe.season}:namc:${i + 1}`));
  const r = rng();
  const wet = r < track.weatherBias;
  if (wet) wetCount++;

  console.log(
    `${(i+1).toString().padStart(2)}   | ${track.name.padEnd(12)} | ${track.location.padEnd(18)} | ${(track.weatherBias).toFixed(2)}   | ${r.toFixed(3)} | ${wet ? 'WET' : 'dry'}`
  );
}

console.log(`\nTotal wet races: ${wetCount}/20`);
console.log(`Expected: ~4-5 (21.6% average bias)`);
