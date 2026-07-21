// Setup tuning system: Electronics, Exhaust, Suspension "force multipliers"
// These modify the base bike performance per round without changing hardware commitment.

export type ElectronicsType = 'factory-spec' | 'vortex' | 'get' | 'jd-jetting';
export type ExhaustType = 'oem' | 'pro-circuit' | 'fmf' | 'akrapovic';
export type SuspensionMode = 'high-speed' | 'low-speed';
export type TrackSurface = 'loam' | 'sand' | 'hardpack' | 'wet' | 'mixed';

export interface OVRDelta {
  styleOrScrub?: number;
  technicalLine?: number;
  startGateJump?: number;
  raceEndurance?: number;
  trackAwareness?: number;
}

export interface ElectronicsSystem {
  id: ElectronicsType;
  name: string;
  yearlyLeaseCost: number;
  description: string;
  launchControl: 'automatic' | 'manual' | 'basic';
  dataLogging: 'full' | 'limited' | 'none';
  ovrBonus: OVRDelta;
  reliability: number; // 0-100, impacts DNF chance
  staffTierUnlock: 1 | 2 | 3; // Minimum staff tier to use advanced tuning
}

export interface ExhaustSystem {
  id: ExhaustType;
  name: string;
  costPerBike: number;
  description: string;
  weight: number; // lbs reduction from OEM
  torqueCharacter: 'low-end' | 'mid-range' | 'top-end'; // primary focus
  ovrBonus: OVRDelta;
  durability: number; // 0-100, how long before repacking needed
  maintenanceCostPerRound: number;
}

export interface SuspensionSetup {
  mode: SuspensionMode;
  trackSurface: TrackSurface;
  compression: number; // 0-100, higher = stiffer
  rebound: number; // 0-100, higher = faster rebound
  springRate: number; // 0-100, higher = stiffer springs
  ovrBonus: OVRDelta;
  riderFatigueFactor: number; // 0-1, how much energy rider spends per lap (1.0 = baseline)
}

export const ELECTRONICS_SYSTEMS: Record<ElectronicsType, ElectronicsSystem> = {
  'factory-spec': {
    id: 'factory-spec',
    name: 'Factory-Spec ECU',
    yearlyLeaseCost: 110000,
    description: 'Integrated factory system with automatic traction control and launch assist.',
    launchControl: 'automatic',
    dataLogging: 'full',
    ovrBonus: { trackAwareness: 2 },
    reliability: 95,
    staffTierUnlock: 1,
  },
  'vortex': {
    id: 'vortex',
    name: 'Vortex Performance ECU',
    yearlyLeaseCost: 95000,
    description: 'Aftermarket custom maps unlocking hidden engine power (+3-5% peak).',
    launchControl: 'manual',
    dataLogging: 'limited',
    ovrBonus: { startGateJump: 1, raceEndurance: 1 },
    reliability: 85, // higher risk if not tuned perfectly
    staffTierUnlock: 2, // need experienced tuner to risk it
  },
  'get': {
    id: 'get',
    name: 'GET Data-Logging System',
    yearlyLeaseCost: 75000,
    description: 'Specialized telemetry capture for chassis and rider development.',
    launchControl: 'basic',
    dataLogging: 'full',
    ovrBonus: { technicalLine: 1, trackAwareness: 1 },
    reliability: 92,
    staffTierUnlock: 1,
  },
  'jd-jetting': {
    id: 'jd-jetting',
    name: 'JD Jetting Basic ECU',
    yearlyLeaseCost: 45000,
    description: 'Budget entry-level reliability specialist. No bells, just baseline work.',
    launchControl: 'basic',
    dataLogging: 'none',
    ovrBonus: {},
    reliability: 98, // most reliable, least capable
    staffTierUnlock: 1,
  },
};

export const EXHAUST_SYSTEMS: Record<ExhaustType, ExhaustSystem> = {
  'oem': {
    id: 'oem',
    name: 'Factory OEM Exhaust',
    costPerBike: 32500,
    description: 'Safe, mass-production design. Perfect fitment, moderate power.',
    weight: 0,
    torqueCharacter: 'mid-range',
    ovrBonus: {},
    durability: 100,
    maintenanceCostPerRound: 0,
  },
  'pro-circuit': {
    id: 'pro-circuit',
    name: 'Pro Circuit Titanium',
    costPerBike: 2000,
    description: 'Race-proven titanium system. Lighter, race-tuned power, fragile.',
    weight: 2.5,
    torqueCharacter: 'top-end',
    ovrBonus: { styleOrScrub: 1, raceEndurance: 1 },
    durability: 60, // high maintenance risk
    maintenanceCostPerRound: 800,
  },
  'fmf': {
    id: 'fmf',
    name: 'FMF Powerbomb',
    costPerBike: 1600,
    description: 'Torque curve customization specialist. Explosive low-end, burns out packing.',
    weight: 1.8,
    torqueCharacter: 'low-end',
    ovrBonus: { startGateJump: 2, technicalLine: -1 }, // great gate jump, hurts smooth line choice
    durability: 55,
    maintenanceCostPerRound: 1200,
  },
  'akrapovic': {
    id: 'akrapovic',
    name: 'Akrapovič Elite Composite',
    costPerBike: 3200,
    description: 'Ceramic matrix composites. Most durable, most expensive. Best-in-class longevity.',
    weight: 2.2,
    torqueCharacter: 'mid-range',
    ovrBonus: { raceEndurance: 2 },
    durability: 95,
    maintenanceCostPerRound: 300,
  },
};

