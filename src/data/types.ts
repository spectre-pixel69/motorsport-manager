// Core data model for Motorcycle Manager.

export type DisciplineId = 'gp' | 'sbk' | 'namc';

/** GP: gp3 -> gp2 -> gp1 ; SBK: ss300 -> ss600 -> sbk ; NAMC: c125 -> c250 -> c350 (+ women) */
export type ClassId =
  | 'gp1' | 'gp2' | 'gp3'
  | 'sbk' | 'ss600' | 'ss300'
  | 'c350' | 'c250' | 'c125' | 'women';

/** NAMC runs two parallel championships. Road disciplines use 'road'. */
export type ChampionshipId = 'road' | 'fourStroke' | 'twoStroke';

// ============================================================================
// PENALTY SYSTEM (v15.3 §13.1, §13.5, §12.4)
// ============================================================================

export type PenaltyTier = 1 | 2 | 3 | 4;

export type PenaltyReason =
  | 'aggressive-riding' | 'reckless-conduct' | 'unsportsmanlike'
  | 'ballast-manipulation' | 'non-homologated-engine' | 'technical-violation'
  | 'rules-infraction' | 'pit-lane-infraction' | 'driver-aid-violation';

export interface Penalty {
  id: string;
  issuedRound: number;             // round number when penalty issued
  tier: PenaltyTier;               // 1=warning, 2=fine, 3=suspension, 4=charter revocation
  reason: PenaltyReason;
  description: string;             // human-readable explanation
  fineAmount?: number;             // for Tier 2 (all to Welfare Fund)
  suspensionRounds?: number;       // for Tier 3 (1-4 consecutive rounds)
  suspensionStart?: number;        // round to begin suspension
  pointsForfeited?: number;        // points stripped if applicable
  resolvedRound?: number;          // when suspension ends (if applicable)
}

export interface RiderWelfareFund {
  totalAccumulated: number;        // sum of all fines collected
  fineHistory: Array<{
    round: number;
    teamId: string;
    amount: number;
    reason: string;
  }>;
}

export type RiderTrait =
  | 'wet-master' | 'holeshot-king' | 'late-braker' | 'ice-veins' | 'development-guru' | 'fan-favorite'
  | 'fragile' | 'reckless' | 'slow-starter';

export interface RiderSkills {
  pace: number;           // raw speed (1-100)
  braking: number;        // late braking, corner entry
  cornerSpeed: number;    // mid-corner lean/carry
  racecraft: number;      // overtaking + defending
  consistency: number;    // error/crash avoidance
  starts: number;         // launch / holeshot
  fitness: number;        // stamina, injury resistance
  wet: number;            // rain performance
  feedback: number;       // R&D development quality
}

export interface RiderStats {
  pace: number;        // raw speed 1-100 (legacy, kept for compatibility)
  consistency: number; // fewer mistakes
  starts: number;      // launch / holeshot ability
  aggression: number;  // overtaking, but crash risk
  fitness: number;     // late-race performance
  wet: number;         // rain skill
}

export interface RiderContract {
  salary: number;           // per season
  length: number;           // 1-4 years
  signingBonus: number;     // lump sum
  winBonus: number;         // per win
  podiumBonus: number;      // per podium
  titleBonus: number;       // championship bonus
  /**
   * Team's negotiated cut of the rider's purse winnings, set at contract
   * signing. Purse money is the RIDER'S by default; the team pushes for a
   * share during negotiation. HARD CAP 25% — no rider ever gives more.
   */
  purseShareTeamPct: number; // 0-25
  isNo1Rider: boolean;      // No. 1 rider status (team lead)
  releaseClause: number;    // buyout value (0 = none)
  hasTeammateVeto: boolean; // can veto teammate signings
}

export interface GatePreferenceProfile {
  holeshotPreferenceScore: number;         // 0-100: how badly rider wants holeshot (influences gate strategy)
  insideOutsideBias: number;                // -100 to +100: -100=inside bias, +100=outside bias
  conditionAdaptationSkill: number;         // 0-100: ability to adapt to different track surfaces/drainage
  riskTolerance: number;                    // 0-100: willingness to take desperate gate picks
  trackTypePreference: 'hardpack' | 'loam' | 'clay' | 'sandy' | 'balanced'; // which surface types rider prefers
  wetWeatherGateAdjustment: number;         // 0-100: tendency to shift gate strategy in rain
  mentalPreparationRigor: number;           // 0-100: how methodically rider prepares gate decision
  physicalGateComfort: number;              // 0-100: comfort with bike setup at specific gates
  dirtQualitySensitivity: number;           // 0-100: sensitivity to rut quality / dirt prep
  competitiveAggressionIndex: number;       // 0-100: aggressive gate-picking tendencies
  gateArchetype: 'holeshot-king' | 'gambler' | 'smooth-operator' | 'wet-specialist' | 'track-reader' | 'physical-attacker' | 'conservative' | 'developer'; // personality type
}

/**
 * Rider mental state — incremental, never whiplash.
 * Design rule: no single event moves any dial more than ±3 points.
 * Baselines: confidence 50, tilt 0, fatigue 0. States drift back toward
 * baseline each round, so storylines come from SUSTAINED runs of events,
 * not one bad Tuesday.
 */
