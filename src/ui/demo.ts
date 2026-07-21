// Demo-mode gating (Steam demo, task #17).
//
// Boss rulings (2026-07-13): the demo is ONE full 20-round season with the
// core loop fully live (races, psychology, gate picks, training, budget).
// Multi-year systems are LOCKED BUT VISIBLE — grayed doors the player walks
// past, never hidden. NON-NEGOTIABLE: the demo save carries into the full
// game unchanged (same save format/key, no conversion step).
//
// Build the demo with:  npm run build:demo  (sets VITE_DEMO=1)

export const IS_DEMO: boolean = Boolean((import.meta as any).env?.VITE_DEMO === '1');

/** Features locked in the demo. Keep in sync with task #17. */
export const DEMO_LOCKED = {
  offSeason: true,        // season rollover, the Draft, Free Agency
  rnd: true,              // bike design philosophy system
  contracts: true,        // negotiations / re-signings
} as const;

export const DEMO_END_PITCH =
  'Your season is in the books — and this is where the real game begins. ' +
  'The off-season, the NAMC Draft, free agency, contract negotiations, R&D ' +
  'bike design and multi-season careers continue in the full version of ' +
  'Paddock Boss. Your save carries over — this team, these riders, this story.';

/** Suffix for locked buttons/labels in demo builds. */
export const LOCK_TAG = ' 🔒 FULL GAME';