// Suspension tuning presets for different track surfaces and riding styles
export const SUSPENSION_PRESETS: Record<string, SuspensionSetup> = {
  'loam-standard': {
    mode: 'high-speed',
    trackSurface: 'loam',
    compression: 55,
    rebound: 50,
    springRate: 50,
    ovrBonus: { technicalLine: 1 },
    riderFatigueFactor: 0.95,
  },
  'sand-compliant': {
    mode: 'low-speed',
    trackSurface: 'sand',
    compression: 35,
    rebound: 40,
    springRate: 40,
    ovrBonus: { trackAwareness: 1 },
    riderFatigueFactor: 1.05,
  },
  'hardpack-stiff': {
    mode: 'high-speed',
    trackSurface: 'hardpack',
    compression: 70,
    rebound: 65,
    springRate: 65,
    ovrBonus: { startGateJump: 1 },
    riderFatigueFactor: 1.1, // harsh, tires rider more
  },
  'wet-recovery': {
    mode: 'low-speed',
    trackSurface: 'wet',
    compression: 45,
    rebound: 55,
    springRate: 45,
    ovrBonus: { trackAwareness: 2 },
    riderFatigueFactor: 0.9,
  },
  'mixed-balanced': {
    mode: 'high-speed',
    trackSurface: 'mixed',
    compression: 50,
    rebound: 50,
    springRate: 50,
    ovrBonus: { technicalLine: 1 },
    riderFatigueFactor: 1.0,
  },
};

// R&D upgrade cost matrix: unlocks better tuning options
export interface RDUpgradeUnlock {
  name: string;
  category: 'electronics' | 'exhaust' | 'suspension';
  staffTierRequired: 1 | 2 | 3;
  costToUnlock: number; // one-time development cost
  ovrBonus: OVRDelta;
  description: string;
}

export const RD_UPGRADES: RDUpgradeUnlock[] = [
  {
    name: 'AI-Assisted Traction Control',
    category: 'electronics',
    staffTierRequired: 3,
    costToUnlock: 180000,
    ovrBonus: { trackAwareness: 1, raceEndurance: 1 },
    description: 'Custom slip-based power delivery. Tier 3 Electronics specialist only.',
  },
  {
    name: 'Custom Torque Map Library',
    category: 'exhaust',
    staffTierRequired: 2,
    costToUnlock: 120000,
    ovrBonus: { startGateJump: 1 },
    description: 'Unlock multiple exhaust tuning profiles for different track types.',
  },
  {
    name: 'Proprietary Damping Valving',
    category: 'suspension',
    staffTierRequired: 3,
    costToUnlock: 150000,
    ovrBonus: { technicalLine: 2 },
    description: 'Rider-specific suspension tuning. Tier 3 Suspension specialist only.',
  },
  {
    name: 'High-Altitude ECU Compensation',
    category: 'electronics',
    staffTierRequired: 2,
    costToUnlock: 75000,
    ovrBonus: { raceEndurance: 1 },
    description: 'Auto-calibrate fuel maps for altitude variance (Whistler/Anchorage finale).',
  },
  {
    name: 'Launch Control Refinement',
    category: 'electronics',
    staffTierRequired: 2,
    costToUnlock: 95000,
    ovrBonus: { startGateJump: 1 },
    description: 'Custom launch sequences per tire compound.',
  },
];

// Setup profile: what the player configures before each race
export interface SetupProfile {
  name: string;
  trackSurface: TrackSurface;
  electronics: ElectronicsType;
  exhaust: ExhaustType;
  suspension: SuspensionSetup;
  customizations: RDUpgradeUnlock[]; // which R&D upgrades are applied
}

// Calculate total OVR bonus from a complete setup
export function calculateSetupOVRBonus(setup: SetupProfile): OVRDelta {
  const result: OVRDelta = {};

  const electronicsSystem = ELECTRONICS_SYSTEMS[setup.electronics];
  const exhaustSystem = EXHAUST_SYSTEMS[setup.exhaust];
  const { suspension } = setup;

  // Combine all OVR bonuses
  const allBonuses = [electronicsSystem.ovrBonus, exhaustSystem.ovrBonus, suspension.ovrBonus];
  if (setup.customizations.length > 0) {
    allBonuses.push(...setup.customizations.map(u => u.ovrBonus));
  }

  for (const bonus of allBonuses) {
    if (bonus.styleOrScrub) result.styleOrScrub = (result.styleOrScrub ?? 0) + bonus.styleOrScrub;
    if (bonus.technicalLine) result.technicalLine = (result.technicalLine ?? 0) + bonus.technicalLine;
    if (bonus.startGateJump) result.startGateJump = (result.startGateJump ?? 0) + bonus.startGateJump;
    if (bonus.raceEndurance) result.raceEndurance = (result.raceEndurance ?? 0) + bonus.raceEndurance;
    if (bonus.trackAwareness) result.trackAwareness = (result.trackAwareness ?? 0) + bonus.trackAwareness;
  }

  return result;
}

// Calculate setup cost for a single round (maintenance + tuning)
export function calculateRoundSetupCost(setup: SetupProfile): number {
  const electronicsSystem = ELECTRONICS_SYSTEMS[setup.electronics];
  const exhaustSystem = EXHAUST_SYSTEMS[setup.exhaust];

  // Lease cost is annual, divide by 20 rounds
  const electronicsCost = electronicsSystem.yearlyLeaseCost / 20;

  // Exhaust maintenance per round
  const exhaustMaintenance = exhaustSystem.maintenanceCostPerRound;

  return electronicsCost + exhaustMaintenance;
}
