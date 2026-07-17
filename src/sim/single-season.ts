/**
 * FULL SEASON SIMULATION: Test complete championship dynamics
 *
 * What we test:
 * - All 20 rounds run with actual race simulation (crashes, failures, variance)
 * - Championship standings evolve round-by-round
 * - Manufacturer financial states respond to racing results
 * - Leadership swings (team leading then crashes out, competitor rises)
 * - Tire manufacturer dominance patterns emerge from race results
 * - Budget pressures cascade into reliability issues
 * - System stability over complete season cycle
 */

import { buildUniverse, gridOf, teamsOf, ridersOfTeam, overallOf } from '../data/universe';
import { simulateRace, lapsForMinutes, simulateQualifying, type Entrant } from './engine';
import { NAMC_CLASS_IDS, TEAM_CHAMPIONSHIP_PURSE } from '../data/namc';
import { classById } from '../data/classes';
import { mulberry32, hashString, clamp } from '../util/rng';
import { updateManufacturerFinance, fulfillEngineOrder } from '../game/parts-economy';

interface RoundSnapshot {
  round: number;
  standings: Array<{ rider: string; class: string; points: number; team: string }>;
  manufacturerStates: Array<{ name: string; cash: number; financialState: string; capacity: number }>;
  mechanicalFailures: Array<{ rider: string; team: string; round: number }>;
  crashes: Array<{ rider: string; team: string; round: number }>;
  tirePerformance: Record<string, { wins: number; podiums: number }>;
}

interface SeasonOutcome {
  seed: number;
  season: number;
  rounds: RoundSnapshot[];
  finalChampions: Array<{ class: string; rider: string; team: string; points: number }>;
  championshipSwings: Array<{ round: number; class: string; leader: string; reason: string }>;
  manufacturerDominance: Array<{ manufacturer: string; wins: number; points: number; finalState: string }>;
  tireWinner: { brand: string; wins: number; podiums: number } | null;
  notes: string[];
}

