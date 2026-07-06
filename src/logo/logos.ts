// Logo system: 30 base SVG marks x containers x styles x colors.
// Every mark is an original vector shape drawn in-code (24x24 viewbox paths).

import type { LogoSpec } from '../data/types';
import { mulberry32, hashString, irange, pick, type RNG } from '../util/rng';

export interface Mark { id: number; name: string; path: string; }

// 30 original emblems, 24x24 coordinate space.
export const MARKS: Mark[] = [
  { id: 0, name: 'Bolt', path: 'M13 2 L6 13 L11 13 L9 22 L18 9 L12.5 9 Z' },
  { id: 1, name: 'Wing', path: 'M2 14 C6 6 14 4 22 5 L18 8 L21 9 L16 11 L19 13 L13 14 C9 16 5 16 2 14 Z' },
  { id: 2, name: 'Shield Cross', path: 'M12 2 L20 5 V12 C20 17 16 20 12 22 C8 20 4 17 4 12 V5 Z M10.5 7 H13.5 V10.5 H17 V13.5 H13.5 V17 H10.5 V13.5 H7 V10.5 H10.5 Z' },
  { id: 3, name: 'Piston', path: 'M8 2 H16 V6 H14 V10 L17 13 V22 H7 V13 L10 10 V6 H8 Z' },
  { id: 4, name: 'Star', path: 'M12 2 L14.8 8.2 L21.5 9 L16.6 13.6 L18 20.3 L12 17 L6 20.3 L7.4 13.6 L2.5 9 L9.2 8.2 Z' },
  { id: 5, name: 'Gear', path: 'M12 2 L14 5 L17.5 4 L17.5 7.6 L21 9 L18.8 12 L21 15 L17.5 16.4 L17.5 20 L14 19 L12 22 L10 19 L6.5 20 L6.5 16.4 L3 15 L5.2 12 L3 9 L6.5 7.6 L6.5 4 L10 5 Z M12 9 A3 3 0 1 0 12 15 A3 3 0 1 0 12 9 Z' },
  { id: 6, name: 'Wolf', path: 'M4 4 L9 8 L12 6 L15 8 L20 4 L19 11 L21 14 L16 15 L12 21 L8 15 L3 14 L5 11 Z M9.5 11 A1 1 0 1 0 9.5 13 A1 1 0 1 0 9.5 11 Z M14.5 11 A1 1 0 1 0 14.5 13 A1 1 0 1 0 14.5 11 Z' },
  { id: 7, name: 'Flame', path: 'M12 2 C14 6 18 8 18 13 A6 6 0 0 1 6 13 C6 10 8 8.5 9 6.5 C9.6 8 11 9 12 9.5 C11 7 11 4.5 12 2 Z' },
  { id: 8, name: 'Mountain', path: 'M2 19 L9 6 L12 11 L15 4 L22 19 Z M9 10.5 L6.5 15 H11 Z' },
  { id: 9, name: 'Eagle', path: 'M12 4 L14 8 L22 6 L16 11 L20 12 L14 14 L15 21 L12 16 L9 21 L10 14 L4 12 L8 11 L2 6 L10 8 Z' },
  { id: 10, name: 'Chevrons', path: 'M4 4 L10 4 L16 12 L10 20 L4 20 L10 12 Z M12 4 L15 4 L21 12 L15 20 L12 20 L18 12 Z' },
  { id: 11, name: 'Rattler', path: 'M6 20 C2 16 6 12 10 13 C14 14 16 12 14 10 C12 8 8 9 7 6 C10 2 18 3 19 8 C20 13 14 15 12 16 C10 17 12 19 15 18 L14 21 C10 23 8 22 6 20 Z M16 6.5 A1 1 0 1 0 18 6.5 A1 1 0 1 0 16 6.5 Z' },
  { id: 12, name: 'Crown', path: 'M3 8 L8 11 L12 4 L16 11 L21 8 L19 18 L5 18 Z' },
  { id: 13, name: 'Arrow', path: 'M12 2 L20 12 L14.5 12 L14.5 22 L9.5 22 L9.5 12 L4 12 Z' },
  { id: 14, name: 'Scorpion', path: 'M5 3 C8 6 8 9 11 10 L13 10 C16 9 16 6 19 3 L18 8 C17 11 15 12 13 13 L13 15 C16 15 18 17 18 20 L15 19 C15 17.5 14 17 12.5 17 L11.5 17 C10 17 9 17.5 9 19 L6 20 C6 17 8 15 11 15 L11 13 C9 12 7 11 6 8 Z' },
  { id: 15, name: 'Spade', path: 'M12 2 C15 6 20 9 20 13 A4.5 4.5 0 0 1 13 16.5 C13 18.5 14 20 15.5 21 L8.5 21 C10 20 11 18.5 11 16.5 A4.5 4.5 0 0 1 4 13 C4 9 9 6 12 2 Z' },
  { id: 16, name: 'Skull', path: 'M12 3 A7 7 0 0 1 19 10 C19 13 17.5 14.5 16 15.5 L16 18 L8 18 L8 15.5 C6.5 14.5 5 13 5 10 A7 7 0 0 1 12 3 Z M8.5 9 A1.8 1.8 0 1 0 12.1 9 A1.8 1.8 0 1 0 8.5 9 Z M11.9 9 A1.8 1.8 0 1 0 15.5 9 A1.8 1.8 0 1 0 11.9 9 Z M10 19 H14 L14 21 L10 21 Z' },
  { id: 17, name: 'Rocket', path: 'M12 2 C15 4 16 8 16 12 L18 16 L14 15 C13.5 16 10.5 16 10 15 L6 16 L8 12 C8 8 9 4 12 2 Z M12 6 A1.5 1.5 0 1 0 12 9 A1.5 1.5 0 1 0 12 6 Z M9 17 L12 22 L15 17 Z' },
  { id: 18, name: 'Trident', path: 'M11 2 H13 V6 C16 6 18 4 18 2 L20 2 C20 6 17 8 13 8 V18 L16 15 L17.5 16.5 L12 22 L6.5 16.5 L8 15 L11 18 V8 C7 8 4 6 4 2 L6 2 C6 4 8 6 11 6 Z' },
  { id: 19, name: 'Hex Nut', path: 'M7 3 H17 L22 12 L17 21 H7 L2 12 Z M12 8 A4 4 0 1 0 12 16 A4 4 0 1 0 12 8 Z' },
  { id: 20, name: 'Lightning Orb', path: 'M12 2 A10 10 0 1 0 12 22 A10 10 0 1 0 12 2 Z M13 5 L8 13 L11.5 13 L10 19 L16 11 L12.5 11 Z' },
  { id: 21, name: 'Bull', path: 'M4 3 C7 5 9 5 12 5 C15 5 17 5 20 3 C21 6 19 9 16 9 L17 13 L12 21 L7 13 L8 9 C5 9 3 6 4 3 Z M10 11 A1 1 0 1 0 10 13 A1 1 0 1 0 10 11 Z M14 11 A1 1 0 1 0 14 13 A1 1 0 1 0 14 11 Z' },
  { id: 22, name: 'Checker Flag', path: 'M4 2 H6 V22 H4 Z M7 3 H21 L18 8 L21 13 H7 Z M9 5 H12 V8 H9 Z M15 5 H18 V8 H15 Z M12 8 H15 V11 H12 Z' },
  { id: 23, name: 'Phoenix', path: 'M12 3 C10 7 6 8 3 8 C6 10 8 10 10 10 C8 12 5 13 3 13 C6 14 9 14 11 13 L12 21 L13 13 C15 14 18 14 21 13 C19 13 16 12 14 10 C16 10 18 10 21 8 C18 8 14 7 12 3 Z' },
  { id: 24, name: 'Diamond', path: 'M7 3 H17 L22 9 L12 21 L2 9 Z M9 5 L7.5 8.5 H11 Z M13 5 L14.5 8.5 L16.5 8.5 Z M12 6 L10.5 8.5 H13.5 Z' },
  { id: 25, name: 'Cobra Hood', path: 'M12 2 C17 2 20 6 20 11 C20 16 17 18 15 19 L16 22 L12 20 L8 22 L9 19 C7 18 4 16 4 11 C4 6 7 2 12 2 Z M9 9 A1.4 1.4 0 1 0 12 9 A1.4 1.4 0 1 0 9 9 Z M12 9 A1.4 1.4 0 1 0 15 9 A1.4 1.4 0 1 0 12 9 Z M11 13 H13 L12 15.5 Z' },
  { id: 26, name: 'Anchor V', path: 'M12 2 L15 5 L13 5 L13 16 C16 15 18 13 18 10 L21 10 C21 15 17 19 13 20 L12 22 L11 20 C7 19 3 15 3 10 L6 10 C6 13 8 15 11 16 L11 5 L9 5 Z' },
  { id: 27, name: 'Twin Pipes', path: 'M3 16 C8 14 10 8 12 5 L15 5 C13 9 11 14 8 17 Z M8 19 C13 17 15 11 17 8 L20 8 C18 12 16 17 13 20 Z' },
  { id: 28, name: 'Iron Fist', path: 'M8 4 H11 V8 H8 Z M11.5 3 H14.5 V8 H11.5 Z M15 4 H18 V8 H15 Z M7 9 H19 L18 15 C18 18 16 20 13 20 L11 20 C8 20 6.5 18 6.5 15 Z' },
  { id: 29, name: 'Sunburst', path: 'M12 7 A5 5 0 1 0 12 17 A5 5 0 1 0 12 7 Z M11 2 H13 V5 H11 Z M11 19 H13 V22 H11 Z M2 11 H5 V13 H2 Z M19 11 H22 V13 H19 Z M4.2 5.6 L5.6 4.2 L7.7 6.3 L6.3 7.7 Z M16.3 17.7 L17.7 16.3 L19.8 18.4 L18.4 19.8 Z M18.4 4.2 L19.8 5.6 L17.7 7.7 L16.3 6.3 Z M6.3 16.3 L7.7 17.7 L5.6 19.8 L4.2 18.4 Z' },
];

