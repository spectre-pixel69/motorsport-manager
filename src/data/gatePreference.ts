// Gate selection personality — assigns every rider one of 8 archetypes and
// 10 measurable gate-preference metrics, derived from their stats.
// Used by BOTH the procedural universe generator and the hand-authored
// NAMC rider list: every rider in the game gets a profile, no exceptions.

import type { GatePreferenceProfile, RiderStats } from './types';
import { irange, clamp, type RNG } from '../util/rng';

export function makeGatePreferenceProfile(rng: RNG, stats: RiderStats, traits: string[]): GatePreferenceProfile {
  // Select archetype based on rider characteristics
  const archetypes: Array<[string, number]> = [
    ['holeshot-king', stats.starts],
    ['gambler', stats.aggression],
    ['smooth-operator', stats.consistency],
    ['wet-specialist', stats.wet],
    ['track-reader', stats.pace],
    ['physical-attacker', stats.fitness],
    ['conservative', 100 - stats.aggression],
    ['developer', 50], // neutral baseline
  ];

  // Sort by score and pick top archetype with some randomness
  archetypes.sort((a, b) => b[1] - a[1]);
  const archetype = archetypes[Math.min(2, Math.floor(rng() * 3))][0] as GatePreferenceProfile['gateArchetype'];

  // Base metrics from archetype
  let profile: GatePreferenceProfile;

  switch (archetype) {
    case 'holeshot-king':
      profile = {
        holeshotPreferenceScore: clamp(stats.starts + irange(rng, -10, 15), 0, 100),
        insideOutsideBias: irange(rng, -40, -10), // inside bias
        conditionAdaptationSkill: clamp(stats.pace + irange(rng, -15, 10), 0, 100),
        riskTolerance: clamp(stats.aggression + irange(rng, -10, 20), 0, 100),
        trackTypePreference: 'balanced',
        wetWeatherGateAdjustment: clamp(50 + irange(rng, -20, 20), 0, 100),
        mentalPreparationRigor: clamp(70 + irange(rng, -15, 15), 0, 100),
        physicalGateComfort: clamp(stats.starts + irange(rng, -5, 15), 0, 100),
        dirtQualitySensitivity: clamp(stats.starts + irange(rng, 0, 20), 0, 100),
        competitiveAggressionIndex: clamp(85 + irange(rng, -10, 10), 0, 100),
        gateArchetype: archetype,
      };
      break;

    case 'gambler':
      profile = {
        holeshotPreferenceScore: clamp(stats.aggression + irange(rng, -15, 10), 0, 100),
        insideOutsideBias: irange(rng, -10, 40), // outside bias
        conditionAdaptationSkill: clamp(50 + irange(rng, -20, 20), 0, 100),
        riskTolerance: clamp(stats.aggression + irange(rng, 15, 30), 0, 100),
        trackTypePreference: 'balanced',
        wetWeatherGateAdjustment: clamp(70 + irange(rng, -20, 15), 0, 100),
        mentalPreparationRigor: clamp(40 + irange(rng, -20, 20), 0, 100),
        physicalGateComfort: clamp(50 + irange(rng, -20, 20), 0, 100),
        dirtQualitySensitivity: clamp(30 + irange(rng, -20, 30), 0, 100),
        competitiveAggressionIndex: clamp(90 + irange(rng, -10, 10), 0, 100),
        gateArchetype: archetype,
      };
      break;

    case 'smooth-operator':
      profile = {
        holeshotPreferenceScore: clamp(50 + irange(rng, -20, 20), 0, 100),
        insideOutsideBias: irange(rng, -30, 30), // balanced
        conditionAdaptationSkill: clamp(stats.consistency + irange(rng, 10, 20), 0, 100),
        riskTolerance: clamp(stats.consistency + irange(rng, -20, 10), 0, 100),
        trackTypePreference: 'loam',
        wetWeatherGateAdjustment: clamp(40 + irange(rng, -15, 25), 0, 100),
        mentalPreparationRigor: clamp(80 + irange(rng, -10, 15), 0, 100),
        physicalGateComfort: clamp(stats.consistency + irange(rng, 10, 15), 0, 100),
        dirtQualitySensitivity: clamp(75 + irange(rng, -15, 15), 0, 100),
        competitiveAggressionIndex: clamp(40 + irange(rng, -15, 20), 0, 100),
        gateArchetype: archetype,
      };
      break;

    case 'wet-specialist':
      profile = {
        holeshotPreferenceScore: clamp(50 + irange(rng, -20, 20), 0, 100),
        insideOutsideBias: irange(rng, -20, 20), // adaptable
        conditionAdaptationSkill: clamp(stats.wet + irange(rng, 15, 25), 0, 100),
        riskTolerance: clamp(stats.wet + irange(rng, -10, 20), 0, 100),
        trackTypePreference: 'clay',
        wetWeatherGateAdjustment: clamp(stats.wet + irange(rng, 20, 35), 0, 100),
        mentalPreparationRigor: clamp(70 + irange(rng, -15, 15), 0, 100),
        physicalGateComfort: clamp(stats.wet + irange(rng, 10, 20), 0, 100),
        dirtQualitySensitivity: clamp(80 + irange(rng, -10, 15), 0, 100),
        competitiveAggressionIndex: clamp(55 + irange(rng, -15, 20), 0, 100),
        gateArchetype: archetype,
      };
      break;

    case 'track-reader':
      profile = {
        holeshotPreferenceScore: clamp(60 + irange(rng, -15, 15), 0, 100),
        insideOutsideBias: irange(rng, -25, 25), // balanced
        conditionAdaptationSkill: clamp(stats.pace + irange(rng, 10, 20), 0, 100),
        riskTolerance: clamp(50 + irange(rng, -20, 20), 0, 100),
        trackTypePreference: 'balanced',
        wetWeatherGateAdjustment: clamp(65 + irange(rng, -20, 20), 0, 100),
        mentalPreparationRigor: clamp(85 + irange(rng, -10, 10), 0, 100),
        physicalGateComfort: clamp(75 + irange(rng, -10, 15), 0, 100),
        dirtQualitySensitivity: clamp(85 + irange(rng, -10, 10), 0, 100),
        competitiveAggressionIndex: clamp(60 + irange(rng, -15, 20), 0, 100),
        gateArchetype: archetype,
      };
      break;

    case 'physical-attacker':
      profile = {
        holeshotPreferenceScore: clamp(70 + irange(rng, -10, 15), 0, 100),
        insideOutsideBias: irange(rng, -15, 35), // slight outside bias
        conditionAdaptationSkill: clamp(stats.fitness + irange(rng, -10, 15), 0, 100),
        riskTolerance: clamp(75 + irange(rng, -10, 20), 0, 100),
        trackTypePreference: 'hardpack',
        wetWeatherGateAdjustment: clamp(50 + irange(rng, -20, 20), 0, 100),
        mentalPreparationRigor: clamp(60 + irange(rng, -15, 20), 0, 100),
        physicalGateComfort: clamp(stats.fitness + irange(rng, 15, 25), 0, 100),
        dirtQualitySensitivity: clamp(50 + irange(rng, -15, 20), 0, 100),
        competitiveAggressionIndex: clamp(80 + irange(rng, -10, 15), 0, 100),
        gateArchetype: archetype,
      };
      break;

    case 'conservative':
      profile = {
        holeshotPreferenceScore: clamp(30 + irange(rng, -15, 20), 0, 100),
        insideOutsideBias: irange(rng, -50, -10), // strong inside bias
        conditionAdaptationSkill: clamp(75 + irange(rng, -10, 15), 0, 100),
        riskTolerance: clamp(20 + irange(rng, -10, 20), 0, 100),
        trackTypePreference: 'loam',
        wetWeatherGateAdjustment: clamp(30 + irange(rng, -15, 25), 0, 100),
        mentalPreparationRigor: clamp(90 + irange(rng, -5, 10), 0, 100),
        physicalGateComfort: clamp(80 + irange(rng, -10, 15), 0, 100),
        dirtQualitySensitivity: clamp(70 + irange(rng, -10, 15), 0, 100),
        competitiveAggressionIndex: clamp(25 + irange(rng, -15, 25), 0, 100),
        gateArchetype: archetype,
      };
      break;

    case 'developer':
    default:
      profile = {
        holeshotPreferenceScore: clamp(50 + irange(rng, -20, 20), 0, 100),
        insideOutsideBias: irange(rng, -30, 30), // balanced
        conditionAdaptationSkill: clamp(50 + irange(rng, -15, 25), 0, 100),
        riskTolerance: clamp(50 + irange(rng, -20, 20), 0, 100),
        trackTypePreference: 'balanced',
        wetWeatherGateAdjustment: clamp(50 + irange(rng, -20, 20), 0, 100),
        mentalPreparationRigor: clamp(60 + irange(rng, -20, 25), 0, 100),
        physicalGateComfort: clamp(50 + irange(rng, -20, 20), 0, 100),
        dirtQualitySensitivity: clamp(50 + irange(rng, -20, 20), 0, 100),
        competitiveAggressionIndex: clamp(50 + irange(rng, -20, 20), 0, 100),
        gateArchetype: archetype,
      };
      break;
  }

  return profile;
}
