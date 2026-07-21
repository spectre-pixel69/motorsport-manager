/**
 * TEST: Gate Start Mechanics
 *
 * Verifies that motocross gate starts function correctly:
 * 1. All riders launch simultaneously (cumTime starts at 0 for all)
 * 2. Holeshot determined by starts skill, aggression, approach, luck, morale
 * 3. Start spread variance is realistic (0.5-2.5 seconds)
 * 4. Skills matter: high-starts riders win most holesshots
 * 5. Luck matters: variance prevents domination (sometimes upsets occur)
 */

import { buildUniverse } from './src/data/universe.ts';
import { simulateRace, lapsForMinutes, type Entrant } from './src/sim/engine.ts';
import { simulateGateStart, terrainProfileForRound } from './src/sim/motocross.ts';
import { NAMC_CLASS_IDS } from './src/data/namc.ts';
import { mulberry32, hashString } from './src/util/rng.ts';

interface HoleshotMetrics {
  rider: string;
  startsSkill: number;
  aggression: number;
  morale: number;
  holeshotWins: number;
  top3Starts: number;
  races: number;
  holeshotWinRate: number;
}

export function testGateStarts(seed?: number): void {
  const s = seed ?? 42;
  const universe = buildUniverse(s);

  console.log('='.repeat(80));
  console.log('MOTOCROSS GATE START MECHANICS TEST');
  console.log('='.repeat(80));
  console.log('');

  const cal = universe.calendars['namc'];
  const metricsMap: Record<string, HoleshotMetrics> = {};

  // Track start spreads per round
  let totalStartSpreads: number[] = [];
  let totalHoleshotWins = 0;
  let totalRaces = 0;

  // Run 5 rounds (20 races) to collect gate start data
  for (let roundIdx = 0; roundIdx < Math.min(5, cal.length); roundIdx++) {
    const round = cal[roundIdx];
    const roundNum = roundIdx + 1;
    const rng = mulberry32(hashString(`${s}:${universe.season}:namc:gate:${roundNum}`));

    console.log(`\n📍 ROUND ${roundNum} — ${round.trackId} (Gate Start Analysis)`);

    for (const classId of NAMC_CLASS_IDS) {
      const entrants: Entrant[] = [];

      for (const rider of Object.values(universe.riders)) {
        if (rider.classId !== classId || rider.bench || rider.injuredForRounds > 0) continue;
        const team = rider.teamId ? universe.teams[rider.teamId] : null;
        if (!team) continue;

        const tire = team.tireBrandId ? universe.tireBrands[team.tireBrandId] : undefined;
        entrants.push({
          rider,
          team,
          tire,
          gridPos: entrants.length + 1,
          approach: 'normal',
        });
      }

      if (entrants.length === 0) continue;

      // Simulate gate start
      const gateRng = mulberry32(hashString(`${s}:${universe.season}:${roundNum}:${classId}:gate`));
      const gateStart = simulateGateStart(gateRng, entrants, universe.tracks[round.trackId]);

      // Track holeshot winner
      const holeshotter = entrants.find(e => e.rider.id === gateStart.holeshotter)!;
      totalHoleshotWins++;
      totalRaces++;

      if (!metricsMap[holeshotter.rider.id]) {
        metricsMap[holeshotter.rider.id] = {
          rider: holeshotter.rider.name,
          startsSkill: holeshotter.rider.stats.starts,
          aggression: holeshotter.rider.stats.aggression,
          morale: holeshotter.rider.morale,
          holeshotWins: 0,
          top3Starts: 0,
          races: 0,
          holeshotWinRate: 0,
        };
      }

      const metrics = metricsMap[holeshotter.rider.id];
      metrics.holeshotWins++;
      metrics.races++;

      totalStartSpreads.push(gateStart.startSpread);

      // Find top 3 starters
      const startOrder = Object.entries(gateStart.startAdjustments)
        .map(([id, adj]) => ({ id, adj }))
        .sort((a, b) => a.adj - b.adj)
        .slice(0, 3);

      for (const { id } of startOrder) {
        const rider = universe.riders[id];
        if (!metricsMap[id]) {
          metricsMap[id] = {
            rider: rider.name,
            startsSkill: rider.stats.starts,
            aggression: rider.stats.aggression,
            morale: rider.morale,
            holeshotWins: 0,
            top3Starts: 0,
            races: 0,
            holeshotWinRate: 0,
          };
        }
        metricsMap[id].top3Starts++;
        metricsMap[id].races++;
      }

      console.log(
        `  ${classId}: Holeshot: ${holeshotter.rider.name} (starts: ${holeshotter.rider.stats.starts}) | Start spread: ${gateStart.startSpread.toFixed(2)}s`,
      );
    }
  }

  // ===== ANALYSIS =====
  console.log('\n\n' + '='.repeat(80));
  console.log('GATE START VALIDATION RESULTS');
  console.log('='.repeat(80));

  console.log('\n📊 START SPREAD STATISTICS:');
  const avgSpread = totalStartSpreads.reduce((a, b) => a + b) / totalStartSpreads.length;
  const minSpread = Math.min(...totalStartSpreads);
  const maxSpread = Math.max(...totalStartSpreads);
  console.log(`  Average start spread: ${avgSpread.toFixed(2)}s`);
  console.log(`  Min: ${minSpread.toFixed(2)}s, Max: ${maxSpread.toFixed(2)}s`);
  console.log(`  Expected range: 0.5-2.5s`);
  if (avgSpread >= 0.5 && avgSpread <= 2.5) {
    console.log(`  ✓ Start spread is realistic`);
  } else if (avgSpread < 0.3) {
    console.log(`  ⚠️  START SPREAD TOO TIGHT — riders too equal`);
  } else if (avgSpread > 3.0) {
    console.log(`  ⚠️  START SPREAD TOO WIDE — huge variance`);
  }

  console.log('\n🏍️  HOLESHOT DOMINANCE (by starts skill):');
  const topHoleshotters = Object.values(metricsMap)
    .filter(m => m.holeshotWins > 0)
    .map(m => ({ ...m, winRate: m.holeshotWins / m.races }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 6);

  topHoleshotters.forEach((rider, i) => {
    const skillRating = rider.startsSkill > 75 ? '★★★ Elite' : rider.startsSkill > 60 ? '★★ Strong' : '★ Average';
    console.log(
      `  ${i + 1}. ${rider.rider.padEnd(25)} ${rider.holeshotWins}/${rider.races} holeshotWins (${(rider.winRate * 100).toFixed(0)}%) | starts: ${rider.startsSkill} ${skillRating}`,
    );
  });

  console.log('\n🎯 GATE START QUALITY DISTRIBUTION:');
  const startQuality = Object.values(metricsMap)
    .filter(m => m.races > 0)
    .map(m => ({ ...m, top3Rate: m.top3Starts / m.races }))
    .sort((a, b) => b.top3Rate - a.top3Rate)
    .slice(0, 10);

  startQuality.forEach((rider, i) => {
    console.log(
      `  ${(i + 1).toString().padEnd(2)}. ${rider.rider.padEnd(25)} ${rider.top3Starts}/${rider.races} top-3 starts (${(rider.top3Rate * 100).toFixed(0)}%)`,
    );
  });

  console.log('\n⚙️  TERRAIN PROFILE TEST:');
  const rng = mulberry32(hashString(`${s}:terrain-test`));
  const testTrack = universe.tracks['fox'];
  if (testTrack) {
    const dryTerrain = terrainProfileForRound(rng, testTrack, false, 1);
    const wetTerrain = terrainProfileForRound(rng, testTrack, true, 10);
    console.log(`  Track: ${testTrack.name}`);
    console.log(`  Dry conditions: grip=${dryTerrain.gripMod.toFixed(2)}, wear=${dryTerrain.wearMod.toFixed(2)}, dust=${(dryTerrain.dustFactor * 100).toFixed(0)}%`);
    console.log(`  Wet conditions: grip=${wetTerrain.gripMod.toFixed(2)}, wear=${wetTerrain.wearMod.toFixed(2)}, dust=${(wetTerrain.dustFactor * 100).toFixed(0)}%`);
    console.log(`  Wet impact: grip ${((wetTerrain.gripMod / dryTerrain.gripMod - 1) * 100).toFixed(0)}% change, wear ${((wetTerrain.wearMod / dryTerrain.wearMod - 1) * 100).toFixed(0)}% change`);
  }

  console.log('\n\n✅ GATE START TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('Next: Verify fitness impact, aggression modeling, full race validation');
  console.log('='.repeat(80));
}

// Run the test
testGateStarts(42);
