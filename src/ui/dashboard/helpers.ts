// Dashboard helpers

import type { ClassId, DisciplineId } from '../../data/types';
import { CLASSES } from '../../data/classes';

// Map classes to their championships.
// NAMC v15.1: ALL four classes race in the single S4 championship.
// (The parallel 2S championship is future DLC.)
export function getChampionshipForClass(classId: ClassId): 'fourStroke' | 'twoStroke' | 'road' {
  switch (classId) {
    case 'c350':
    case 'c250':
    case 'c250p':
    case 'women':
      return 'fourStroke';
    default:
      return 'road';
  }
}

export function getClassColor(classId: ClassId): string {
  switch (classId) {
    case 'c350':
      return '#FF9800'; // Orange
    case 'c250':
      return '#2196F3'; // Blue
    case 'c250p':
      return '#E91E63'; // Pink/Red
    case 'women':
      return '#9C27B0'; // Purple
    // GP ladder (Inferno Red family — top tier brightest, junior tiers dimmer)
    case 'gp1':
      return '#e2261f';
    case 'gp2':
      return '#ef5b4f';
    case 'gp3':
      return '#f5928a';
    // SBK ladder (Chrome Blue family)
    case 'sbk':
      return '#4493f8';
    case 'ss600':
      return '#7cb3fa';
    case 'ss300':
      return '#a9cdfb';
    default:
      return '#666';
  }
}

/** This discipline's class ladder, top division first (CLASSES sorted by tier). */
export function classLadderFor(discipline: DisciplineId): ClassId[] {
  return CLASSES.filter(c => c.discipline === discipline)
    .sort((a, b) => a.tier - b.tier)
    .map(c => c.id);
}
