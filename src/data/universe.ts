// Universe builder: generates the full three-discipline world.

import type {
  ChampionshipId, ClassId, DisciplineId, Rider, RiderStats, Team, Track, Universe, CalendarRound,
} from './types';
import { CLASSES, classById } from './classes';
import {
  MANUFACTURERS_BASE, initializeManufacturers, SPONSORS, TIRE_BRANDS, GP_TEAMS, GP_STARS, SBK_TEAMS, SBK_STARS,
  GP_TRACKS, SBK_TRACKS,
} from './parody';
import { FIRST_M, FIRST_F, LAST, NAT_WEIGHTS, TEAM_ADJ, TEAM_NOUN, NAMC_TEAM_CITIES } from './names';
import { SALARY_FLOORS, CHARTERS_PER_CHAMPIONSHIP, RIDERS_PER_CLASS_PER_TEAM, NAMC_CLASS_IDS, NAMC_2027_CALENDAR } from './namc';
import { mulberry32, hashString, pick, irange, gauss, clamp, shuffle, type RNG } from '../util/rng';
import { makeGatePreferenceProfile } from './gatePreference';
import { seededLogo } from '../logo/logos';

let riderSeq = 0;
let teamSeq = 0;

function weightedNat(rng: RNG, discipline: 'gp' | 'sbk' | 'namc'): string {
  const weights = NAT_WEIGHTS[discipline];
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [nat, w] of weights) {
    roll -= w;
    if (roll <= 0) return nat;
  }
  return weights[0][0];
}

function riderName(rng: RNG, nat: string, female: boolean): string {
  const firsts = (female ? FIRST_F : FIRST_M)[nat] ?? (female ? FIRST_F.US : FIRST_M.US);
  const lasts = LAST[nat] ?? LAST.US;
  return `${pick(rng, firsts)} ${pick(rng, lasts)}`;
}

function makeStats(rng: RNG, base: number): RiderStats {
  const v = (spread: number) => clamp(Math.round(gauss(rng, base, spread)), 30, 99);
  return {
    pace: clamp(Math.round(gauss(rng, base, 6)), 30, 99),
    consistency: v(10),
    starts: v(12),
    aggression: v(14),
    fitness: v(10),
    wet: v(14),
  };
}

export function overallOf(s: RiderStats): number {
  return Math.round(s.pace * 0.42 + s.consistency * 0.22 + s.starts * 0.10 + s.fitness * 0.14 + s.aggression * 0.06 + s.wet * 0.06);
}

function makeRider(
  rng: RNG, opts: {
    discipline: 'gp' | 'sbk' | 'namc'; base: number; classId: ClassId | null;
    championship: ChampionshipId; teamId: string | null; female?: boolean;
    bench?: boolean; name?: string; nat?: string; number?: number; usedNumbers?: Set<number>;
  },
): Rider {
  const nat = opts.nat ?? weightedNat(rng, opts.discipline);
  const female = opts.female ?? false;
  const stats = makeStats(rng, opts.base);
  let num = opts.number ?? irange(rng, 2, 99);
  if (opts.usedNumbers) {
    while (opts.usedNumbers.has(num)) num = irange(rng, 2, 999);
    opts.usedNumbers.add(num);
  }
  const classDef = opts.classId ? classById(opts.classId) : null;
  const floor = opts.classId && opts.discipline === 'namc'
    ? SALARY_FLOORS[opts.classId] ?? 100_000
    : classDef?.salaryFloor ?? 50_000;
  const overall = overallOf(stats);
  const salary = opts.bench ? 50_000 : Math.round(floor * (1 + Math.max(0, overall - 60) / 25));

  // Derive skills from stats
  const skills = {
    pace: stats.pace || 50,
    braking: clamp(stats.pace - 5, 30, 99),
    cornerSpeed: clamp(stats.pace - 3, 30, 99),
    racecraft: clamp((stats.pace + overall) / 2, 30, 99),
    consistency: stats.consistency || 50,
    starts: stats.starts || 50,
    fitness: stats.fitness || 50,
    wet: stats.wet || 50,
    feedback: 50,
  };

  const contract = {
    salary,
    length: irange(rng, 1, 4),
    signingBonus: 0,
    winBonus: 0,
    podiumBonus: 0,
    titleBonus: 0,
    purseShareTeamPct: 0,  // negotiated at signing; hard cap 25
    isNo1Rider: false,
    releaseClause: 0,
    hasTeammateVeto: false,
  };

  const gatePreference = makeGatePreferenceProfile(rng, stats, []);

  const rider: Rider = {
    id: `r${riderSeq++}`,
    name: opts.name ?? riderName(rng, nat, female),
    age: irange(rng, 18, 34),
    nationality: nat,
    number: num,
    stats,
    skills,
    overall,
    potential: clamp(overall + irange(rng, 0, 18), overall, 99),
    stamina: 100,
    traits: [],
    salary,
    contract,
    gatePreference,
    morale: irange(rng, 55, 85),
    injuredForRounds: 0,
    careerWins: 0,
    careerPodiums: 0,
    championships: 0,
    legacyPlate: 'none',
    isFemale: female,
    teamId: opts.teamId,
    classId: opts.classId,
    championship: opts.championship,
    seasonsInCurrentClass: 1,  // starts at 1 for their first season
    bench: opts.bench ?? false,
  };

  return rider;
}

