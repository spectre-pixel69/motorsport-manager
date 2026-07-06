// Paddock Boss brand identity — original UI language, NOT a recreation of any
// existing game's look. Core palette: Inferno Red / Carbon Black /
// Championship Chrome, with per-discipline accent systems.

export const BRAND = {
  gameName: 'Paddock Boss',
  tagline: 'Run the team. Own the sport.',

  // Core palette
  infernoRed: '#e2261f',
  carbonBlack: '#101214',
  carbonPanel: '#181b1f',
  carbonEdge: '#23272d',
  chrome: '#c9d1d9',
  chromeDim: '#8b949e',
  chromeBright: '#f0f4f8',

  // Signal colors
  gold: '#e8b23a',
  green: '#3fb950',
  amber: '#d29922',
  danger: '#f85149',
  blue: '#4493f8',

  // Discipline accents
  gpAccent: '#e2261f',      // Inferno Red — Grand Prix
  sbkAccent: '#4493f8',     // Chrome Blue — Superbike
  namcAccent: '#e8842a',    // Dirt Orange — NAMC motocross
} as const;

export const DISCIPLINE_META = {
  gp: { name: 'Grand Prix World Series', short: 'GP', accent: BRAND.gpAccent, blurb: 'Prototype road racing. The glamour pyramid: GP3 to GP1.' },
  sbk: { name: 'World Superbike Series', short: 'SBK', accent: BRAND.sbkAccent, blurb: 'Production-based road racing. SS300 to World Superbike.' },
  namc: { name: 'North American Motocross Championship', short: 'NAMC', accent: BRAND.namcAccent, blurb: 'Two championships. Four classes. Twenty-four rounds. Charter racing.' },
} as const;