export interface RiderMentalState {
  confidence: number;         // 0-100 (baseline 50): momentum from recent results
  tilt: number;               // 0-100 (baseline 0): frustration / negative spiral
  fatigue: number;            // 0-100 (baseline 0): season-long mental wear
  angerCharge: number;        // 0-100 (baseline 0): short-fuse fuel from a robbery/thrown-away win.
                              // Halves each round (~gone in 3). Confident + angry = faster;
                              // rattled + angry = crash-prone ("emotion gets in the way").
  consecutiveWins: number;
  consecutivePodiums: number;
  peakForm: boolean;          // 3+ straight podiums: riding the wave ("everything +1" feel)
  lastEvents: string[];       // short log of what last moved the needle (UI/debug)
}

export interface Rider {
  id: string;
  name: string;
  age: number;
  nationality: string;
  number: number;
  stats: RiderStats;
  skills: RiderSkills;        // NEW: expanded 9-skill system (0-100 exact)
  overall: number;            // derived headline rating (discipline-weighted)
  potential: number;          // HIDDEN: growth ceiling for each skill
  stamina: number;            // 0-100, resource for training
  traits: RiderTrait[];       // positive/negative traits
  salary: number;             // per season
  contract: RiderContract;    // NEW: full contract terms
  gatePreference: GatePreferenceProfile;  // NEW: 10-metric gate selection profile
  mental?: RiderMentalState;  // NEW: lazily initialized (keeps old saves loadable)
  morale: number;             // 0-100
  injuredForRounds: number;   // 0 = fit
  careerWins: number;
  careerPodiums: number;
  championships: number;      // in current class (legacy plate tracking)
  legacyPlate: 'none' | 'gold' | 'platinum' | 'diamond';
  isFemale: boolean;
  teamId: string | null;
  classId: ClassId | null;    // class they race in
  championship: ChampionshipId;
  bench: boolean;             // NAMC reserve rider
  subbingFor?: string;        // Appendix B: active bench rider covering this injured starter
  ballastKg?: number;         // BOP success ballast (boss ruling 2026-07-17): win +2kg,
                              // podium +1kg, off-podium -1kg, cap 8kg, resets each season
  suspendedForRounds?: number;// §13.1: suspension penalty countdown
  suspensionReason?: string;  // reason for suspension
}

export type EngineMode = 'conserve' | 'standard' | 'push' | 'attack';
export type PartFailureSeverity = 'minor' | 'moderate' | 'terminal';

export interface BikeComponent {
  id: string;
  name: string;
  type: 'engine' | 'gearbox' | 'suspension' | 'brakes' | 'chassis' | 'electronics';
  reliability: number;   // 0-100: base failure rate
  wear: number;          // 0-100: accumulates with mileage, multiplies failure chance
  mileageMiles: number;  // cumulative mileage
  lastRebuild?: number;  // round number of last rebuild
}

export interface BikeSetup {
  engineMode: EngineMode;        // conserve | standard | push | attack
  components: Record<string, BikeComponent>; // keyed by type
  mileageThisRound: number;      // track wear accumulation
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
  bikeSetup: BikeSetup; // NEW: per-round setup with engine mode + component wear
  budget: number;       // cash on hand
  prestige: number;     // 1-100
  isPlayer: boolean;
  strikes: number;      // NAMC three-strike system (legacy)
  classIds: ClassId[];  // classes this team fields riders in
  facilityLevel: number;// training facility level 1-5
  coachQuality: number; // coach skill modifier (0.8-1.5)
  penalties: Penalty[]; // §13.1: all penalties issued to this team
  charterRevoked?: boolean; // §13.1 Tier 4: charter permanently revoked (forces team fold)
}

export type ManufacturerReliability = 'fragile' | 'balanced' | 'bulletproof';

export interface Manufacturer {
  id: string;
  name: string;
  color: string;
  strokes?: '2S' | '4S' | 'both';              // NAMC engine types offered
  reliabilityBias: ManufacturerReliability;    // personality: fragile (40-60), balanced (60-75), bulletproof (80-95)
  performanceCeiling: number;                   // 0-100: peak engine output (inverse correlation with reliability)
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
  weatherBias: number;  // 0-1 chance-of-rain modifier (deprecated: use TrackDetails)
}

/**
 * Extended track information for detailed weather simulation & race strategy.
 * See src/data/tracks.ts for comprehensive database of all tracks.
 */
export interface TrackDetails extends Track {
  elevation: number;                           // meters above sea level
  soilType?: 'loam' | 'sand' | 'hardpack' | 'clay' | 'mixed' | 'volcanic'; // motocross
  asphaltType?: 'bitumen' | 'chip-seal' | 'concrete'; // road courses

  seasonalWeather: {
    spring: { dry: number; lightRain: number; heavyRain: number };
    summer: { dry: number; lightRain: number; heavyRain: number };
    fall: { dry: number; lightRain: number; heavyRain: number };
    winter: { dry: number; lightRain: number; heavyRain: number };
  };

  historicalEvents: {
    event: string;
    frequency: 'rare' | 'occasional' | 'common';
    season: string;
    impact: string;
  }[];

  drainageRating: number;                     // 1 (poor) to 5 (excellent)
  drainageNotes: string;
  waterHazards: string[];

  safetyFactors: {
    runoff: 'gravel' | 'tarmac' | 'grass' | 'mixed' | 'barriers';
    wallsPresent: boolean;
    wallHeight?: string;
    waterHazardPresent: boolean;
    hazardDescription?: string;
    overtakeZones: number;
    crashRiskRating: number;                  // 1-10
  };

  cornersPerLap: number;
  avgSpeed: number;                           // km/h
  specialties: string[];
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
