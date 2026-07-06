// Universe builder: generates the full three-discipline world.

import type {
  ChampionshipId, ClassId, DisciplineId, Rider, RiderStats, Team, Track, Universe, CalendarRound,
} from './types';
import { CLASSES, classById } from './classes';
import {
  MANUFACTURERS, SPONSORS, TIRE_BRANDS, GP_TEAMS, GP_STARS, SBK_TEAMS, SBK_STARS,
  GP_TRACKS, SBK_TRACKS, NAMC_STADIUMS, NAMC_OUTDOORS,
} from './parody';
import { FIRST_M, FIRST_F, LAST, NAT_WEIGHTS, TEAM_ADJ, TEAM_NOUN, NAMC_TEAM_CITIES } from './names';
import { SALARY_FLOORS, CHARTERS_PER_CHAMPIONSHIP, RIDERS_PER_CLASS_PER_TEAM, NAMC_CLASS_IDS } from './namc';
import { mulberry32, hashString, pick, irange, gauss, clamp, shuffle, type RNG } from '../util/rng';
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
  return {
    id: `r${riderSeq++}`,
    name: opts.name ?? riderName(rng, nat, female),
    age: irange(rng, 18, 34),
    nationality: nat,
    number: num,
    stats,
    overall,
    potential: clamp(overall + irange(rng, 0, 18), overall, 99),
    salary: opts.bench ? 50_000 : Math.round(floor * (1 + Math.max(0, overall - 60) / 25)),
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
    bench: opts.bench ?? false,
  };
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
    budget: Math.round(500_000 + (opts.prestige ?? 50) * 40_000),
    prestige: opts.prestige ?? 50,
    isPlayer: false,
    strikes: 0,
    classIds: opts.classIds,
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
  // 6 dual-charter orgs + 14 single-charter teams per championship.
  const DUAL_ORGS = 6;
  const champs: ChampionshipId[] = ['fourStroke', 'twoStroke'];
  const orgNames: string[] = [];
  while (orgNames.length < DUAL_ORGS + 14 + 14) {
    const style = irange(rng, 0, 2);
    const name = style === 0
      ? `${pick(rng, TEAM_ADJ)} ${pick(rng, TEAM_NOUN)}`
      : style === 1
        ? `${pick(rng, NAMC_TEAM_CITIES)} ${pick(rng, ['Moto', 'MX', 'Racing', 'Dirt Co'])}`
        : `${pick(rng, SPONSORS).name} ${pick(rng, ['Racing', 'MX', 'Factory Team'])}`;
    if (!orgNames.includes(name)) orgNames.push(name);
  }

  let orgCursor = 0;
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

    const usedNums = new Set<number>();
    // 8 starters: 2 per class (women's class riders are female)
    for (const cls of NAMC_CLASS_IDS) {
      for (let i = 0; i < RIDERS_PER_CLASS_PER_TEAM; i++) {
        const female = cls === 'women';
        const base = cls === 'c350' ? 66 + prestige * 0.2 : cls === 'c250' ? 60 + prestige * 0.18 : 52 + prestige * 0.16;
        const rider = makeRider(rng, { discipline: 'namc', base, classId: cls, championship, teamId: team.id, female, usedNumbers: usedNums });
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

  // Dual-charter organizations — one team entry per championship, linked by orgId.
  for (let d = 0; d < DUAL_ORGS; d++) {
    const name = orgNames[orgCursor++];
    const prestige = irange(rng, 65, 92);
    const orgId = `org_dual_${d}`;
    for (const champ of champs) {
      const t = makeCharterTeam(champ, true, orgId, name, prestige);
      // shared identity across both halves
      const first = Object.values(u.teams).find(x => x.orgId === orgId && x.id !== t.id);
      if (first) { t.colors = first.colors; t.logo = first.logo; t.shortName = first.shortName; }
    }
  }
  // Single-charter teams
  for (const champ of champs) {
    for (let s = 0; s < CHARTERS_PER_CHAMPIONSHIP - DUAL_ORGS; s++) {
      makeCharterTeam(champ, false, undefined, orgNames[orgCursor++], irange(rng, 35, 80));
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
  NAMC_STADIUMS.forEach(([id, name, location]) => {
    u.tracks[id] = { id, name, location, discipline: 'namc', kind: 'stadium', lengthKm: 0.9, baseLapSec: 52, weatherBias: 0.04 };
  });
  NAMC_OUTDOORS.forEach(([id, name, location]) => {
    u.tracks[id] = { id, name, location, discipline: 'namc', kind: 'outdoor', lengthKm: 1.8, baseLapSec: 95, weatherBias: 0.22 };
  });

  u.calendars.gp = GP_TRACKS.map(([id], i) => ({ round: i + 1, trackId: id, kind: 'road' as const }));
  u.calendars.sbk = SBK_TRACKS.map(([id], i) => ({ round: i + 1, trackId: id, kind: 'road' as const }));
  const namcCal: CalendarRound[] = [];
  NAMC_STADIUMS.forEach(([id], i) => namcCal.push({ round: i + 1, trackId: id, kind: 'stadium' }));
  NAMC_OUTDOORS.forEach(([id], i) => namcCal.push({ round: 13 + i, trackId: id, kind: 'outdoor' }));
  u.calendars.namc = namcCal;
}

export function buildUniverse(seed: number, season = 2027): Universe {
  riderSeq = 0; teamSeq = 0;
  const rng = mulberry32(seed);
  const u: Universe = {
    seed, season,
    riders: {}, teams: {},
    manufacturers: Object.fromEntries(MANUFACTURERS.map(m => [m.id, m])),
    sponsors: Object.fromEntries(SPONSORS.map(s => [s.id, s])),
    tireBrands: Object.fromEntries(TIRE_BRANDS.map(t => [t.id, t])),
    tracks: {},
    calendars: { gp: [], sbk: [], namc: [] },
  };
  buildTracks(u);
  buildRoadDiscipline(rng, u, 'gp', GP_TEAMS, GP_STARS);
  buildRoadDiscipline(rng, u, 'sbk', SBK_TEAMS, SBK_STARS);
  buildNAMC(rng, u);
  return u;
}

// ------------------------------------------------------------ helpers
export function gridOf(u: Universe, classId: ClassId, championship: ChampionshipId): Rider[] {
  return Object.values(u.riders).filter(r =>
    r.classId === classId && r.championship === championship && !r.bench && r.injuredForRounds === 0,
  );
}

export function teamsOf(u: Universe, discipline: DisciplineId, championship?: ChampionshipId): Team[] {
  return Object.values(u.teams).filter(t =>
    t.discipline === discipline && (championship === undefined || t.championship === championship),
  );
}

export function ridersOfTeam(u: Universe, teamId: string): Rider[] {
  return Object.values(u.riders).filter(r => r.teamId === teamId);
}
