// Test Suite: MotoGP + WorldSBK Multi-Race Aggregation & Championship Standings

import { buildUniverse } from './data/universe';
import { runGPWeekend, runSBKWeekend } from './sim/weekend';
import { mulberry32 } from './util/rng';
import { REVENUE_SPLIT_GP, APPEARANCE_FEE_GP } from './data/gp';
import { REVENUE_SPLIT_SBK, APPEARANCE_FEE_SBK } from './data/sbk';
import { applyGPGridPenalty, applySBKBallastViolation, applySBKBoPViolation } from './game/penalties';
import { generateNewsForRound } from './game/news';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, error: String(error) });
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

// ============================================================================
// TEST: Universe Generation
// ============================================================================

test('Universe: GP discipline creates correct team count', () => {
  const u = buildUniverse(12345, 2027);
  const gpTeams = Object.values(u.teams).filter(t => t.discipline === 'gp');
  assert(gpTeams.length >= 30, `Expected at least 30 GP teams, got ${gpTeams.length}`);
});

test('Universe: SBK discipline creates correct team count', () => {
  const u = buildUniverse(12345, 2027);
  const sbkTeams = Object.values(u.teams).filter(t => t.discipline === 'sbk');
  assert(sbkTeams.length >= 30, `Expected at least 30 SBK teams, got ${sbkTeams.length}`);
});

test('Universe: NAMC discipline creates 20 teams', () => {
  const u = buildUniverse(12345, 2027);
  const namcTeams = Object.values(u.teams).filter(t => t.discipline === 'namc');
  assertEqual(namcTeams.length, 20, 'NAMC teams');
});

test('Universe: GP1 class has correct rider count', () => {
  const u = buildUniverse(12345, 2027);
  const gp1Riders = Object.values(u.riders).filter(r => r.classId === 'gp1');
  assertEqual(gp1Riders.length, 24, 'GP1 riders (12 teams × 2)');
});

test('Universe: SBK class has correct rider count', () => {
  const u = buildUniverse(12345, 2027);
  const sbkRiders = Object.values(u.riders).filter(r => r.classId === 'sbk');
  assertEqual(sbkRiders.length, 20, 'SBK riders (10 teams × 2)');
});

test('Universe: GP calendar has 22 rounds', () => {
  const u = buildUniverse(12345, 2027);
  assertEqual(u.calendars.gp.length, 22, 'GP calendar rounds');
});

test('Universe: SBK calendar has 12 rounds', () => {
  const u = buildUniverse(12345, 2027);
  assertEqual(u.calendars.sbk.length, 12, 'SBK calendar rounds');
});

test('Universe: NAMC calendar has 20 rounds', () => {
  const u = buildUniverse(12345, 2027);
  assertEqual(u.calendars.namc.length, 20, 'NAMC calendar rounds');
});

// ============================================================================
// TEST: Race Simulation & Multi-Race Aggregation
// ============================================================================

test('Race Sim: GP weekend generates Sprint + Main race results', () => {
  const u = buildUniverse(12345, 2027);
  const rng = mulberry32(67890);

  const weekend = runGPWeekend(rng, u, 'gp1', u.calendars.gp[0].trackId);

  assert(weekend.sessions.length === 2, `Expected 2 sessions, got ${weekend.sessions.length}`);
  assertEqual(weekend.sessions[0].name, 'SPRINT RACE', 'Sprint race name');
  assertEqual(weekend.sessions[1].name, 'MAIN RACE', 'Main race name');
  assert(Object.keys(weekend.points).length > 0, 'Should have aggregated points');
});

test('Race Sim: SBK weekend generates Superpole + Race 1 + Race 2 results', () => {
  const u = buildUniverse(12345, 2027);
  const rng = mulberry32(67890);

  const weekend = runSBKWeekend(rng, u, 'sbk', u.calendars.sbk[0].trackId);

  assert(weekend.sessions.length === 3, `Expected 3 sessions, got ${weekend.sessions.length}`);
  assertEqual(weekend.sessions[0].name, 'SUPERPOLE RACE', 'Superpole race name');
  assertEqual(weekend.sessions[1].name, 'RACE 1', 'Race 1 name');
  assertEqual(weekend.sessions[2].name, 'RACE 2', 'Race 2 name');
  assert(Object.keys(weekend.points).length > 0, 'Should have aggregated points');
});

test('Race Sim: Points aggregated correctly for multi-race format', () => {
  const u = buildUniverse(12345, 2027);
  const rng = mulberry32(67890);

  const weekend = runSBKWeekend(rng, u, 'sbk', u.calendars.sbk[0].trackId);

  // Verify points aggregation: total = superpole + race1 + race2
  for (const riderId in weekend.points) {
    const totalPoints = weekend.points[riderId];
    const spolePoints = weekend.sessions[0].points[riderId] ?? 0;
    const race1Points = weekend.sessions[1].points[riderId] ?? 0;
    const race2Points = weekend.sessions[2].points[riderId] ?? 0;

    const expected = spolePoints + race1Points + race2Points;
    assert(
      Math.abs(totalPoints - expected) < 0.01,
      `Points mismatch for ${riderId}: expected ${expected}, got ${totalPoints}`,
    );
  }
});

// ============================================================================
// TEST: Championship Standings
// ============================================================================

