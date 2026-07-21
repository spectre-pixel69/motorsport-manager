// NAMC Bike Architecture: 11 Engines × 11 Chassis × 4 Tires
// Each combination creates a unique performance profile tied to OVR pillars.

import type { OVRDelta } from './setups';

export type EngineId =
  | 'street-derived-450' | 'full-spec-450' | 'mid-range-450' | 'torque-450' | 'over-rev-450'
  | 'restricted-450' | 'womens-450' | 'hybrid-450' | 'lightweight-450' | 'economy-450' | 'prototype-450';

export type ChassisId =
  | 'yamaha-star-racing' | 'honda-hrc' | 'ktm-red-bull' | 'kawasaki-monster' | 'husqvarna-factory'
  | 'triumph-factory' | 'spectre-lattice' | 'gasgas-troy-lee' | 'ducati-factory' | 'suzuki-rm' | 'beta-factory';

export type TireId = 'dust-devil' | 'ironclad' | 'parrilla' | 'michelin';

export interface Engine {
  id: EngineId;
  name: string;
  manufacturer: string;
  horsepower: number;
  weight: number; // lbs
  yearlyLeaseCost: number;
  description: string;
  ovrBonus: OVRDelta;
  reliability: number; // 0-100
  baseLapTime: number; // seconds baseline at std track
}

export interface Chassis {
  id: ChassisId;
  name: string;
  manufacturer: string;
  weight: number; // lbs
  yearlyLeaseCost: number;
  description: string;
  strengths: string[];
  weaknesses: string[];
  ovrBonus: OVRDelta;
  rigidity: number; // 0-100, how much the frame flexes
  compatibleEngines: EngineId[]; // which engines this is tuned for
}

export interface Tire {
  id: TireId;
  name: string;
  manufacturer: string;
  costPerSet: number;
  gripRating: number; // 0-100
  wearRate: number; // 0-1, higher = wears faster
  durability: number; // 0-100, puncture/chunk resistance
  description: string;
  strengths: string[];
  weaknesses: string[];
  ovrBonus: OVRDelta;
  bestForSurface: string[]; // 'loam', 'sand', 'hardpack', 'wet'
}

// ============================================================================
// ENGINES (11 Options)
// ============================================================================

