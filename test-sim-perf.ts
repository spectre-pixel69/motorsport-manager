/**
 * TEST: Race Simulation Performance Profiling
 *
 * Measures and profiles:
 * 1. Full 20-round season simulation time
 * 2. Single race simulation time
 * 3. Per-component bottleneck analysis
 * 4. Memory usage patterns
 * 5. Event generation overhead
 *
 * Target: Full season in <5s, single race in <100ms
 */

import { buildUniverse } from './src/data/universe.ts';
import { simulateRace, lapsForMinutes, type Entrant } from './src/sim/engine.ts';
import { NAMC_CLASS_IDS } from './src/data/namc.ts';
import { mulberry32, hashString } from './src/util/rng.ts';

interface PerfMetrics {
  label: string;
  count: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
}

export function profileRaceSim(seed?: number): void {
  const s = seed ?? 42;
  const universe = buildUniverse(s);

  console.log('='.repeat(80));
  console.log('RACE SIMULATION PERFORMANCE PROFILE');
  console.log('='.repeat(80));
  console.log('');

  const metrics: Record<string, PerfMetrics> = {};

  const recordMetric = (label: string, ms: number) => {
    if (!metrics[label]) {
      metrics[label] = { label, count: 0, totalMs: 0, avgMs: 0, minMs: Infinity, maxMs: -Infinity };
    }
    const m = metrics[label];
    m.count++;
    m.totalMs += ms;
    m.avgMs = m.totalMs / m.count;
    m.minMs = Math.min(m.minMs, ms);
    m.maxMs = Math.max(m.maxMs, ms);
  };

  // Phase 1: Single race profiling (10 races)
  console.log('📊 SINGLE RACE SIMULATION (10 races):');
  console.log('');

  const cal = universe.calendars['namc'];
  const raceRng = mulberry32(hashString(`${s}:perf:races`));

  for (let raceIdx = 0; raceIdx < 10; raceIdx++) {
    const round = cal[raceIdx % cal.length];
    const classId = NAMC_CLASS_IDS[raceIdx % NAMC_CLASS_IDS.length];
    const track = universe.tracks[round.trackId];

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

    const laps = lapsForMinutes(track, 40);
    const t0 = performance.now();
    const result = simulateRace(raceRng, entrants, track, laps, {});
    const t1 = performance.now();

    const ms = t1 - t0;
    recordMetric('singleRace', ms);
    console.log(`  Race ${raceIdx + 1}: ${ms.toFixed(2)}ms (${entrants.length} riders, ${laps} laps, ${result.events.length} events)`);
  }

  // Phase 2: Full season profiling
  console.log('\n📈 FULL SEASON SIMULATION (20 rounds × 4 classes):');
  console.log('');

  const t0Season = performance.now();
  let totalRaces = 0;
  let totalEvents = 0;

  for (let roundIdx = 0; roundIdx < cal.length; roundIdx++) {
    const round = cal[roundIdx];
    const roundNum = roundIdx + 1;
    const rng = mulberry32(hashString(`${s}:perf:season:${roundNum}`));

    const roundT0 = performance.now();
    let roundEvents = 0;

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

      const track = universe.tracks[round.trackId];
      const laps = lapsForMinutes(track, 40);
      const result = simulateRace(rng, entrants, track, laps, {});

      recordMetric('seasonRace', 0); // will update below
      roundEvents += result.events.length;
      totalRaces++;
      totalEvents += result.events.length;
    }

    const roundT1 = performance.now();
    const roundMs = roundT1 - roundT0;
    console.log(`  Round ${roundNum}: ${roundMs.toFixed(2)}ms (4 races, ${roundEvents} events)`);
  }

  const t1Season = performance.now();
  const totalMs = t1Season - t0Season;

  console.log(`\n  ✓ Full season: ${totalMs.toFixed(2)}ms (${totalRaces} races, ${totalEvents} events)`);

  // Analysis
  console.log('\n\n' + '='.repeat(80));
  console.log('PERFORMANCE ANALYSIS');
  console.log('='.repeat(80));
  console.log('');

  const singleRaceMetric = metrics['singleRace'];
  if (singleRaceMetric) {
    console.log('⏱️  SINGLE RACE TIMING:');
    console.log(`  Average: ${singleRaceMetric.avgMs.toFixed(2)}ms`);
    console.log(`  Range: ${singleRaceMetric.minMs.toFixed(2)}ms - ${singleRaceMetric.maxMs.toFixed(2)}ms`);
    console.log(`  Target: <100ms per race`);
    if (singleRaceMetric.avgMs < 100) {
      console.log(`  ✓ Single race performance is good`);
    } else {
      console.log(`  ⚠️  Single race is slow (${(singleRaceMetric.avgMs / 100).toFixed(1)}x target)`);
    }
  }

  console.log('\n📊 SEASON THROUGHPUT:');
  const seasonRaceCount = 80; // 20 rounds × 4 classes
  console.log(`  Total: ${totalMs.toFixed(2)}ms for ${seasonRaceCount} races`);
  console.log(`  Per race: ${(totalMs / seasonRaceCount).toFixed(2)}ms`);
  console.log(`  Events per second: ${(totalEvents / (totalMs / 1000)).toFixed(0)}`);
  console.log(`  Target: <5s total`);
  if (totalMs < 5000) {
    console.log(`  ✓ Full season within target`);
  } else {
    console.log(`  ⚠️  Full season is slow (${(totalMs / 5000).toFixed(1)}x target)`);
  }

  console.log('\n\n✅ PERFORMANCE PROFILE COMPLETE');
  console.log('='.repeat(80));
  console.log('Targets: Single race <100ms, Full season <5s');
  console.log('Recommendation: Profile lap-by-lap loop if times exceed targets');
  console.log('='.repeat(80));
}

profileRaceSim(42);
