// Staff system: Mechanics, Designers, and their specialties
// Higher tier = more capabilies, higher cost, unlock advanced R&D paths

import type { OVRDelta } from './setups';

export type StaffRole = 'chief-designer' | 'lead-mechanic' | 'electronics-tech';
export type StaffExperience = 'expert' | 'experienced' | 'junior';
export type MechanicSpecialty =
  | 'engine-tuner' | 'suspension-specialist' | 'telemetry-analyst';
export type DesignerSpecialty =
  | 'livery-aesthetics' | 'chassis-geometry' | 'weight-reduction';

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  experience: StaffExperience;
  salary: number; // yearly
  description: string;
  specialties: (MechanicSpecialty | DesignerSpecialty)[];
  ovrBonus: OVRDelta; // passive bonus to all bikes they work on
  rdUnlockTier: 1 | 2 | 3; // which R&D tiers they can unlock
  maxBonusTier: 1 | 2 | 3; // highest bonus tier they can apply to parts
}

// ============================================================================
// MECHANICAL STAFF (Engine, Suspension, Telemetry focus)
// ============================================================================

export const MECHANICAL_STAFF: Record<string, Staff> = {
  'lead-mechanic-expert': {
    id: 'lead-mechanic-expert',
    name: 'Dr. Kevin Caruso',
    role: 'lead-mechanic',
    experience: 'expert',
    salary: 200000,
    description: 'Factory race engineer with 25+ years experience. Can unlock Tier 3 engine tuning.',
    specialties: ['engine-tuner', 'suspension-specialist', 'telemetry-analyst'],
    ovrBonus: { raceEndurance: 1 },
    rdUnlockTier: 3,
    maxBonusTier: 3,
  },
  'lead-mechanic-experienced': {
    id: 'lead-mechanic-experienced',
    name: 'Marcus Webb',
    role: 'lead-mechanic',
    experience: 'experienced',
    salary: 120000,
    description: 'Mid-level tuner. Can handle Tier 2 R&D, solid all-around diagnostics.',
    specialties: ['engine-tuner', 'suspension-specialist'],
    ovrBonus: {},
    rdUnlockTier: 2,
    maxBonusTier: 2,
  },
  'lead-mechanic-junior': {
    id: 'lead-mechanic-junior',
    name: 'Tyler Rodriguez',
    role: 'lead-mechanic',
    experience: 'junior',
    salary: 60000,
    description: 'Fresh talent. Good with routine maintenance, limited R&D access.',
    specialties: ['engine-tuner'],
    ovrBonus: {},
    rdUnlockTier: 1,
    maxBonusTier: 1,
  },
  'electronics-expert': {
    id: 'electronics-expert',
    name: 'Dr. Akira Yamamoto',
    role: 'electronics-tech',
    experience: 'expert',
    salary: 150000,
    description: 'ECU mapping specialist, AI traction control architect.',
    specialties: ['telemetry-analyst'],
    ovrBonus: { trackAwareness: 2 },
    rdUnlockTier: 3,
    maxBonusTier: 3,
  },
  'electronics-experienced': {
    id: 'electronics-experienced',
    name: 'Jake Patterson',
    role: 'electronics-tech',
    experience: 'experienced',
    salary: 90000,
    description: 'Data logger, can refine stock ECU maps for different tracks.',
    specialties: ['telemetry-analyst'],
    ovrBonus: { trackAwareness: 1 },
    rdUnlockTier: 2,
    maxBonusTier: 2,
  },
  'electronics-junior': {
    id: 'electronics-junior',
    name: 'Sam Chen',
    role: 'electronics-tech',
    experience: 'junior',
    salary: 45000,
    description: 'Learning technician. Can log data, basic analysis.',
    specialties: ['telemetry-analyst'],
    ovrBonus: {},
    rdUnlockTier: 1,
    maxBonusTier: 1,
  },
};

// ============================================================================
// DESIGN STAFF (Chassis, Geometry, Aesthetics focus)
// ============================================================================