/**
 * Draft-class rookie (rulebook §4.10/4.11): age 18-19 out of the NAMC
 * Development Series, OVR-vetted. Used by the off-season draft to refill
 * rosters after retirements.
 */
export function makeDraftRookie(rng: RNG, opts: {
  classId: ClassId; championship: ChampionshipId; teamId: string | null;
  female?: boolean; quality?: number; bench?: boolean;
}): Rider {
  const rookie = makeRider(rng, {
    discipline: 'namc', base: opts.quality ?? 52, classId: opts.classId,
    championship: opts.championship, teamId: opts.teamId, female: opts.female, bench: opts.bench,
  });
  rookie.age = irange(rng, 18, 19);
  rookie.potential = clamp(rookie.overall + irange(rng, 8, 25), rookie.overall, 99); // rookies carry headroom
  return rookie;
}

function makeTeam(rng: RNG, opts: {
  name: string; shortName?: string; discipline: DisciplineId; championship: ChampionshipId;
  orgId?: string; dualCharter?: boolean; primary?: string; secondary?: string;
  manufacturerId?: string; prestige?: number; classIds: ClassId[]; tireBrandId?: string;
}): Team {
  const id = `t${teamSeq++}`;
  const primary = opts.primary ?? pick(rng, ['#e2261f', '#f07000', '#1a49c4', '#3fb950', '#e8b23a', '#8a2be2', '#00b3ad', '#c8102e', '#2f9de0', '#59c118']);
  const secondary = opts.secondary ?? pick(rng, ['#101214', '#ffffff', '#12294a', '#e8e8e8']);
  const initials = (opts.shortName ?? opts.name.split(/\s+/).map(w => w[0]).join('')).slice(0, 3);
  return {
    id,
    name: opts.name,
    shortName: (opts.shortName ?? initials).toUpperCase().slice(0, 4),
    discipline: opts.discipline,
    championship: opts.championship,
    orgId: opts.orgId ?? id,
    dualCharter: opts.dualCharter ?? false,
    colors: { primary, secondary },
    logo: seededLogo(opts.name, initials, primary, secondary),
    manufacturerId: opts.manufacturerId ?? pick(rng, MANUFACTURERS).id,
    tireBrandId: opts.tireBrandId ?? pick(rng, TIRE_BRANDS).id,
    bike: {
      engine: clamp(Math.round(gauss(rng, 55 + (opts.prestige ?? 50) * 0.35, 8)), 30, 98),
      handling: clamp(Math.round(gauss(rng, 55 + (opts.prestige ?? 50) * 0.35, 8)), 30, 98),
      reliability: clamp(Math.round(gauss(rng, 70, 10)), 40, 98),
    },
    bikeSetup: {
      engineMode: 'standard',
      components: {},
      mileageThisRound: 0,
    },
    budget: Math.round(500_000 + (opts.prestige ?? 50) * 40_000),
    prestige: opts.prestige ?? 50,
    isPlayer: false,
    strikes: 0,
    classIds: opts.classIds,
    facilityLevel: Math.max(1, Math.min(5, Math.floor((opts.prestige ?? 50) / 20))),
    coachQuality: 0.8 + ((opts.prestige ?? 50) / 100) * 0.7,
    penalties: [],
    charterRevoked: false,
  };
}

