// 5-Season Championship Simulation - All NAMC Classes + Tire + Team Championships
// v15.3 Rulebook Compliance

import { newCareer, runRound, seasonOver, riderStandingsFor, teamStandingsFor } from './src/game/state';
import { NAMC_CLASS_IDS } from './src/data/namc';
import type { ClassId } from './src/data/types';

interface SeasonSummary {
  season: number;
  classChampions: Record<ClassId, { name: string; points: number; team: string }>;
  tireChampion: { brand: string; points: number };
  teamChampions: { name: string; points: number; class: ClassId }[];
  topStories: string[];
}

const seasonReports: SeasonSummary[] = [];

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     5-SEASON NAMC v15.3 CHAMPIONSHIP SIMULATION REPORT         ║');
console.log('║  All Classes + Tire Championship + Team Championship           ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Create career
const career = newCareer({
  seed: 5000,
  discipline: 'namc',
  championship: 'fourStroke',
  mode: 'create',
  teamName: 'Simulation Observer',
});

let state = career;

// Run 5 seasons
for (let seasonNum = 0; seasonNum < 5; seasonNum++) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`SEASON ${state.season} - CHAMPIONSHIP RACE`);
  console.log(`${'═'.repeat(70)}\n`);

  // Run all 20 rounds
  for (let round = 0; round < 20; round++) {
    const result = runRound(state, {});
    state.round += 1;

    // Print round summary periodically
    if ((round + 1) % 5 === 0) {
      console.log(`  Round ${round + 1}/20 complete`);
    }
  }

  // Capture season data BEFORE advancing to next season
  const seasonData: SeasonSummary = {
    season: state.season,
    classChampions: {} as Record<ClassId, { name: string; points: number; team: string }>,
    tireChampion: { brand: '', points: 0 },
    teamChampions: [],
    topStories: [],
  };

  // Get class champions
  for (const cls of NAMC_CLASS_IDS) {
    const riders = riderStandingsFor(state, cls, 'fourStroke');
    if (riders.length > 0) {
      const champ = riders[0];
      const runner = riders[1];
      seasonData.classChampions[cls] = {
        name: champ.rider.name,
        points: champ.pts,
        team: state.universe.teams[champ.rider.teamId || '']?.name || 'Unknown',
      };

      // Determine if it was close
      const margin = champ.pts - (runner?.pts ?? 0);
      if (margin < 50) {
        seasonData.topStories.push(
          `🏆 ${cls.toUpperCase()}: THRILLER! ${champ.rider.name} edges ${runner?.rider.name || 'rival'} by just ${margin.toFixed(1)} pts`
        );
      } else if (margin > 300) {
        seasonData.topStories.push(
          `🏆 ${cls.toUpperCase()}: DOMINANT! ${champ.rider.name} crushes field with ${champ.pts.toFixed(1)} pts (+${margin.toFixed(1)})`
        );
      } else {
        seasonData.topStories.push(
          `🏆 ${cls.toUpperCase()}: ${champ.rider.name} (${champ.pts.toFixed(1)} pts, +${margin.toFixed(1)})`
        );
      }
    }
  }

  // Get tire champion
  const tirePoints = Object.entries(state.standings.tires || {});
  if (tirePoints.length > 0) {
    const [topTire, topPoints] = tirePoints.sort((a, b) => b[1] - a[1])[0];
    const tireNames: Record<string, string> = {
      mishlen: 'Mishlen',
      pirella: 'Pirella',
      ironclad: 'IronClad Tire Co',
      dustdevil: 'DustDevil Rubber',
    };
    seasonData.tireChampion = {
      brand: tireNames[topTire] || topTire,
      points: topPoints,
    };
    seasonData.topStories.push(`🏁 TIRE: ${seasonData.tireChampion.brand} leads with ${topPoints.toFixed(1)} pts`);
  }

  // Get team champions (one per class)
  for (const cls of NAMC_CLASS_IDS) {
    const teams = teamStandingsFor(state, 'fourStroke', cls);
    if (teams.length > 0) {
      const teamChamp = teams[0];
      seasonData.teamChampions.push({
        name: teamChamp.team.name,
        points: teamChamp.pts,
        class: cls,
      });
    }
  }

  // Advance to next season
  if (seasonOver(state)) {
    state.season += 1;
    state.round = 0;
  }

  seasonReports.push(seasonData);

  // Print season summary
  console.log(`\n📊 SEASON ${seasonData.season} FINAL STANDINGS:\n`);

  for (const cls of NAMC_CLASS_IDS) {
    const champ = seasonData.classChampions[cls];
    if (champ) {
      console.log(`  ${cls.padEnd(8)} | ${champ.name.padEnd(25)} | ${champ.points.toFixed(1).padStart(8)} pts | ${champ.team}`);
    }
  }

  console.log(`\n🏁 TIRE CHAMPION: ${seasonData.tireChampion.brand} (${seasonData.tireChampion.points.toFixed(1)} pts)`);

  if (seasonData.topStories.length > 0) {
    console.log('\n📰 SEASON STORIES:');
    seasonData.topStories.forEach(story => console.log(`   ${story}`));
  }
}