export const ENGINES: Record<EngineId, Engine> = {
  'street-derived-450': {
    id: 'street-derived-450',
    name: 'Street-Derived 450cc',
    manufacturer: 'Suzuki',
    horsepower: 47,
    weight: 62,
    yearlyLeaseCost: 380000,
    description: 'Consistent mid-range power, natural torque curve, reliable baseline.',
    ovrBonus: { technicalLine: 3, raceEndurance: 2 },
    reliability: 96,
    baseLapTime: 125.2,
  },
  'full-spec-450': {
    id: 'full-spec-450',
    name: 'Full-Spec 450cc Factory',
    manufacturer: 'Yamaha',
    horsepower: 52,
    weight: 59,
    yearlyLeaseCost: 560000,
    description: 'Peak power delivery and instant launches, narrow powerband, demands precision.',
    ovrBonus: { startGateJump: 2, raceEndurance: 3 },
    reliability: 92,
    baseLapTime: 123.8,
  },
  'mid-range-450': {
    id: 'mid-range-450',
    name: 'Mid-Range Balanced 450cc',
    manufacturer: 'Honda',
    horsepower: 48,
    weight: 61,
    yearlyLeaseCost: 420000,
    description: 'Jack-of-all-trades powerplant. No major weaknesses, no standout strengths.',
    ovrBonus: { technicalLine: 2, trackAwareness: 1 },
    reliability: 94,
    baseLapTime: 125.0,
  },
  'torque-450': {
    id: 'torque-450',
    name: 'Torque-Focused 450cc',
    manufacturer: 'KTM',
    horsepower: 50,
    weight: 63,
    yearlyLeaseCost: 450000,
    description: 'Explosive low-end acceleration, aggressive throttle response, limited top-end.',
    ovrBonus: { startGateJump: 3, styleOrScrub: 1, raceEndurance: -1 },
    reliability: 88,
    baseLapTime: 124.5,
  },
  'over-rev-450': {
    id: 'over-rev-450',
    name: 'Over-Rev 450cc High-RPM',
    manufacturer: 'Yamaha',
    horsepower: 49,
    weight: 58,
    yearlyLeaseCost: 520000,
    description: 'Screaming RPM monster, peak power at 9000+, requires commitment.',
    ovrBonus: { raceEndurance: 4, technicalLine: -1 },
    reliability: 85,
    baseLapTime: 122.5,
  },
  'restricted-450': {
    id: 'restricted-450',
    name: 'Restricted 450cc (250P Class)',
    manufacturer: 'NAMC',
    horsepower: 35,
    weight: 61,
    yearlyLeaseCost: 280000,
    description: 'League-issued intake restrictor. Capped power, strict ECU lock, zero modifications.',
    ovrBonus: { raceEndurance: 1 },
    reliability: 99, // Sentinel-enforced, no risk
    baseLapTime: 129.8,
  },
  'womens-450': {
    id: 'womens-450',
    name: "Women's Class 450cc",
    manufacturer: 'Honda',
    horsepower: 45,
    weight: 60,
    yearlyLeaseCost: 350000,
    description: 'Conservative powerband, forgiving delivery, confidence-building.',
    ovrBonus: { technicalLine: 2, trackAwareness: 2 },
    reliability: 97,
    baseLapTime: 127.0,
  },
  'hybrid-450': {
    id: 'hybrid-450',
    name: 'Hybrid Balanced 450cc',
    manufacturer: 'Kawasaki',
    horsepower: 49,
    weight: 61,
    yearlyLeaseCost: 480000,
    description: 'Blends mid-range with gate jump capability. Flexible tuning platform.',
    ovrBonus: { technicalLine: 2, trackAwareness: 1, startGateJump: 1 },
    reliability: 93,
    baseLapTime: 124.8,
  },
  'lightweight-450': {
    id: 'lightweight-450',
    name: 'Lightweight Agile 450cc',
    manufacturer: 'Spectre',
    horsepower: 46,
    weight: 54,
    yearlyLeaseCost: 440000,
    description: 'Minimum weight, pure handling response, fragile under extreme load.',
    ovrBonus: { styleOrScrub: 2, technicalLine: 1, raceEndurance: -1 },
    reliability: 82,
    baseLapTime: 126.2,
  },
  'economy-450': {
    id: 'economy-450',
    name: 'Economy Baseline 450cc',
    manufacturer: 'ATK',
    horsepower: 44,
    weight: 62,
    yearlyLeaseCost: 280000,
    description: 'Budget-friendly, reliable workhorse. No OVR surprises, no frills.',
    ovrBonus: { raceEndurance: 1 },
    reliability: 95,
    baseLapTime: 127.5,
  },
  'prototype-450': {
    id: 'prototype-450',
    name: 'Prototype Premium 450cc',
    manufacturer: 'Spectre',
    horsepower: 51,
    weight: 57,
    yearlyLeaseCost: 600000,
    description: 'Cutting-edge all-rounder. Elite tech, minimal penalty, maximum flexibility.',
    ovrBonus: { styleOrScrub: 1, technicalLine: 1, startGateJump: 1, raceEndurance: 1, trackAwareness: 1 },
    reliability: 91,
    baseLapTime: 122.0,
  },
};

// ============================================================================
// CHASSIS (11 Options)
// ============================================================================

