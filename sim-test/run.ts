// Headless sim harness: runs full seasons across all disciplines and modes,
// validating invariants against the NAMC rulebook and general sanity.
// Usage: npx tsx sim-test/run.ts [iterations]

import { newCareer, runRound, seasonOver, riderStandingsFor, teamStandingsFor, type CareerState } from '../src/game/state';
import { PURSE_350, PURSE_250, PURSE_125, NAMC_CLASS_IDS } from '../src/data/namc';
import { gridOf, teamsOf, ridersOfTeam } from '../src/data/universe';
import { classById } from '../src/data/classes';
import type { ChampionshipId, ClassId } from '../src/data/types';

let failures = 0;
let checks = 0;
function assert(cond: boolean, msg: string): void {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ❌ ${msg}`);
  }
}

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);

// ---- static rulebook validation
console.log('— Rulebook constants —');
assert(PURSE_350.length === 40 && PURSE_250.length === 40 && PURSE_125.length === 40, 'purse tables have 40 positions');
// NOTE: totals below are the TRUE sums of the rulebook's position tables.
// The rulebook's own stated totals ($585k/$486.6k/$341.2k) do NOT match its
// tables ($619k/$499.5k/$385.25k) — flagged as a case-study finding.
assert(sum(PURSE_350) === 619_000, `350 purse table sums to $619,000 (got $${sum(PURSE_350).toLocaleString()})`);
assert(sum(PURSE_250) === 499_500, `250 purse table sums to $499,500 (got $${sum(PURSE_250).toLocaleString()})`);
assert(sum(PURSE_125) === 385_250, `125 purse table sums to $385,250 (got $${sum(PURSE_125).toLocaleString()})`);
assert([...PURSE_350].every((v, i, a) => i === 0 || v <= a[i - 1]), '350 purse monotonically decreasing');
assert([...PURSE_250].every((v, i, a) => i === 0 || v <= a[i - 1]), '250 purse monotonically decreasing');
assert([...PURSE_125].every((v, i, a) => i === 0 || v <= a[i - 1]), '125 purse monotonically decreasing');

function validateUniverse(state: CareerState, label: string): void {
  const u = state.universe;
  if (state.discipline === 'namc') {
    for (const champ of ['fourStroke', 'twoStroke'] as ChampionshipId[]) {
      const teams = teamsOf(u, 'namc', champ);
      assert(teams.length === 20, `${label}: ${champ} has 20 charters (got ${teams.length})`);
      for (const cls of NAMC_CLASS_IDS) {
        const grid = Object.values(u.riders).filter(r => r.classId === cls && r.championship === champ && !r.bench);
        assert(grid.length === 40, `${label}: ${champ}/${cls} grid = 40 (got ${grid.length})`);
        if (cls === 'women') assert(grid.every(r => r.isFemale), `${label}: women's class all female`);
      }
      for (const t of teams) {
        const roster = ridersOfTeam(u, t.id);
        assert(roster.filter(r => !r.bench).length === 8, `${label}: team ${t.name} has 8 starters`);
        assert(roster.filter(r => r.bench).length === 3, `${label}: team ${t.name} has 3 bench`);
        const females = roster.filter(r => r.bench && r.isFemale).length;
        assert(females === 1, `${label}: team ${t.name} bench has 1 female (got ${females})`);
      }
      const duals = teams.filter(t => t.dualCharter);
      assert(duals.length === 6, `${label}: ${champ} has 6 dual-charter teams`);
    }
  } else {
    const classes: ClassId[] = state.discipline === 'gp' ? ['gp1', 'gp2', 'gp3'] : ['sbk', 'ss600', 'ss300'];
    for (const cls of classes) {
      const grid = Object.values(u.riders).filter(r => r.classId === cls && !r.bench);
      const expect = classById(cls).gridSize;
      assert(Math.abs(grid.length - expect) <= 2, `${label}: ${cls} grid ~${expect} (got ${grid.length})`);
    }
  }
  // all riders on teams that exist
  for (const r of Object.values(u.riders)) {
    assert(!r.teamId || !!u.teams[r.teamId], `${label}: rider ${r.name} team exists`);
  }
}

