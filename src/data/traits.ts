// Rider Traits — positive and negative characteristics
// ~20% of field carries ≥1 trait; surface clearly on rider card

import type { RiderTrait } from './types';

export interface TraitDefinition {
  id: RiderTrait;
  name: string;
  category: 'positive' | 'negative';
  description: string;
  effects: Record<string, number | boolean>;
  rarity: 'common' | 'uncommon' | 'rare';
}

export const TRAIT_DEFS: Record<RiderTrait, TraitDefinition> = {
  'wet-master': {
    id: 'wet-master',
    name: 'Wet Master',
    category: 'positive',
    description: 'Thrives in rain; wet weather performance significantly improved',
    effects: {
      'wet-bonus': 15, // +15 to wet skill in rain
      'rain-crash-resist': 10,
    },
    rarity: 'uncommon',
  },

  'holeshot-king': {
    id: 'holeshot-king',
    name: 'Holeshot King',
    category: 'positive',
    description: 'Explosive launch ability; starts are effectively +10',
    effects: {
      'starts-bonus': 10,
    },
    rarity: 'uncommon',
  },

  'late-braker': {
    id: 'late-braker',
    name: 'Late Braker',
    category: 'positive',
    description: 'Aggressive corner entry; braking effectively +8',
    effects: {
      'braking-bonus': 8,
      'corner-speed-bonus': 5,
    },
    rarity: 'uncommon',
  },

  'ice-veins': {
    id: 'ice-veins',
    name: 'Ice Veins',
    category: 'positive',
    description: 'Clutch performer; skills rise in final 3 laps or last moto of a race',
    effects: {
      'late-race-boost': 12, // +12 all skills in final laps
    },
    rarity: 'rare',
  },

  'development-guru': {
    id: 'development-guru',
    name: 'Development Guru',
    category: 'positive',
    description: 'Exceptional feedback; R&D gains from this rider ×1.5',
    effects: {
      'feedback-multiplier': 1.5,
    },
    rarity: 'rare',
  },

  'fan-favorite': {
    id: 'fan-favorite',
    name: 'Fan Favorite',
    category: 'positive',
    description: 'Marketable personality; sponsor income +20%',
    effects: {
      'sponsor-income-bonus': 0.2,
      'morale-boost-allies': 5,
    },
    rarity: 'uncommon',
  },

  'fragile': {
    id: 'fragile',
    name: 'Fragile',
    category: 'negative',
    description: 'Injury-prone; crash/injury chance ×1.5',
    effects: {
      'injury-chance-multiplier': 1.5,
      'crash-multiplier': 1.5,
    },
    rarity: 'uncommon',
  },

  'reckless': {
    id: 'reckless',
    name: 'Reckless',
    category: 'negative',
    description: 'Aggressive but risky; faster pace but crash chance + AND part-stress ×1.15',
    effects: {
      'pace-bonus': 5,
      'crash-multiplier': 1.3,
      'part-failure-multiplier': 1.15,
    },
    rarity: 'uncommon',
  },

  'slow-starter': {
    id: 'slow-starter',
    name: 'Slow Starter',
    category: 'negative',
    description: 'Poor launch; starts effectively −8',
    effects: {
      'starts-penalty': -8,
    },
    rarity: 'common',
  },
};

export function getTraitDef(traitId: RiderTrait): TraitDefinition {
  return TRAIT_DEFS[traitId];
}

export function applyTraitEffects(
  baseValue: number,
  trait: RiderTrait,
  effectKey: string,
): number {
  const def = TRAIT_DEFS[trait];
  const effect = def.effects[effectKey];

  if (typeof effect === 'number') {
    if (effectKey.includes('multiplier')) {
      return baseValue * effect;
    }
    return baseValue + effect;
  }

  return baseValue;
}

// Get random trait for roster generation
export function randomTrait(rng?: () => number): RiderTrait | null {
  const rng_ = rng ?? Math.random;
  const roll = rng_() * 100;

  // ~20% of riders get a trait
  if (roll > 20) return null;

  const allTraits = Object.keys(TRAIT_DEFS) as RiderTrait[];
  return allTraits[Math.floor(rng_() * allTraits.length)];
}