// ---------------------------------------------------------------- builders

function buildRoadDiscipline(
  rng: RNG, u: Universe, discipline: 'gp' | 'sbk',
  factoryTeams: [string, string, string, string, string, number][],
  stars: [string, string, number, number][],
): void {
  const ladder = discipline === 'gp' ? (['gp1', 'gp2', 'gp3'] as ClassId[]) : (['sbk', 'ss600', 'ss300'] as ClassId[]);

  // Premier class: factory teams, 2 riders each; stars seeded into strongest teams.
  const usedNums = new Set<number>();
  const premier = ladder[0];
  let starIdx = 0;
  for (const [name, short, maker, primary, secondary, prestige] of factoryTeams) {
    const team = makeTeam(rng, {
      name, shortName: short, discipline, championship: 'road',
      primary, secondary, manufacturerId: maker, prestige, classIds: [premier],
    });
    u.teams[team.id] = team;
    for (let i = 0; i < 2; i++) {
      let rider: Rider;
      if (starIdx < stars.length && prestige >= 74) {
        const [sname, nat, num, pace] = stars[starIdx++];
        rider = makeRider(rng, { discipline, base: pace - 6, classId: premier, championship: 'road', teamId: team.id, name: sname, nat, number: num, usedNumbers: usedNums });
        rider.stats.pace = pace;
        rider.overall = overallOf(rider.stats);
      } else {
        rider = makeRider(rng, { discipline, base: 62 + prestige * 0.18, classId: premier, championship: 'road', teamId: team.id, usedNumbers: usedNums });
      }
      u.riders[rider.id] = rider;
    }
  }

  // Feeder classes: generated teams of 2.
  for (const cls of ladder.slice(1)) {
    const def = classById(cls);
    const teamCount = Math.floor(def.gridSize / 2);
    const nums = new Set<number>();
    for (let t = 0; t < teamCount; t++) {
      const name = `${pick(rng, TEAM_ADJ)} ${pick(rng, TEAM_NOUN)}`;
      const prestige = irange(rng, 30, 70);
      const team = makeTeam(rng, { name, discipline, championship: 'road', prestige, classIds: [cls] });
      u.teams[team.id] = team;
      for (let i = 0; i < 2; i++) {
        const base = def.tier === 2 ? 58 : 50;
        const rider = makeRider(rng, { discipline, base: base + prestige * 0.15, classId: cls, championship: 'road', teamId: team.id, usedNumbers: nums });
        rider.age = def.tier === 3 ? irange(rng, 18, 23) : irange(rng, 18, 28);
        u.riders[rider.id] = rider;
      }
    }
  }
}