function runSeason(state: CareerState, label: string): void {
  const cal = state.universe.calendars[state.discipline];
  let rounds = 0;
  while (!seasonOver(state)) {
    const before = state.round;
    const { weekends } = runRound(state);
    rounds++;
    assert(state.round === before + 1, `${label}: round advanced`);
    assert(weekends.length > 0, `${label}: round produced weekends`);
    for (const w of weekends) {
      const uniq = new Set(w.finishOrder);
      assert(uniq.size === w.finishOrder.length, `${label} R${state.round}: finish order unique (${w.classId})`);
      for (const id of w.finishOrder) {
        assert(!!state.universe.riders[id], `${label}: finisher ${id} exists`);
      }
      const ptsVals = Object.values(w.points);
      assert(ptsVals.every(p => Number.isFinite(p) && p >= 0), `${label}: points finite`);
      if (state.discipline === 'namc') {
        assert(w.finishOrder.length >= 30, `${label} R${state.round} ${w.championship}/${w.classId}: field >= 30 (got ${w.finishOrder.length}, injuries reduce it)`);
        assert(Math.max(...ptsVals) === 40, `${label}: NAMC winner scores 40`);
      }
    }
    if (rounds > cal.length + 1) { assert(false, `${label}: season loop runaway`); break; }
  }
  assert(rounds === cal.length, `${label}: full season = ${cal.length} rounds (ran ${rounds})`);

  // budgets sane
  for (const t of teamsOf(state.universe, state.discipline)) {
    assert(Number.isFinite(t.budget), `${label}: team ${t.name} budget finite`);
  }

  // standings populated, champion exists
  const key = state.discipline === 'namc' ? state.championship : 'road';
  const table = riderStandingsFor(state, state.focusClass, key as ChampionshipId);
  assert(table.length > 0, `${label}: standings populated`);
  if (table.length > 0) {
    assert(table[0].pts > 0, `${label}: champion has points (${table[0].rider?.name} ${table[0].pts})`);
  }

  // NAMC league health: report solvency
  if (state.discipline === 'namc') {
    const teams = teamsOf(state.universe, 'namc');
    const underwater = teams.filter(t => t.budget < 0);
    console.log(`  💰 ${label}: ${underwater.length}/${teams.length} NAMC teams ended season in the red`);
    const champTeams = teamStandingsFor(state, state.championship);
    if (champTeams[0]) console.log(`  🏆 ${label}: Team champion — ${champTeams[0].team.name} (${champTeams[0].pts} pts)`);
  }
}

const iterations = Number(process.argv[2] ?? 10);
console.log(`\nRunning ${iterations} full-season sims per configuration...\n`);

const configs: { discipline: 'gp' | 'sbk' | 'namc'; championship?: ChampionshipId; mode: 'create' | 'takeover' }[] = [
  { discipline: 'namc', championship: 'fourStroke', mode: 'create' },
  { discipline: 'namc', championship: 'twoStroke', mode: 'create' },
  { discipline: 'gp', mode: 'create' },
  { discipline: 'sbk', mode: 'create' },
];

const t0 = Date.now();
for (const cfg of configs) {
  for (let i = 0; i < iterations; i++) {
    const seed = 1000 + i * 77;
    const label = `${cfg.discipline}${cfg.championship ? ':' + cfg.championship : ''}#${i}`;
    try {
      const state = newCareer({
        seed, discipline: cfg.discipline, championship: cfg.championship,
        mode: cfg.mode, teamName: 'Sim Test Racing',
      });
      validateUniverse(state, label);
      runSeason(state, label);
    } catch (err) {
      failures++;
      console.error(`  💥 ${label} threw:`, err);
    }
  }
  console.log(`✓ ${cfg.discipline}${cfg.championship ? ':' + cfg.championship : ''} — ${iterations} seasons done`);
}

console.log(`\n${checks} checks, ${failures} failures, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
process.exit(failures > 0 ? 1 : 0);