export const CONTAINERS = ['none', 'shield', 'roundel', 'hex', 'badge', 'banner'] as const;
export const STYLES = ['flat', 'outline', 'duotone', 'stripe'] as const;

export const LOGO_PALETTES: [string, string, string][] = [
  ['#e2261f', '#101214', '#f0f4f8'], ['#f07000', '#12294a', '#ffffff'],
  ['#1a49c4', '#0d0f12', '#e8b23a'], ['#3fb950', '#101214', '#f0f4f8'],
  ['#e8b23a', '#101214', '#e2261f'], ['#8a2be2', '#101214', '#3fe0c8'],
  ['#00b3ad', '#0e2a3a', '#f0a020'], ['#c8102e', '#e8e8e8', '#101214'],
  ['#ffd400', '#101214', '#e2261f'], ['#2f9de0', '#ffffff', '#0e2a3a'],
  ['#59c118', '#101214', '#e8e8e8'], ['#d4af37', '#3a2408', '#ffffff'],
  ['#e8842a', '#221408', '#f0f4f8'], ['#c96a1e', '#101214', '#25a2d8'],
  ['#8a1520', '#e8d8c0', '#101214'], ['#25a2d8', '#0d1a24', '#e2261f'],
];

export function randomLogo(rng: RNG, initials: string): LogoSpec {
  const [primary, secondary, accent] = pick(rng, LOGO_PALETTES);
  return {
    markId: irange(rng, 0, MARKS.length - 1),
    containerId: irange(rng, 0, CONTAINERS.length - 1),
    styleId: irange(rng, 0, STYLES.length - 1),
    primary, secondary, accent,
    initials: initials.slice(0, 3).toUpperCase(),
  };
}

