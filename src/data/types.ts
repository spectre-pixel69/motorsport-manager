// Core data model for Motorcycle Manager.

export type DisciplineId = 'gp' | 'sbk' | 'namc';

/** GP: gp3 -> gp2 -> gp1 ; SBK: ss300 -> ss600 -> sbk ; NAMC: c125 -> c250 -> c350 (+ women) */
export type ClassId =
  | 'gp1' | 'gp2' | 'gp3'
  | 'sbk' | 'ss600' | 'ss300'
  | 'c350' | 'c250' | 'c125' | 'women';

/** NAMC runs two parallel championships. Road disciplines use 'road'. */
export type ChampionshipId = 'road' | 'fourStroke' | 'twoStroke';

export interface RiderStats {
  pace: number;        // raw speed 1-100
  consistency: number; // fewer mistakes
  starts: number;      // launch / holeshot ability
  aggression: number;  // overtaking, but crash risk
  fitness: number;     // late-race performance
  wet: number;         // rain skill
}

export interface Rider {
  id: string;
  name: string;
  age: number;
  nationality: string;
  number: number;
  stats: RiderStats;
  overall: number;       // derived headline rating
  potential: number;     // growth ceiling
  salary: number;        // per season
  morale: number;        // 0-100
  injuredForRounds: number; // 0 = fit
  careerWins: number;
  careerPodiums: number;
  championships: number; // in current class (legacy plate tracking)
  legacyPlate: 'none' | 'gold' | 'platinum' | 'diamond';
  isFemale: boolean;
  teamId: string | null;
  classId: ClassId | null;   // class they race in
  championship: ChampionshipId;
  bench: boolean;            // NAMC reserve rider
}

export interface BikeDev {
  engine: number;     // 1-100
  handling: number;
  reliability: number;
}

export interface LogoSpec {
  markId: number;      // 0-29 base emblem
  containerId: number; // 0-5
  styleId: number;     // 0-3
  primary: string;     // hex
  secondary: string;
  accent: string;
  initials: string;
  /** dataURL when player uploaded a custom logo (phase 2) */
  custom?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;   // 3-4 letters for timing tower
  discipline: DisciplineId;
  championship: ChampionshipId; // NAMC: which championship (dual-charter teams appear twice linked by orgId)
  orgId: string;       // shared across dual-charter halves
  dualCharter: boolean;
  colors: { primary: string; secondary: string };
  logo: LogoSpec;
  manufacturerId: string;
  tireBrandId: string;  // NAMC only
  bike: BikeDev;
  budget: number;       // cash on hand
  prestige: number;     // 1-100
  isPlayer: boolean;
  strikes: number;      // NAMC three-strike system
  classIds: ClassId[];  // classes this team fields riders in
}

export interface Manufacturer {
  id: string;
  name: string;
  color: string;
  strokes?: '2S' | '4S' | 'both'; // NAMC engine types offered
}

export interface Sponsor {
  id: string;
  name: string;
  color: string;
  tier: 'title' | 'major' | 'minor';
}

export interface TireBrand {
  id: string;
  name: string;
  color: string;
  grip: number;       // 1-100 hidden performance
  durability: number;
}

export interface Track {
  id: string;
  name: string;
  location: string;
  discipline: DisciplineId;
  kind: 'road' | 'stadium' | 'outdoor';
  lengthKm: number;     // road course length (motocross: lap length)
  baseLapSec: number;   // reference lap time for a 100-rated rider
  weatherBias: number;  // 0-1 chance-of-rain modifier
}

export interface CalendarRound {
  round: number;
  trackId: string;
  /** NAMC: rounds 1-12 stadium, 13-24 outdoor */
  kind: 'road' | 'stadium' | 'outdoor';
}

export interface ClassDef {
  id: ClassId;
  name: string;
  shortName: string;
  discipline: DisciplineId;
  tier: number;          // 1 = premier
  gridSize: number;
  salaryFloor: number;
  womenOnly?: boolean;
}

export interface Universe {
  seed: number;
  season: number; // year
  riders: Record<string, Rider>;
  teams: Record<string, Team>;
  manufacturers: Record<string, Manufacturer>;
  sponsors: Record<string, Sponsor>;
  tireBrands: Record<string, TireBrand>;
  tracks: Record<string, Track>;
  calendars: Record<DisciplineId, CalendarRound[]>;
}