export const CHASSIS: Record<ChassisId, Chassis> = {
  'yamaha-star-racing': {
    id: 'yamaha-star-racing',
    name: 'Yamaha Star Racing Aluminum Twin-Spar',
    manufacturer: 'Yamaha',
    weight: 58,
    yearlyLeaseCost: 310000,
    description: 'Hydroformed aluminum with predictable high-speed flex. Rails handle ruts perfectly.',
    strengths: ['Predictable high-speed flex', 'Tracks through ruts like rails'],
    weaknesses: ['Severe cornering resistance', 'Wide frame limits tight lines'],
    ovrBonus: { technicalLine: 1 },
    rigidity: 45,
    compatibleEngines: ['full-spec-450', 'mid-range-450', 'hybrid-450'],
  },
  'honda-hrc': {
    id: 'honda-hrc',
    name: 'Honda HRC Ultra-Narrow Aluminum Perimeter',
    manufacturer: 'Honda',
    weight: 54,
    yearlyLeaseCost: 295000,
    description: 'Narrowest frame on grid. Razor-sharp turn-in, brutal on square-edge bumps.',
    strengths: ['Razor-sharp turn-in', 'Tiny profile on tight lines'],
    weaknesses: ['Deflection on square-edge bumps', 'Poor bump absorption'],
    ovrBonus: { startGateJump: 1, technicalLine: 2 },
    rigidity: 75,
    compatibleEngines: ['street-derived-450', 'mid-range-450', 'womens-450'],
  },
  'ktm-red-bull': {
    id: 'ktm-red-bull',
    name: 'KTM Red Bull Polished Chromoly Steel Spine',
    manufacturer: 'KTM',
    weight: 61,
    yearlyLeaseCost: 280000,
    description: 'Progressive energy absorption via steel. Flawless rut handling, frame softens over race.',
    strengths: ['Progressive energy absorption', 'Handles heavy landings'],
    weaknesses: ['High-speed frame stretch', 'Rear tire vagueness in heat'],
    ovrBonus: { raceEndurance: 2 },
    rigidity: 50,
    compatibleEngines: ['torque-450', 'over-rev-450', 'hybrid-450'],
  },
  'kawasaki-monster': {
    id: 'kawasaki-monster',
    name: 'Kawasaki Monster Energy Heavy-Gauge Aluminum',
    manufacturer: 'Kawasaki',
    weight: 64,
    yearlyLeaseCost: 265000,
    description: 'Massive, heavy-walled spars. Plows straight, sluggish side-to-side.',
    strengths: ['Unshakable straight-line tracking', 'Destroys whoops'],
    weaknesses: ['Slow side-to-side transition', 'Heavy structural bias'],
    ovrBonus: { raceEndurance: 1 },
    rigidity: 85,
    compatibleEngines: ['full-spec-450', 'torque-450', 'hybrid-450'],
  },
  'husqvarna-factory': {
    id: 'husqvarna-factory',
    name: 'Husqvarna Chromoly with Composite Subframe',
    manufacturer: 'Husqvarna',
    weight: 59,
    yearlyLeaseCost: 250000,
    description: 'Tailored rear-end flex via polyamide. Launches beautifully, fragile on crashes.',
    strengths: ['Tailored rear-end flex', 'Jump assistance'],
    weaknesses: ['Fragile composite mounts', 'Expensive swaps after crashes'],
    ovrBonus: { styleOrScrub: 1, technicalLine: 1 },
    rigidity: 55,
    compatibleEngines: ['street-derived-450', 'mid-range-450', 'womens-450'],
  },
  'triumph-factory': {
    id: 'triumph-factory',
    name: 'Triumph Spine-Blended Aluminum',
    manufacturer: 'Triumph',
    weight: 57,
    yearlyLeaseCost: 240000,
    description: 'Mimic steel forgiveness in aluminum. Neutral, balanced, no super-weapons.',
    strengths: ['Neutral geometric compliance', 'Easy to tune for any rider'],
    weaknesses: ['No specialized trait strength', 'Jack-of-all-trades'],
    ovrBonus: { technicalLine: 1 },
    rigidity: 60,
    compatibleEngines: ['street-derived-450', 'mid-range-450', 'hybrid-450'],
  },
  'spectre-lattice': {
    id: 'spectre-lattice',
    name: 'Spectre Ultra-Rigid Aero-Grade Chromoly Lattice',
    manufacturer: 'Spectre',
    weight: 63,
    yearlyLeaseCost: 270000,
    description: 'Cold-drawn lattice web. Zero flex, perfect for rotary power, brutal feedback.',
    strengths: ['Absolute structural defiance', '100% torque transfer to rear tire'],
    weaknesses: ['Brutal rider feedback', 'Requires perfect suspension setup'],
    ovrBonus: { startGateJump: 2, raceEndurance: 1 },
    rigidity: 95,
    compatibleEngines: ['prototype-450', 'lightweight-450'],
  },
  'gasgas-troy-lee': {
    id: 'gasgas-troy-lee',
    name: 'GasGas Troy Lee Designs Forged Aluminum-Neck Steel Spine',
    manufacturer: 'GasGas',
    weight: 55,
    yearlyLeaseCost: 220000,
    description: 'Simplified steel spine with forged aluminum junctions. Forgiving, cost-efficient.',
    strengths: ['Cost-efficient forgiveness', 'Good all-purpose platform'],
    weaknesses: ['Front-end torsion under braking', 'Junction weakness'],
    ovrBonus: {},
    rigidity: 58,
    compatibleEngines: ['economy-450', 'womens-450', 'mid-range-450'],
  },
  'ducati-factory': {
    id: 'ducati-factory',
    name: 'Ducati Monocoque Die-Cast Aluminum',
    manufacturer: 'Ducati',
    weight: 51,
    yearlyLeaseCost: 235000,
    description: 'Engine acts as stressed structural member. Lightest bike, catastrophic crash penalty.',
    strengths: ['Ultra-lightweight', 'Engine integration'],
    weaknesses: ['Catastrophic crash damage', 'Engine mount stress'],
    ovrBonus: { styleOrScrub: 2 },
    rigidity: 70,
    compatibleEngines: ['lightweight-450', 'prototype-450'],
  },
  'suzuki-rm': {
    id: 'suzuki-rm',
    name: 'Suzuki RM Classic Twin-Spar Aluminum',
    manufacturer: 'Suzuki',
    weight: 56,
    yearlyLeaseCost: 190000,
    description: "Suzuki's legendary turning blueprint. Aggressive rake, cutting inside lines.",
    strengths: ['Legendary turning archive', 'Cuts inside tight lines'],
    weaknesses: ['Severe high-speed headshake', 'Needs steering stabilizer'],
    ovrBonus: { technicalLine: 2, startGateJump: -1 },
    rigidity: 62,
    compatibleEngines: ['street-derived-450', 'womens-450'],
  },
  'beta-factory': {
    id: 'beta-factory',
    name: 'Beta Hand-Welded Perimeter Chromoly',
    manufacturer: 'Beta',
    weight: 60,
    yearlyLeaseCost: 200000,
    description: 'Off-camber flex compliance. Plants tires on hillsides, loose on jumps.',
    strengths: ['Off-camber hillside stability', 'Slick terrain plant'],
    weaknesses: ['Vague jumping telemetry', 'Loose pop off lips'],
    ovrBonus: { trackAwareness: 1 },
    rigidity: 40,
    compatibleEngines: ['torque-450', 'street-derived-450', 'womens-450'],
  },
};