// FINAL COMPREHENSIVE REPORT
console.log('\n\n');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                  5-SEASON CHAMPIONSHIP SUMMARY                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Count dynasty riders (multiple titles in same class)
const dynasties: Record<string, number> = {};
for (const season of seasonReports) {
  for (const champ of Object.values(season.classChampions)) {
    dynasties[champ.name] = (dynasties[champ.name] || 0) + 1;
  }
}

console.log('🏆 CHAMPIONSHIP DYNASTIES (Multiple Titles Same Class):\n');
const sortedDynasties = Object.entries(dynasties)
  .filter(([_, count]) => count > 1)
  .sort((a, b) => b[1] - a[1]);

if (sortedDynasties.length === 0) {
  console.log('   No repeat champions across 5 seasons (highly competitive)\n');
} else {
  sortedDynasties.forEach(([name, count]) => {
    console.log(`   ${name.padEnd(25)} | ${count} titles`);
  });
  console.log();
}

// Tire championship summary
console.log('🛞 TIRE CHAMPIONSHIP SUMMARY:\n');
const tireWins: Record<string, number> = {};
for (const season of seasonReports) {
  tireWins[season.tireChampion.brand] = (tireWins[season.tireChampion.brand] || 0) + 1;
}

Object.entries(tireWins)
  .sort((a, b) => b[1] - a[1])
  .forEach(([brand, wins]) => {
    console.log(`   ${brand.padEnd(25)} | ${wins} season title(s)`);
  });

// Class-by-class breakdown
console.log(`\n📋 CLASS-BY-CLASS CHAMPIONSHIP BREAKDOWN:\n`);
for (const cls of NAMC_CLASS_IDS) {
  const classChamps: Record<string, number> = {};
  for (const season of seasonReports) {
    const champ = season.classChampions[cls];
    if (champ) {
      classChamps[champ.name] = (classChamps[champ.name] || 0) + 1;
    }
  }

  console.log(`   ${cls.toUpperCase().padEnd(10)}`);
  Object.entries(classChamps)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`     • ${name.padEnd(25)} ${count}× champion`);
    });
  console.log();
}

// Points spread analysis
console.log('📊 CHAMPIONSHIP MARGIN ANALYSIS (1st vs 2nd place):\n');
const margins: number[] = [];
for (const season of seasonReports) {
  for (const cls of NAMC_CLASS_IDS) {
    const champ = season.classChampions[cls];
    if (champ) {
      // Get margin from captured data
      const riders = riderStandingsFor(state, cls, 'fourStroke');
      if (riders.length >= 2) {
        const margin = riders[0].pts - riders[1].pts;
        margins.push(margin);
      }
    }
  }
}

if (margins.length > 0) {
  const avgMargin = margins.reduce((a, b) => a + b) / margins.length;
  const minMargin = Math.min(...margins);
  const maxMargin = Math.max(...margins);

  console.log(`   Average Margin:     ${avgMargin.toFixed(1)} points`);
  console.log(`   Closest Title:      ${minMargin.toFixed(1)} points`);
  console.log(`   Largest Margin:     ${maxMargin.toFixed(1)} points`);
  console.log(`   Competitive Range:  ${minMargin.toFixed(1)} - ${maxMargin.toFixed(1)} points\n`);

  // Categorize competitiveness
  const photoFinishes = margins.filter(m => m < 50).length;
  const competitive = margins.filter(m => m >= 50 && m < 300).length;
  const dominant = margins.filter(m => m >= 300).length;

  console.log(`   Photo Finishes (<50 pts):  ${photoFinishes} (${((photoFinishes / margins.length) * 100).toFixed(1)}%)`);
  console.log(`   Competitive (50-300 pts):  ${competitive} (${((competitive / margins.length) * 100).toFixed(1)}%)`);
  console.log(`   Dominant (300+ pts):       ${dominant} (${((dominant / margins.length) * 100).toFixed(1)}%)\n`);
}

// Overall championship health
console.log('⚖️ CHAMPIONSHIP HEALTH ASSESSMENT:\n');
const uniqueChamps = new Set(
  seasonReports.flatMap(s => Object.values(s.classChampions).map(c => c.name))
).size;
const expectedChamps = NAMC_CLASS_IDS.length * 5; // 4 classes × 5 seasons

console.log(`   Total Unique Champions:    ${uniqueChamps} of ${expectedChamps} possible`);
console.log(`   Diversity Index:           ${((uniqueChamps / expectedChamps) * 100).toFixed(1)}%`);

if (uniqueChamps / expectedChamps > 0.7) {
  console.log(`   Status:                    ✅ HEALTHY - Diverse champion pool\n`);
} else if (uniqueChamps / expectedChamps > 0.5) {
  console.log(`   Status:                    ⚠️  MODERATE - Some dominance emerging\n`);
} else {
  console.log(`   Status:                    ⚠️  CONCERN - Limited champion diversity\n`);
}

console.log('═'.repeat(70));
console.log('✅ SIMULATION COMPLETE\n');