function buildNAMC(rng: RNG, u: Universe): void {
  // NAMC v15.1: S4-only championship, 20 charters. (2S parallel championship
  // is future DLC — dual-charter plumbing stays in the data model for it.)
  const champs: ChampionshipId[] = ['fourStroke'];
  const orgNames: string[] = [];
  while (orgNames.length < CHARTERS_PER_CHAMPIONSHIP) {
    const style = irange(rng, 0, 2);
    const name = style === 0
      ? `${pick(rng, TEAM_ADJ)} ${pick(rng, TEAM_NOUN)}`
      : style === 1
        ? `${pick(rng, NAMC_TEAM_CITIES)} ${pick(rng, ['Moto', 'MX', 'Racing', 'Dirt Co'])}`
        : `${pick(rng, SPONSORS).name} ${pick(rng, ['Racing', 'MX', 'Factory Team'])}`;
    if (!orgNames.includes(name)) orgNames.push(name);
  }

  let orgCursor = 0;
  // Rulebook 6.2: no duplicate numbers within the same class + championship.
  const classNumbers = new Map<string, Set<number>>();
  const numbersFor = (championship: ChampionshipId, cls: ClassId): Set<number> => {
    const key = `${championship}:${cls}`;
    let s = classNumbers.get(key);
    if (!s) { s = new Set(); classNumbers.set(key, s); }
    return s;
  };
  const makeCharterTeam = (championship: ChampionshipId, dual: boolean, orgId: string | undefined, name: string, prestige: number) => {
    const strokes = championship === 'fourStroke' ? '4S' : '2S';
    const makers = MANUFACTURERS.filter(m => m.strokes === 'both' || m.strokes === strokes);
    const team = makeTeam(rng, {
      name, discipline: 'namc', championship, orgId, dualCharter: dual,
      manufacturerId: pick(rng, makers).id, prestige,
      classIds: [...NAMC_CLASS_IDS],
      tireBrandId: pick(rng, TIRE_BRANDS).id,
    });
    u.teams[team.id] = team;

    // 8 starters: 2 per class (women's class riders are female).
    // Every rider goes through makeRider so classId, race number, gate
    // preference profile and salary floors are always consistent.
    for (const cls of NAMC_CLASS_IDS) {
      for (let i = 0; i < RIDERS_PER_CLASS_PER_TEAM; i++) {
        const female = cls === 'women';
        const base = cls === 'c350' ? 66 + prestige * 0.2 : cls === 'c250' ? 60 + prestige * 0.18 : 52 + prestige * 0.16;
        const rider = makeRider(rng, { discipline: 'namc', base, classId: cls, championship, teamId: team.id, female, usedNumbers: numbersFor(championship, cls) });
        if (cls === 'c125') rider.age = irange(rng, 18, 22);
        u.riders[rider.id] = rider;
      }
    }

    // bench: 2 male + 1 female (rulebook 4.8.1)
    for (let b = 0; b < 3; b++) {
      const female = b === 2;
      const rider = makeRider(rng, { discipline: 'namc', base: 48 + prestige * 0.12, classId: null, championship, teamId: team.id, female, bench: true });
      u.riders[rider.id] = rider;
    }
    return team;
  };

  // 20 single-charter teams in the S4 championship. First 6 get factory-level
  // prestige (they become the dual-charter orgs when the 2S championship ships).
  const created: Team[] = [];
  for (const champ of champs) {
    for (let s = 0; s < CHARTERS_PER_CHAMPIONSHIP; s++) {
      const prestige = s < 6 ? irange(rng, 65, 92) : irange(rng, 35, 80);
      created.push(makeCharterTeam(champ, false, undefined, orgNames[orgCursor++], prestige));
    }
  }
  runYearOneDraft(rng, u, created);
}

/**
 * Year One NAMC Draft (rulebook v15.1 §4.10): factory charters keep up to 2
 * pre-contracted riders, Independent Teams keep 1; every other active rider
 * enters the class draft pools and is selected in public-lottery order.
 * Bench riders are pre-approved at roster submission (§3.3) and stay put.
 */
function runYearOneDraft(rng: RNG, u: Universe, teams: Team[]): void {
  const factories = teams.slice().sort((a, b) => b.prestige - a.prestige).slice(0, 6);
  const isFactory = new Set(factories.map(t => t.id));
  const pools: Record<string, Rider[]> = {};

  for (const team of teams) {
    const active = Object.values(u.riders)
      .filter(r => r.teamId === team.id && !r.bench)
      .sort((a, b) => b.overall - a.overall);
    const keep = isFactory.has(team.id) ? 2 : 1;   // pre-contracted riders
    active.slice(keep).forEach(r => {
      (pools[r.classId!] ??= []).push(r);
      r.teamId = null;
    });
  }
  for (const cls of Object.keys(pools)) pools[cls].sort((a, b) => b.overall - a.overall);

  // Public lottery sets the order (§4.10); best available per vacancy, no trading.
  const lottery = shuffle(rng, teams.slice());
  let picking = true;
  while (picking) {
    picking = false;
    for (const team of lottery) {
      for (const cls of NAMC_CLASS_IDS) {
        const have = Object.values(u.riders).filter(r => r.teamId === team.id && r.classId === cls && !r.bench).length;
        const pool = pools[cls] ?? [];
        if (have < RIDERS_PER_CLASS_PER_TEAM && pool.length > 0) {
          pool.shift()!.teamId = team.id;
          picking = true;
        }
      }
    }
  }
}

