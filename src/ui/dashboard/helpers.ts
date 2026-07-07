// Dashboard helpers

import type { ClassId } from '../../data/types';

// Map NAMC classes to their championships
// 350 Pro: Four Stroke only
// 250, 125 (250P), Women's 250: Two Stroke
export function getChampionshipForClass(classId: ClassId): 'fourStroke' | 'twoStroke' | 'road' {
  switch (classId) {
    case 'c350':
      return 'fourStroke';
    case 'c250':
    case 'c125':
    case 'women':
      return 'twoStroke';
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
    case 'c125':
      return '#E91E63'; // Pink/Red
    case 'women':
      return '#9C27B0'; // Purple
    default:
      return '#666';
  }
}