export const DESIGN_STAFF: Record<string, Staff> = {
  'chief-designer-expert': {
    id: 'chief-designer-expert',
    name: 'Antonio Rossi',
    role: 'chief-designer',
    experience: 'expert',
    salary: 500000,
    description: 'Legendary designer. Can unlock Tier 3 chassis geometry and weight-reduction R&D.',
    specialties: ['livery-aesthetics', 'chassis-geometry', 'weight-reduction'],
    ovrBonus: { technicalLine: 1, styleOrScrub: 1 },
    rdUnlockTier: 3,
    maxBonusTier: 3,
  },
  'chief-designer-experienced': {
    id: 'chief-designer-experienced',
    name: 'Lisa Henderson',
    role: 'chief-designer',
    experience: 'experienced',
    salary: 250000,
    description: 'Solid designer. Tier 2 R&D unlock, good chassis tuning.',
    specialties: ['chassis-geometry', 'weight-reduction'],
    ovrBonus: { technicalLine: 1 },
    rdUnlockTier: 2,
    maxBonusTier: 2,
  },
  'chief-designer-junior': {
    id: 'chief-designer-junior',
    name: 'Alex Morgan',
    role: 'chief-designer',
    experience: 'junior',
    salary: 100000,
    description: 'Entry-level designer. Handles livery and basic chassis concepts.',
    specialties: ['livery-aesthetics'],
    ovrBonus: {},
    rdUnlockTier: 1,
    maxBonusTier: 1,
  },
};

// All staff combined lookup
export const ALL_STAFF: Record<string, Staff> = {
  ...MECHANICAL_STAFF,
  ...DESIGN_STAFF,
};

// Helper: get staff by role and experience level
export function getStaffByLevel(role: StaffRole, experience: StaffExperience): Staff | undefined {
  const key = `${role}-${experience}`;
  return ALL_STAFF[key];
}

// Helper: get all available staff of a role
export function getStaffByRole(role: StaffRole): Staff[] {
  return Object.values(ALL_STAFF).filter(s => s.role === role);
}

// ============================================================================
// STAFF BONUS TIER SYSTEM
// ============================================================================
// Each specialty can be upgraded from Tier 1 → Tier 2 → Tier 3 via R&D investment
// Higher tier = better OVR bonus, unlocks advanced tuning options

export interface SpecialtyBonus {
  specialty: MechanicSpecialty | DesignerSpecialty;
  tier: 1 | 2 | 3;
  costToUnlock: number; // one-time R&D cost
  costPerRound: number; // maintenance/ongoing cost
  ovrBonus: OVRDelta;
  description: string;
}