export function simulateFullSeason(seed?: number, verbose = true): SeasonOutcome {
  const s = seed ?? Math.floor(Math.random() * 2 ** 31);
  const universe = buildUniverse(s);
  const outcome: SeasonOutcome = {
    seed: s,
    season: universe.season,
    rounds: [],
    finalChampions: [],
    championshipSwings: [],
    manufacturerDominance: [],
    tireWinner: null,
    notes: [],
  };

  // Track standings per class per round
  const standings: Record<string, Record<string, number>> = {};
  const mechanicalFailures: Array<{ rider: string; team: string; round: number }> = [];
  const crashes: Array<{ rider: string; team: string; round: number }> = [];
  const tirePerformance: Record<string, { wins: number; podiums: number }> = {};
  const manufacturesWins: Record<string, number> = {};
  const manufacturerPoints: Record<string, number> = {};

  // Initialize standing trackers
  for (const cls of NAMC_CLASS_IDS) {
    standings[cls] = {};
    for (const rider of Object.values(universe.riders)) {
      if (rider.classId === cls) {
        standings[cls][rider.id] = 0;
      }
    }
  }

  // Initialize tire tracking
  for (const tire of Object.values(universe.tireBrands)) {
    tirePerformance[tire.id] = { wins: 0, podiums: 0 };
  }

  // Manufacturer tracking
  for (const mfg of Object.values(universe.manufacturers)) {
    manufacturesWins[mfg.id] = 0;
    manufacturerPoints[mfg.id] = 0;
  }

  const cal = universe.calendars['namc'];
  let prevLeaders: Record<string, string> = {};

  // ======== SEASON LOOP: All 20 Rounds ========
  for (let roundIdx = 0; roundIdx < cal.length; roundIdx++) {
    const round = cal[roundIdx];
    const roundNum = roundIdx + 1;
    const rng = mulberry32(hashString(`${s}:${universe.season}:namc:${roundNum}`));

    const track = universe.tracks[round.trackId];
    if (verbose) console.log(`\n=== ROUND ${roundNum}/${cal.length} @ ${track?.name ?? 'Track'} ===`);

    // Run all 4 NAMC classes this round
    const roundMechanicalFailures: Array<{ rider: string; team: string; round: number }> = [];
    const roundCrashes: Array<{ rider: string; team: string; round: number }> = [];

    for (const classId of NAMC_CLASS_IDS) {
      const cls = classById(classId);
      const entrants: Entrant[] = [];

      // Build entrants list: all active riders in this class
      for (const rider of Object.values(universe.riders)) {
        if (rider.classId !== classId || rider.bench || rider.injuredForRounds > 0) continue;
        const team = rider.teamId ? universe.teams[rider.teamId] : null;
        if (!team) continue;

        const tire = team.tireBrandId ? universe.tireBrands[team.tireBrandId] : undefined;
        const gridPos = entrants.length + 1;

        entrants.push({
          rider,
          team,
          tire,
          gridPos,
          approach: 'normal', // Could vary this with strategy
        });
      }

      if (entrants.length === 0) continue;

      // Run qualifying (determines grid)
      const qualRng = mulberry32(hashString(`${s}:${universe.season}:namc:${roundNum}:qual:${classId}`));
      const qualOrder = simulateRace(qualRng, entrants, track, 1, { allowRemount: false });

      // Sort entrants by qualifying order
      const qualPos: Record<string, number> = {};
      qualOrder.rows.forEach((row, i) => { qualPos[row.riderId] = i + 1; });
      entrants.sort((a, b) => (qualPos[a.rider.id] ?? 99) - (qualPos[b.rider.id] ?? 99));

      // Update grid positions
      entrants.forEach((e, i) => { e.gridPos = i + 1; });

      // Run main race
      const raceRng = mulberry32(hashString(`${s}:${universe.season}:namc:${roundNum}:main:${classId}`));
      const laps = lapsForMinutes(track, 40); // 40-minute moto
      const result = simulateRace(raceRng, entrants, track, laps);

      // Record failures and crashes for round snapshot
      for (const ev of result.events) {
        if (ev.kind === 'mechanical') {
          const rider = universe.riders[ev.riderId];
          if (rider?.teamId) {
            roundMechanicalFailures.push({ rider: rider.name, team: universe.teams[rider.teamId].name, round: roundNum });
          }
        }
        if (ev.kind === 'crash' && !result.events.some(e => e.lap === ev.lap && e.riderId === ev.riderId && e.kind === 'remount')) {
          const rider = universe.riders[ev.riderId];
          if (rider?.teamId) {
            roundCrashes.push({ rider: rider.name, team: universe.teams[rider.teamId].name, round: roundNum });
          }
        }
      }

      // Award championship points (per v15.3 rulebook)
      const pointsScale = [75, 60, 52, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      result.rows.forEach((row, i) => {
        if (i < pointsScale.length) {
          standings[classId][row.riderId] = (standings[classId][row.riderId] ?? 0) + pointsScale[i];
          const team = universe.teams[row.teamId];
          if (team?.manufacturerId) {
            manufacturerPoints[team.manufacturerId] = (manufacturerPoints[team.manufacturerId] ?? 0) + pointsScale[i];
          }
        }
        // Track tire performance
        const rider = universe.riders[row.riderId];
        const team = universe.teams[row.teamId];
        if (team?.tireBrandId) {
          if (i === 0) tirePerformance[team.tireBrandId].wins += 1;
          if (i < 3) tirePerformance[team.tireBrandId].podiums += 1;
        }
      });

      // Track winner's manufacturer
      const winner = universe.riders[result.rows[0]?.riderId];
      if (winner?.teamId) {
        const team = universe.teams[winner.teamId];
        if (team?.manufacturerId) {
          manufacturesWins[team.manufacturerId] = (manufacturesWins[team.manufacturerId] ?? 0) + 1;
        }
      }

      // Check for leadership swings
      const sorted = Object.entries(standings[classId])
        .map(([riderId, pts]) => ({ riderId, pts, rider: universe.riders[riderId] }))
        .sort((a, b) => b.pts - a.pts);
      const leader = sorted[0];
      if (leader && prevLeaders[classId] !== leader.riderId) {
        const from = prevLeaders[classId] ? universe.riders[prevLeaders[classId]]?.name : 'No one';
        const reason = result.events
          .filter(e => e.riderId === leader.riderId)
          .map(e => e.text)
          .join('; ') || 'Strong drive to lead';
        outcome.championshipSwings.push({
          round: roundNum,
          class: classId,
          leader: leader.rider?.name ?? '?',
          reason,
        });
        prevLeaders[classId] = leader.riderId;
        if (verbose) console.log(`  >>> ${classId}: ${from} → ${leader.rider?.name ?? '?'} (${leader.pts} pts)`);
      }

      if (verbose) {
        const winnerTeam = winner?.teamId ? universe.teams[winner.teamId] : null;
        console.log(`  ${classId}: Winner ${winner?.name ?? '?'} (${winnerTeam?.name ?? '?'}) — ${result.rows.length} starters, ${result.rows.filter(r => r.status === 'dnf').length} DNFs`);
      }
    }

    // Record round snapshot
    const snapshot: RoundSnapshot = {
      round: roundNum,
      standings: [],
      manufacturerStates: [],
      mechanicalFailures: roundMechanicalFailures,
      crashes: roundCrashes,
      tirePerformance: { ...tirePerformance },
    };

    // Capture standings snapshot
    for (const classId of NAMC_CLASS_IDS) {
      Object.entries(standings[classId])
        .map(([riderId, pts]) => ({
          rider: universe.riders[riderId]?.name ?? '?',
          class: classId,
          points: pts,
          team: universe.riders[riderId]?.teamId ? universe.teams[universe.riders[riderId].teamId!].name : '?',
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 3)
        .forEach(s => snapshot.standings.push(s));
    }

    // Capture manufacturer states
    for (const mfg of Object.values(universe.manufacturers)) {
      snapshot.manufacturerStates.push({
        name: mfg.name,
        cash: mfg.cashOnHand,
        financialState: mfg.financialState,
        capacity: mfg.productionCapacity,
      });
    }

    outcome.rounds.push(snapshot);

    // Update manufacturer finances at end of round (simulates off-season settlement)
    // Note: Real game does this at season end, but we track it here for observation
    const partsRng = mulberry32(hashString(`${s}:parts:${roundNum}`));
    for (const mfg of Object.values(universe.manufacturers)) {
      const mfgWins = manufacturesWins[mfg.id] ?? 0;
      const mfgPts = manufacturerPoints[mfg.id] ?? 0;
      updateManufacturerFinance(mfg, mfgPts, mfgWins, 0, partsRng);
    }

    if (verbose) {
      console.log(`  Mechanical failures: ${roundMechanicalFailures.length}, Crashes: ${roundCrashes.length}`);
      const leaders = Object.entries(standings)
        .map(([cls, pts]) => {
          const top = Object.entries(pts)
            .map(([rid, p]) => ({ rid, p, name: universe.riders[rid]?.name ?? '?' }))
            .sort((a, b) => b.p - a.p)[0];
          return top ? `${cls}: ${top.name} (${top.p})` : null;
        })
        .filter(x => x);
      if (leaders.length) console.log(`  Leaders: ${leaders.join(' | ')}`);
    }
  }

  // ======== SEASON END: Calculate champions & finalize ========
  if (verbose) console.log('\n=== SEASON END CALCULATIONS ===');

  for (const classId of NAMC_CLASS_IDS) {
    const sorted = Object.entries(standings[classId])
      .map(([riderId, pts]) => ({ rider: universe.riders[riderId], pts }))
      .filter(x => x.rider)
      .sort((a, b) => b.pts - a.pts);
    if (sorted[0]) {
      outcome.finalChampions.push({
        class: classId,
        rider: sorted[0].rider!.name,
        team: sorted[0].rider!.teamId ? universe.teams[sorted[0].rider!.teamId].name : 'Free Agent',
        points: sorted[0].pts,
      });
      if (verbose) console.log(`${classId} CHAMPION: ${sorted[0].rider!.name} (${sorted[0].pts} pts)`);
    }
  }

  // Manufacturer summary
  for (const mfg of Object.values(universe.manufacturers)) {
    outcome.manufacturerDominance.push({
      manufacturer: mfg.name,
      wins: manufacturesWins[mfg.id] ?? 0,
      points: manufacturerPoints[mfg.id] ?? 0,
      finalState: mfg.financialState,
    });
  }
  outcome.manufacturerDominance.sort((a, b) => b.wins - a.wins);

  // Tire winner
  const tiresSorted = Object.entries(tirePerformance)
    .map(([id, perf]) => ({ brand: universe.tireBrands[id]?.name ?? id, ...perf }))
    .sort((a, b) => b.wins - a.wins || b.podiums - a.podiums);
  if (tiresSorted[0] && tiresSorted[0].wins > 0) {
    outcome.tireWinner = tiresSorted[0];
  }

  if (verbose) {
    console.log(`\nTire Dominance: ${tiresSorted.map(t => `${t.brand} ${t.wins}W/${t.podiums}P`).join(', ')}`);
    console.log(`\nManufacturer Rankings (by wins):`);
    outcome.manufacturerDominance.slice(0, 5).forEach(m => {
      console.log(`  ${m.manufacturer}: ${m.wins} wins, ${m.points} pts (${m.finalState})`);
    });
  }

  return outcome;
}

// Export for testing
if (typeof require !== 'undefined' && require.main === module) {
  const result = simulateFullSeason(12345, true);
  console.log('\n\n=== SEASON SUMMARY ===');
  console.log(JSON.stringify(result, null, 2));
}
