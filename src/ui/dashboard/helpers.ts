// Dashboard helpers

import type { ClassId } from '../../data/types';

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
    default:
      return '#666';
  }
}