export const SPECIALTY_BONUSES: SpecialtyBonus[] = [
  // ENGINE-TUNER progression
  {
    specialty: 'engine-tuner',
    tier: 1,
    costToUnlock: 0,
    costPerRound: 2000,
    ovrBonus: { raceEndurance: 0.5 },
    description: 'Baseline engine mapping. Standard clutch setup.',
  },
  {
    specialty: 'engine-tuner',
    tier: 2,
    costToUnlock: 85000,
    costPerRound: 4000,
    ovrBonus: { raceEndurance: 1, startGateJump: 0.5 },
    description: 'Custom launch sequences. Heat-resistant cooling mods.',
  },
  {
    specialty: 'engine-tuner',
    tier: 3,
    costToUnlock: 180000,
    costPerRound: 6000,
    ovrBonus: { raceEndurance: 2, startGateJump: 1 },
    description: 'Proprietary fuel maps. Altitude compensation ECU overlays.',
  },

  // SUSPENSION-SPECIALIST progression
  {
    specialty: 'suspension-specialist',
    tier: 1,
    costToUnlock: 0,
    costPerRound: 1500,
    ovrBonus: { technicalLine: 0.5 },
    description: 'Stock suspension tuning. Standard spring rate changes.',
  },
  {
    specialty: 'suspension-specialist',
    tier: 2,
    costToUnlock: 95000,
    costPerRound: 3000,
    ovrBonus: { technicalLine: 1, trackAwareness: 0.5 },
    description: 'Custom damping valves. Track-specific geometry tuning.',
  },
  {
    specialty: 'suspension-specialist',
    tier: 3,
    costToUnlock: 150000,
    costPerRound: 5000,
    ovrBonus: { technicalLine: 2, trackAwareness: 1 },
    description: 'Proprietary internal valving. Rider-weight-specific tuning profiles.',
  },

  // TELEMETRY-ANALYST progression
  {
    specialty: 'telemetry-analyst',
    tier: 1,
    costToUnlock: 0,
    costPerRound: 1000,
    ovrBonus: { trackAwareness: 0.5 },
    description: 'Basic data logging. Standard lap analysis.',
  },
  {
    specialty: 'telemetry-analyst',
    tier: 2,
    costToUnlock: 75000,
    costPerRound: 2500,
    ovrBonus: { trackAwareness: 1, raceEndurance: 0.5 },
    description: 'Advanced metrics. Rider-style optimization suggestions.',
  },
  {
    specialty: 'telemetry-analyst',
    tier: 3,
    costToUnlock: 120000,
    costPerRound: 4000,
    ovrBonus: { trackAwareness: 2, raceEndurance: 1 },
    description: 'AI predictive analysis. Heat management forecasting.',
  },

  // CHASSIS-GEOMETRY progression
  {
    specialty: 'chassis-geometry',
    tier: 1,
    costToUnlock: 0,
    costPerRound: 1500,
    ovrBonus: { technicalLine: 0.5 },
    description: 'Stock rake/trail angles. Standard geometry advice.',
  },
  {
    specialty: 'chassis-geometry',
    tier: 2,
    costToUnlock: 110000,
    costPerRound: 3500,
    ovrBonus: { technicalLine: 1.5, styleOrScrub: 0.5 },
    description: 'Custom trail adjustments. Track-specific pivot heights.',
  },
  {
    specialty: 'chassis-geometry',
    tier: 3,
    costToUnlock: 180000,
    costPerRound: 5500,
    ovrBonus: { technicalLine: 2.5, styleOrScrub: 1, startGateJump: 0.5 },
    description: 'Proprietary geometry design. Terrain-adaptive chassis concepts.',
  },

  // WEIGHT-REDUCTION progression
  {
    specialty: 'weight-reduction',
    tier: 1,
    costToUnlock: 0,
    costPerRound: 1000,
    ovrBonus: { styleOrScrub: 0.5 },
    description: 'Basic weight audits. Standard fastener optimization.',
  },
  {
    specialty: 'weight-reduction',
    tier: 2,
    costToUnlock: 92000,
    costPerRound: 2800,
    ovrBonus: { styleOrScrub: 1, raceEndurance: 0.5 },
    description: 'Carbon part integration. Custom aluminum alloy upgrades.',
  },
  {
    specialty: 'weight-reduction',
    tier: 3,
    costToUnlock: 160000,
    costPerRound: 4200,
    ovrBonus: { styleOrScrub: 2, raceEndurance: 1, technicalLine: 0.5 },
    description: 'Exotic materials (titanium, carbon ceramic). Proprietary weight-saving designs.',
  },

  // LIVERY-AESTHETICS progression
  {
    specialty: 'livery-aesthetics',
    tier: 1,
    costToUnlock: 0,
    costPerRound: 500,
    ovrBonus: { styleOrScrub: 0.5 },
    description: 'Stock livery. Brand standards application.',
  },
  {
    specialty: 'livery-aesthetics',
    tier: 2,
    costToUnlock: 45000,
    costPerRound: 1500,
    ovrBonus: { styleOrScrub: 1 },
    description: 'Custom paint designs. Sponsor integration artwork.',
  },
  {
    specialty: 'livery-aesthetics',
    tier: 3,
    costToUnlock: 90000,
    costPerRound: 2500,
    ovrBonus: { styleOrScrub: 1.5, trackAwareness: 0.5 },
    description: 'Signature style identity. Cutting-edge graphic design.',
  },
];

// Helper: get bonus tier details for a specialty
export function getSpecialtyBonus(
  specialty: MechanicSpecialty | DesignerSpecialty,
  tier: 1 | 2 | 3,
): SpecialtyBonus | undefined {
  return SPECIALTY_BONUSES.find(b => b.specialty === specialty && b.tier === tier);
}