function buildTracks(u: Universe): void {
  for (const [id, name, location, lengthKm, baseLap, wb] of GP_TRACKS) {
    u.tracks[id] = { id, name, location, discipline: 'gp', kind: 'road', lengthKm, baseLapSec: baseLap, weatherBias: wb };
  }
  for (const [id, name, location, lengthKm, baseLap, wb] of SBK_TRACKS) {
    u.tracks[id] = { id, name, location, discipline: 'sbk', kind: 'road', lengthKm, baseLapSec: baseLap, weatherBias: wb };
  }
  // NAMC 2027 Master Racing Calendar (rulebook v15.1 §10.2): 20 real venues,
  // Fox Raceway opener -> Glen Helen finale. Lap time varies per venue.
  NAMC_2027_CALENDAR.forEach(([id, name, location], i) => {
    const baseLap = 88 + ((i * 7) % 18);            // 88-105s, deterministic per venue
    const wb = location.includes('WA') || location.includes('BC') || location.includes('AK') ? 0.30
      : location.includes('HI') || location.includes('TX') ? 0.24 : 0.18;
    u.tracks[id] = { id, name, location, discipline: 'namc', kind: 'outdoor', lengthKm: 1.8, baseLapSec: baseLap, weatherBias: wb };
  });

  u.calendars.gp = GP_TRACKS.map(([id], i) => ({ round: i + 1, trackId: id, kind: 'road' as const }));
  u.calendars.sbk = SBK_TRACKS.map(([id], i) => ({ round: i + 1, trackId: id, kind: 'road' as const }));
  u.calendars.namc = NAMC_2027_CALENDAR.map(([id], i) => ({ round: i + 1, trackId: id, kind: 'outdoor' as const }));
}

export function buildUniverse(seed: number, season = 2027): Universe {
  riderSeq = 0; teamSeq = 0;
  const rng = mulberry32(seed);
  const mfgs = initializeManufacturers(seed);
  const u: Universe = {
    seed, season,
    riders: {}, teams: {},
    manufacturers: Object.fromEntries(mfgs.map(m => [m.id, m])),
    sponsors: Object.fromEntries(SPONSORS.map(s => [s.id, s])),
    tireBrands: Object.fromEntries(TIRE_BRANDS.map(t => [t.id, t])),
    tracks: {},
    calendars: { gp: [], sbk: [], namc: [] },
    engineOrders: [],
  };
  buildTracks(u);
  buildRoadDiscipline(rng, u, 'gp', GP_TEAMS, GP_STARS);
  buildRoadDiscipline(rng, u, 'sbk', SBK_TEAMS, SBK_STARS);
  buildNAMC(rng, u);
  return u;
}

// ------------------------------------------------------------ helpers
export function gridOf(u: Universe, classId: ClassId, championship: ChampionshipId): Rider[] {
  const starters = Object.values(u.riders).filter(r =>
    r.classId === classId && r.championship === championship && !r.bench &&
    r.teamId !== null,
  );

  // NAMC bench substitution: injured/suspended starters promoted by bench rider.
  // Rulebook 4.8.1 requires 2M+1F bench. If injured/suspended, next bench replaces.
  const grid: Rider[] = [];
  for (const starter of starters) {
    // §13.1: Exclude suspended riders
    const isSuspended = starter.suspendedForRounds && starter.suspendedForRounds > 0;
    if (starter.injuredForRounds === 0 && !isSuspended) {
      grid.push(starter);
    } else {
      // Look for an available bench rider from the same team, same class/championship
      const bench = Object.values(u.riders).find(b =>
        b.bench && b.teamId === starter.teamId &&
        b.classId === classId && b.championship === championship &&
        b.injuredForRounds === 0 && !b.subbingFor &&
        (!b.suspendedForRounds || b.suspendedForRounds <= 0),  // not suspended either
      );
      if (bench) {
        bench.subbingFor = starter.id;  // Track who they're covering
        grid.push(bench);
      }
      // If no bench available, that grid slot goes unfilled (smaller field)
    }
  }
  return grid;
}

export function teamsOf(u: Universe, discipline: DisciplineId, championship?: ChampionshipId): Team[] {
  return Object.values(u.teams).filter(t =>
    t.discipline === discipline && (championship === undefined || t.championship === championship),
  );
}

export function ridersOfTeam(u: Universe, teamId: string): Rider[] {
  return Object.values(u.riders).filter(r => r.teamId === teamId);
}