export function seededLogo(key: string, initials: string, primary?: string, secondary?: string): LogoSpec {
  const rng = mulberry32(hashString(key));
  const spec = randomLogo(rng, initials);
  if (primary) spec.primary = primary;
  if (secondary) spec.secondary = secondary;
  return spec;
}

/** Render a LogoSpec to an SVG string (usable via innerHTML or data URL). */
export function logoSVG(spec: LogoSpec, size = 64): string {
  if (spec.custom) {
    return `<image href="${spec.custom}" width="24" height="24" preserveAspectRatio="xMidYMid meet"/>`;
  }
  const mark = MARKS[spec.markId % MARKS.length];
  const container = CONTAINERS[spec.containerId % CONTAINERS.length];
  const style = STYLES[spec.styleId % STYLES.length];
  const { primary, secondary, accent } = spec;

  let bg = '';
  switch (container) {
    case 'shield': bg = `<path d="M12 0.5 L23 4 V13 C23 18.5 18 22 12 23.8 C6 22 1 18.5 1 13 V4 Z" fill="${secondary}" stroke="${accent}" stroke-width="1"/>`; break;
    case 'roundel': bg = `<circle cx="12" cy="12" r="11.4" fill="${secondary}" stroke="${accent}" stroke-width="1.2"/>`; break;
    case 'hex': bg = `<path d="M6.5 1.2 H17.5 L23 12 L17.5 22.8 H6.5 L1 12 Z" fill="${secondary}" stroke="${accent}" stroke-width="1"/>`; break;
    case 'badge': bg = `<rect x="1" y="1" width="22" height="22" rx="4.5" fill="${secondary}" stroke="${accent}" stroke-width="1"/>`; break;
    case 'banner': bg = `<path d="M1 2 H23 V17 L12 22.5 L1 17 Z" fill="${secondary}" stroke="${accent}" stroke-width="1"/>`; break;
  }

  const inset = container === 'none' ? '' : 'transform="translate(3.6 3.3) scale(0.7)"';
  let markEl = '';
  switch (style) {
    case 'flat': markEl = `<path d="${mark.path}" fill="${primary}" ${inset}/>`; break;
    case 'outline': markEl = `<path d="${mark.path}" fill="none" stroke="${primary}" stroke-width="1.6" stroke-linejoin="round" ${inset}/>`; break;
    case 'duotone': markEl = `<g ${inset}><path d="${mark.path}" fill="${primary}"/><path d="${mark.path}" fill="${accent}" transform="translate(1 1)" opacity="0.35"/></g>`; break;
    case 'stripe': markEl = `<g ${inset}><defs><clipPath id="mk${spec.markId}${spec.containerId}"><path d="${mark.path}"/></clipPath></defs><path d="${mark.path}" fill="${primary}"/><rect x="0" y="9" width="24" height="2.4" fill="${accent}" clip-path="url(#mk${spec.markId}${spec.containerId})"/><rect x="0" y="13" width="24" height="1.4" fill="${accent}" clip-path="url(#mk${spec.markId}${spec.containerId})" opacity="0.7"/></g>`; break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">${bg}${markEl}</svg>`;
}

export function logoDataURL(spec: LogoSpec, size = 64): string {
  return `data:image/svg+xml,${encodeURIComponent(logoSVG(spec, size))}`;
}