// ============================================================================
// TIRES (4 Options)
// ============================================================================

export const TIRES: Record<TireId, Tire> = {
  'dust-devil': {
    id: 'dust-devil',
    name: 'Dust Devil Rubber',
    manufacturer: 'Dust Devil',
    costPerSet: 180,
    gripRating: 88,
    wearRate: 0.92, // fast wearing
    durability: 55,
    description: 'Southern California hardpack specialist. Gummy, aggressive, chunks under power.',
    strengths: ['Unmatched lean-angle bite on slick', 'Instant heat-up'],
    weaknesses: ['Chunking under high horsepower', 'Poor hardpack longevity'],
    ovrBonus: { technicalLine: 1, trackAwareness: 1 },
    bestForSurface: ['hardpack', 'sand'],
  },
  'ironclad': {
    id: 'ironclad',
    name: 'Ironclad Tire Company',
    manufacturer: 'Ironclad',
    costPerSet: 220,
    gripRating: 72,
    wearRate: 0.65, // durable
    durability: 92,
    description: 'Heavy-duty industrial tank. Puncture-proof, rigid carcass, brutal feedback.',
    strengths: ['Absolute puncture defiance', 'Heavy GNCC/rocky terrain king'],
    weaknesses: ['Brutal rigid feedback', 'Poor grip on wet clay'],
    ovrBonus: { raceEndurance: 2 },
    bestForSurface: ['loam', 'rocky'],
  },
  'parrilla': {
    id: 'parrilla',
    name: 'Parrilla Italian Elite Racing',
    manufacturer: 'Parrilla',
    costPerSet: 240,
    gripRating: 92,
    wearRate: 0.85,
    durability: 68,
    description: 'Italian precision. Dynamic center knobs, sudden breakaway zone above threshold.',
    strengths: ['Dynamic acceleration hook-up', 'Perfect holeshot traction'],
    weaknesses: ['Sudden breakaway cliff', 'Low-side crash risk'],
    ovrBonus: { startGateJump: 2, styleOrScrub: 1 },
    bestForSurface: ['loam', 'sticky'],
  },
  'michelin': {
    id: 'michelin',
    name: 'Michelin Premium Dual-Compound',
    manufacturer: 'Michelin',
    costPerSet: 280,
    gripRating: 86,
    wearRate: 0.78,
    durability: 85,
    description: 'Global powerhouse. Predictable adaptation, dual-compound, balanced everywhere.',
    strengths: ['Predictable adaptive versatility', 'All-conditions performer'],
    weaknesses: ['Establishment premium pricing', 'No standout advantage'],
    ovrBonus: { trackAwareness: 1 },
    bestForSurface: ['loam', 'sand', 'hardpack', 'wet'],
  },
};

// Utility: calculate total bike cost for engine + chassis combo
export function calculateBikeBuildCost(engineId: EngineId, chassisId: ChassisId): number {
  const engine = ENGINES[engineId];
  const chassis = CHASSIS[chassisId];
  if (!engine || !chassis) return 0;
  return engine.yearlyLeaseCost + chassis.yearlyLeaseCost;
}

// Utility: get combined OVR bonus from engine + chassis
export function calculateBikeOVRBase(engineId: EngineId, chassisId: ChassisId): OVRDelta {
  const engine = ENGINES[engineId];
  const chassis = CHASSIS[chassisId];
  if (!engine || !chassis) return {};

  const result: OVRDelta = {};
  const bonuses = [engine.ovrBonus, chassis.ovrBonus];

  for (const bonus of bonuses) {
    if (bonus.styleOrScrub) result.styleOrScrub = (result.styleOrScrub ?? 0) + bonus.styleOrScrub;
    if (bonus.technicalLine) result.technicalLine = (result.technicalLine ?? 0) + bonus.technicalLine;
    if (bonus.startGateJump) result.startGateJump = (result.startGateJump ?? 0) + bonus.startGateJump;
    if (bonus.raceEndurance) result.raceEndurance = (result.raceEndurance ?? 0) + bonus.raceEndurance;
    if (bonus.trackAwareness) result.trackAwareness = (result.trackAwareness ?? 0) + bonus.trackAwareness;
  }

  return result;
}
