// Core data model for Motorcycle Manager.

export type DisciplineId = 'gp' | 'sbk' | 'namc';

/** GP: gp3 -> gp2 -> gp1 ; SBK: ss300 -> ss600 -> sbk ; NAMC: c250p -> c250 -> c350 (+ women) */
export type ClassId =
  | 'gp1' | 'gp2' | 'gp3'
  | 'sbk' | 'ss600' | 'ss300'
  | 'c350' | 'c250' | 'c250p' | 'women';

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
  // Terminal Technical Violations (§12.4)
  isTerminalViolation?: boolean;   // terminal tech violation (DQ, point forfeit)
  affectedRiders?: string[];       // riderId[] disqualified this round
  pointsForfeitedByRound?: Record<string, number>; // riderId -> points lost in this round
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
  seasonsInCurrentClass: number; // tracks 250P max 2-season limit (rulebook §3.2)
  bench: boolean;             // NAMC reserve rider
  subbingFor?: string;        // Appendix B: active bench rider covering this injured starter
  ballastKg?: number;         // BOP success ballast (boss ruling 2026-07-17): win +2kg,
                              // podium +1kg, off-podium -1kg, cap 12kg, resets each season
  suspendedForRounds?: number;// §13.1: suspension penalty countdown
  suspensionReason?: string;  // reason for suspension
  // MotoGP concession tier
  concessionTier?: ConcessionTier;  // A/B/C/D: based on manufacturer championship position
  // GP/SBK grid penalties
  gridPenaltyPositions?: number;  // GP: position loss in next qualifying/race
  race2GridPenalty?: number;      // SBK: flag for Race 2 grid move (1 = move to back)
  // SBK fuel consumption & strategy
  lastRaceAverageFuelPerLap?: number;  // liters/lap (for race strategy)
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
  // MotoGP-specific
  developmentTokensUsed?: number;  // concession development tokens spent this season
  // SBK-specific
  fuelConsumptionBaseline?: number; // liters/lap baseline for race strategy (initialized from testing)
}

export type ManufacturerReliability = 'fragile' | 'balanced' | 'bulletproof';
export type ManufacturerFinancialState = 'stable' | 'stressed' | 'crisis' | 'recovering';

export interface Manufacturer {
  id: string;
  name: string;
  color: string;
  strokes?: '2S' | '4S' | 'both';              // NAMC engine types offered
  reliabilityBias: ManufacturerReliability;    // personality: fragile (40-60), balanced (60-75), bulletproof (80-95)
  performanceCeiling: number;                   // 0-100: peak engine output (inverse correlation with reliability)
  // Financial system (supply chain dynamics)
  cashOnHand: number;                          // manufacturer liquidity (seed-based RNG)
  financialState: ManufacturerFinancialState; // stable/stressed/crisis/recovering
  productionCapacity: number;                  // 0-1: fraction of orders fulfilled (1.0 = all, 0.5 = half)
  baseEngineCost: number;                      // base cost before premiums (e.g. $80k)
  costMultiplier: number;                      // crisis = 1.5x, stressed = 1.2x, stable = 1.0x
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
  baseGrip?: number;    // 0.7-1.2 terrain grip baseline (motocross only)
  dustiness?: number;   // 0.0-0.4 track dust factor (motocross only)
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

export interface EngineOrder {
  id: string;
  teamId: string;
  manufacturerId: string;
  orderedSeason: number;
  expectedArrivalSeason: number;  // arrives next season (or mid-current if rush)
  cost: number;
  rushOrder: boolean;             // 40% premium for expedited delivery
  fulfilled: boolean;             // did it actually arrive? (affected by manufacturer capacity)
  delayedRounds?: number;         // if delayed mid-season, how many rounds?
}

// ============================================================================
// CHAMPIONSHIP-SPECIFIC EXTENSIONS
// ============================================================================

export type ConcessionTier = 'A' | 'B' | 'C' | 'D';

export interface MotoGPExtension {
  discipline: 'gp';
  // Concession tiers: assigned based on championship standing
  concessionTiers: Record<string, ConcessionTier>;  // manufacturerId -> tier
  // Development tokens (for technical upgrades)
  developmentTokensUsed: Record<string, number>;    // manufacturerId -> count
}

export interface BoP_AdjustmentRecord {
  rpmLimit: number;
  fuelFlowMax: number;
  airRingSize: number;
  minWeight: number;
}

export interface SBKExtension {
  discipline: 'sbk';
  // Balance of Performance (BoP) adjustments every 3 rounds
  bopAdjustments: Record<string, BoP_AdjustmentRecord>;  // manufacturerId -> BoP
  bopLastAdjustedRound: number;
  // Grid reversal logic (Race 2 grid based on Race 1 results)
  gridReversalActive: boolean;
}

export type ChampionshipExtension = MotoGPExtension | SBKExtension | null;

// ============================================================================
// MULTI-RACE WEEKEND SUPPORT (Sprint + Main for GP, Superpole + Race1 + Race2 for SBK)
// ============================================================================

export type RaceSessionType = 'practice' | 'qualifying' | 'sprint' | 'superpole' | 'main' | 'race1' | 'race2';

export interface CalendarRound {
  round: number;
  trackId: string;
  /** NAMC: rounds 1-12 stadium, 13-24 outdoor; GP/SBK: always 'road' */
  kind: 'road' | 'stadium' | 'outdoor';
  // Multi-race support: different session schedules per championship
  sessions?: {
    sessionType: RaceSessionType;
    earnPoints: boolean;
    pointScale?: number;  // 1.0x for main, 0.5x for sprint, etc.
    gridType?: 'combined' | 'reversed-top-6';  // for Race 2 in SBK
  }[];
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
  engineOrders: EngineOrder[];     // active parts orders (lead time tracking)
  // Championship-specific extensions
  champExtension?: ChampionshipExtension;
  // Inter-league news archive
  newsArchive: NewsEvent[];
}

// ============================================================================
// INTER-LEAGUE NEWS SYSTEM (Ryan's Briefing)
// ============================================================================

export type NewsEventType =
  | 'signing'              // Free agent signs with team
  | 'injury'               // Rider sidelined for rounds
  | 'breakout'             // Unknown rider has breakthrough win
  | 'rivalry'              // Heated battle between two riders
  | 'transfer-rumor'       // Star rider linked to move
  | 'championship-drama'   // Tense championship battle unfolding
  | 'team-conflict'        // Internal team drama
  | 'coaching-change'      // New crew chief or mentor
  | 'comeback'             // Veteran returns after absence
  | 'rookie-sensation';    // Newcomer impressing everyone

export interface NewsEvent {
  id: string;
  round: number;                           // round generated
  timestamp: number;                       // when in season (0-20 for NAMC, etc.)
  type: NewsEventType;
  discipline: DisciplineId;                // which league's news
  subjectRiderId?: string;                 // primary rider involved
  subjectTeamId?: string;                  // team involved
  secondaryRiderId?: string;               // e.g., rival in rivalry news
  headline: string;                        // brief title
  body: string;                            // full description (Ryan's commentary)
  impact?: {
    riderMoraleShift?: Record<string, number>;  // teamId -> morale delta
    playerTeamSentiment?: number;               // -10 to +10 (bad news / good news for player)
  };
}
