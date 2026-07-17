// Full Career Simulation - 5 Seasons with Complete Off-Season Systems
// Includes: Draft, Free Agency, Contract Negotiations, Retirements, Championships

import { newCareer, runRound, seasonOver, advanceSeason, riderStandingsFor, teamStandingsFor } from './src/game/state';
import { NAMC_CLASS_IDS } from './src/data/namc';
import type { ClassId, OffSeasonReport } from './src/game/state';

interface SeasonReport {
  season: number;
  racingSummary: {
    classChampions: Record<ClassId, { name: string; points: number; team: string }>;
    tireChampion: { brand: string; points: number };
    teamChampions: { name: string; points: number; class: ClassId }[];
  };
  offSeason: OffSeasonReport;
  playerTeamBudget: number;
  playerTeamStanding: number;
}

const seasonReports: SeasonReport[] = [];

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         FULL CAREER SIMULATION: 5 SEASONS + OFF-SEASON         ║');
console.log('║  Draft • Free Agency • Contract Negotiations • Retirements     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Create career
const career = newCareer({
  seed: 6000,
  discipline: 'namc',
  championship: 'fourStroke',
  mode: 'create',
  teamName: 'Simulation Manager',
});

let state = career;
const playerTeamId = state.playerTeamId;

// Run 5 full seasons
for (let seasonNum = 0; seasonNum < 5; seasonNum++) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`SEASON ${state.season} - COMPLETE SEASON`);
  console.log(`${'═'.repeat(70)}\n`);

  // Run all 20 rounds
  let roundsCompleted = 0;
  for (let round = 0; round < 20; round++) {
    const result = runRound(state, {});
    state.round += 1;
    roundsCompleted++;

    if ((round + 1) % 5 === 0) {
      console.log(`  ✓ Rounds ${round + 1}/20 complete`);
    }
  }

  // Capture pre-off-season standings
  const racingSummary = {
    classChampions: {} as Record<ClassId, { name: string; points: number; team: string }>,
    tireChampion: { brand: '', points: 0 },
    teamChampions: [] as { name: string; points: number; class: ClassId }[],
  };

  for (const cls of NAMC_CLASS_IDS) {
    const riders = riderStandingsFor(state, cls, 'fourStroke');
    if (riders.length > 0) {
      const champ = riders[0];
      racingSummary.classChampions[cls] = {
        name: champ.rider.name,
        points: champ.pts,
        team: state.universe.teams[champ.rider.teamId || '']?.name || 'Unknown',
      };
    }
  }

  const tirePoints = Object.entries(state.standings.tires || {});
  if (tirePoints.length > 0) {
    const [topTire, topPoints] = tirePoints.sort((a, b) => b[1] - a[1])[0];
    const tireNames: Record<string, string> = {
      mishlen: 'Mishlen',
      pirella: 'Pirella',
      ironclad: 'IronClad Tire Co',
      dustdevil: 'DustDevil Rubber',
    };
    racingSummary.tireChampion = {
      brand: tireNames[topTire] || topTire,
      points: topPoints,
    };
  }

  for (const cls of NAMC_CLASS_IDS) {
    const teams = teamStandingsFor(state, 'fourStroke', cls);
    if (teams.length > 0) {
      const teamChamp = teams[0];
      racingSummary.teamChampions.push({
        name: teamChamp.team.name,
        points: teamChamp.pts,
        class: cls,
      });
    }
  }

  console.log(`\n📊 RACING SEASON ${state.season} FINAL STANDINGS:\n`);
  for (const cls of NAMC_CLASS_IDS) {
    const champ = racingSummary.classChampions[cls];
    if (champ) {
      console.log(`  ${cls.padEnd(8)} | ${champ.name.padEnd(25)} | ${champ.points.toFixed(1).padStart(8)} pts`);
    }
  }

  // OFF-SEASON: Advance season (triggers draft, free agency, etc.)
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`OFF-SEASON PROCESSING`);
  console.log(`${'─'.repeat(70)}\n`);

  // Get player team standing BEFORE advanceSeason resets standings
  const playerTeam = state.universe.teams[playerTeamId];
  const playerTeamStanding = teamStandingsFor(state, 'fourStroke');
  const playerRank = playerTeamStanding.length > 0
    ? playerTeamStanding.findIndex(t => t.team.id === playerTeamId) + 1
    : 0;

  const offSeasonReport = advanceSeason(state);

  // Print off-season results
  console.log('🏆 CHAMPIONS & LEGACY PLATES:\n');
  offSeasonReport.champions.forEach(champ => {
    const plateEmoji = champ.rider.includes('(') ? '🏅' : '🥇';
    console.log(`  ${plateEmoji} ${champ.classId.toUpperCase().padEnd(8)} | ${champ.rider.padEnd(25)} (${champ.pts} pts)`);
  });

  if (offSeasonReport.teamTitle) {
    console.log(`\n🏁 TEAM CHAMPIONSHIP: ${offSeasonReport.teamTitle.teamName}`);
    console.log(`   Prize Money: $${(offSeasonReport.teamTitle.prize / 1000).toFixed(0)}k\n`);
  }

  console.log('📋 OFF-SEASON TRANSACTIONS:\n');

  if (offSeasonReport.toFreeAgency.length > 0) {
    console.log(`  Free Agents Released: ${offSeasonReport.toFreeAgency.length}`);
    offSeasonReport.toFreeAgency.slice(0, 3).forEach(fa => {
      console.log(`    • ${fa.name.padEnd(25)} (${fa.classId}) from ${fa.fromTeam}`);
    });
    if (offSeasonReport.toFreeAgency.length > 3) {
      console.log(`    ... and ${offSeasonReport.toFreeAgency.length - 3} more`);
    }
  }

  if (offSeasonReport.retired.length > 0) {
    console.log(`\n  Retirements: ${offSeasonReport.retired.length}`);
    offSeasonReport.retired.slice(0, 3).forEach(ret => {
      console.log(`    • ${ret.name.padEnd(25)} (age ${ret.age}, ${ret.titles} title${ret.titles !== 1 ? 's' : ''})`);
    });
    if (offSeasonReport.retired.length > 3) {
      console.log(`    ... and ${offSeasonReport.retired.length - 3} more`);
    }
  }

  if (offSeasonReport.draftPicks.length > 0) {
    console.log(`\n  Draft Picks: ${offSeasonReport.draftPicks.length} total`);
    const samplePicks = offSeasonReport.draftPicks.slice(0, 5);
    samplePicks.forEach(pick => {
      console.log(`    • ${pick.rider.padEnd(25)} → ${pick.teamName} (${pick.classId})`);
    });
    if (offSeasonReport.draftPicks.length > 5) {
      console.log(`    ... and ${offSeasonReport.draftPicks.length - 5} more picks`);
    }
  }

  if (offSeasonReport.faSignings.length > 0) {
    console.log(`\n  Free Agent Signings: ${offSeasonReport.faSignings.length}`);
    offSeasonReport.faSignings.slice(0, 3).forEach(sig => {
      console.log(`    • ${sig.rider.padEnd(25)} → ${sig.toTeam} (${sig.classId})`);
    });
    if (offSeasonReport.faSignings.length > 3) {
      console.log(`    ... and ${offSeasonReport.faSignings.length - 3} more signings`);
    }
  }

  console.log(`\n  Free Agents Remaining: ${offSeasonReport.poolLeft}`);

  // Store season report
  seasonReports.push({
    season: state.season,
    racingSummary,
    offSeason: offSeasonReport,
    playerTeamBudget: playerTeam.budget,
    playerTeamStanding: playerRank,
  });

  console.log(`\n💰 PLAYER TEAM STATUS (${playerTeam.name}):`);
  console.log(`   Budget: $${(playerTeam.budget / 1_000_000).toFixed(2)}M`);
  console.log(`   Team Standing: #${playerRank} of ${playerTeamStanding.length}`);
}