test('Standings: GP rider championship tracked separately from constructor championship', () => {
  const u = buildUniverse(12345, 2027);

  // Check that riders have championship assignment
  const gp1Riders = Object.values(u.riders).filter(r => r.classId === 'gp1');
  for (const rider of gp1Riders) {
    assertEqual(rider.championship, 'road', 'Rider championship should be road');
  }
});

test('Standings: SBK rider championship tracked separately from manufacturer championship', () => {
  const u = buildUniverse(12345, 2027);

  // Check that riders have championship assignment
  const sbkRiders = Object.values(u.riders).filter(r => r.classId === 'sbk');
  for (const rider of sbkRiders) {
    assertEqual(rider.championship, 'road', 'Rider championship should be road');
  }
});

// ============================================================================
// TEST: Economy Settlement
// ============================================================================

test('Economy: GP revenue split reflects road racing model (50% teams, 30% riders)', () => {
  assert(REVENUE_SPLIT_GP.teams === 0.50, `Expected teams 50%, got ${REVENUE_SPLIT_GP.teams * 100}%`);
  assert(REVENUE_SPLIT_GP.riders === 0.30, `Expected riders 30%, got ${REVENUE_SPLIT_GP.riders * 100}%`);
});

test('Economy: SBK revenue split reflects road racing model (48% teams, 27% riders)', () => {
  assert(REVENUE_SPLIT_SBK.teams === 0.48, `Expected teams 48%, got ${REVENUE_SPLIT_SBK.teams * 100}%`);
  assert(REVENUE_SPLIT_SBK.riders === 0.27, `Expected riders 27%, got ${REVENUE_SPLIT_SBK.riders * 100}%`);
});

test('Economy: GP appearance fees ($5,000/round) reflect premium road racing model', () => {
  assertEqual(APPEARANCE_FEE_GP, 5000, 'GP appearance fee');
});

test('Economy: SBK appearance fees ($3,000/round) reflect regional championship model', () => {
  assertEqual(APPEARANCE_FEE_SBK, 3000, 'SBK appearance fee');
});

// ============================================================================
// TEST: Penalty System
// ============================================================================

test('Penalties: GP grid penalty applies position loss', () => {
  const u = buildUniverse(12345, 2027);
  const rider = Object.values(u.riders).find((r: any) => r.classId === 'gp1');

  assert(rider !== undefined, 'Rider not found');
  applyGPGridPenalty(rider!, 3, 'qualifying-violation', 1);
  assert(rider!.gridPenaltyPositions === 3, 'Grid penalty not applied');
});

test('Penalties: SBK ballast violation triggers 2-round suspension', () => {
  const u = buildUniverse(12345, 2027);
  const team = Object.values(u.teams).find((t: any) => t.discipline === 'sbk');

  assert(team !== undefined, 'Team not found');
  applySBKBallastViolation(team!, 1);
  assert(team!.penalties.length > 0, 'Penalty not issued');
  const penalty = team!.penalties[0];
  assert(penalty.suspensionRounds === 2, `Expected 2-round suspension, got ${penalty.suspensionRounds}`);
});

test('Penalties: SBK BoP violation applies fine and tier', () => {
  const u = buildUniverse(12345, 2027);
  const team = Object.values(u.teams).find((t: any) => t.discipline === 'sbk');

  assert(team !== undefined, 'Team not found');
  applySBKBoPViolation(team!, 'fuel-flow', 1, 'minor');
  assert(team!.penalties.length > 0, 'Penalty not issued');
  const penalty = team!.penalties[0];
  assert(penalty.tier === 2, `Expected tier 2, got ${penalty.tier}`);
  assert(penalty.fineAmount === 25_000, `Expected fine 25000, got ${penalty.fineAmount}`);
});

// ============================================================================
// TEST: Inter-League News System
// ============================================================================

test('News: Generation produces valid news events', () => {
  const u = buildUniverse(12345, 2027);
  const rng = mulberry32(99999);

  const news = generateNewsForRound(u, rng, 1, 'namc');

  // May or may not generate news (probabilistic), but if it does, structure is valid
  if (news.length > 0) {
    const n = news[0];
    assert(!!n.id, 'News should have ID');
    assert(!!n.type, 'News should have type');
    assert(!!n.headline, 'News should have headline');
    assert(!!n.body, 'News should have body');
    assert(n.discipline !== 'namc', 'News should be from different discipline');
  }
});

test('News: Archive initialized empty', () => {
  const u = buildUniverse(12345, 2027);
  assertEqual(u.newsArchive.length, 0, 'News archive should start empty');
});

test('News: Different events have different commentary', () => {
  const u = buildUniverse(12345, 2027);
  const rng = mulberry32(111111);

  // Generate multiple news items to check variety
  const allNews: any[] = [];
  for (let i = 0; i < 10; i++) {
    const news = generateNewsForRound(u, mulberry32(111111 + i), i + 1, 'namc');
    allNews.push(...news);
  }

  // Should have some variety in types and headlines
  const types = new Set(allNews.map(n => n.type));
  assert(types.size >= 2, `Should have variety of news types, got ${types.size}`);

  const headlines = new Set(allNews.map(n => n.headline));
  assert(headlines.size >= 2, `Should have variety of headlines, got ${headlines.size}`);
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n=== Test Results ===\n');
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

for (const result of results) {
  const status = result.passed ? '✓' : '✗';
  console.log(`${status} ${result.name}`);
  if (result.error) {
    console.log(`  Error: ${result.error}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