// COMPREHENSIVE 5-SEASON REPORT
console.log('\n\n');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║              5-SEASON CAREER SIMULATION COMPLETE               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Champions across 5 seasons
console.log('🏆 CHAMPIONSHIP PROGRESSION:\n');
console.log('Season | 350 Pro Champion | 250 Champion | Women\'s Champion | 250P Champion');
console.log('────────────────────────────────────────────────────────────────────────────');

seasonReports.forEach(season => {
  const c350 = season.racingSummary.classChampions['c350']?.name || '(no data)';
  const c250 = season.racingSummary.classChampions['c250']?.name || '(no data)';
  const women = season.racingSummary.classChampions['women']?.name || '(no data)';
  const c125 = season.racingSummary.classChampions['c125']?.name || '(no data)';

  console.log(
    `${season.season}    | ${c350.padEnd(15)} | ${c250.padEnd(11)} | ${women.padEnd(14)} | ${c125}`
  );
});

// Off-season activity summary
console.log('\n\n📋 OFF-SEASON ACTIVITY SUMMARY:\n');
console.log('Season | Retirements | Free Agents | Draft Picks | FA Signings');
console.log('────────────────────────────────────────────────────────────────');

seasonReports.forEach(season => {
  console.log(
    `${season.season}    | ${season.offSeason.retired.length.toString().padEnd(11)} | ${season.offSeason.toFreeAgency.length.toString().padEnd(10)} | ${season.offSeason.draftPicks.length.toString().padEnd(10)} | ${season.offSeason.faSignings.length}`
  );
});

// Player team progression
console.log('\n\n💰 PLAYER TEAM FINANCIAL PROGRESSION:\n');
console.log('Season | Budget (M) | Team Rank');
console.log('─────────────────────────────────');

seasonReports.forEach(season => {
  const budgetM = (season.playerTeamBudget / 1_000_000).toFixed(2);
  console.log(`${season.season}    | $${budgetM.padStart(8)} | #${season.playerTeamStanding}`);
});

// Dynasty detection
console.log('\n\n👑 DYNASTY ANALYSIS:\n');

const allChamps: Record<string, number> = {};
const allRetirements = new Set<string>();
const allDraftees = new Set<string>();

seasonReports.forEach(season => {
  season.offSeason.champions.forEach(c => {
    const nameOnly = c.rider.split('(')[0].trim();
    allChamps[nameOnly] = (allChamps[nameOnly] || 0) + 1;
  });
  season.offSeason.retired.forEach(r => allRetirements.add(r));
  season.offSeason.draftPicks.forEach(d => allDraftees.add(d));
});

const dynasties = Object.entries(allChamps)
  .filter(([_, count]) => count > 1)
  .sort((a, b) => b[1] - a[1]);

if (dynasties.length > 0) {
  console.log('Multi-Time Champions:');
  dynasties.forEach(([name, count]) => {
    console.log(`  ${name.padEnd(25)} | ${count}× champion`);
  });
} else {
  console.log('No repeat champions (highly competitive 5-season span)');
}

console.log(`\nTotal Career Retirements: ${allRetirements.size} riders`);
console.log(`Total Draft Selections: ${allDraftees.size} rookies (across 5 seasons)`);

console.log('\n═'.repeat(70));
console.log('✅ FULL CAREER SIMULATION COMPLETE\n');
