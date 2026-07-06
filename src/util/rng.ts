// Seeded RNG (mulberry32) — deterministic universes & replayable sims.

export type RNG = () => number;

export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const pick = <T,>(rng: RNG, arr: readonly T[]): T =>
  arr[Math.floor(rng() * arr.length)];

export const pickN = <T,>(rng: RNG, arr: readonly T[], n: number): T[] => {
  const copy = arr.slice();
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
};

export const irange = (rng: RNG, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

/** Normal-ish distribution via sum of uniforms, clamped. */
export const gauss = (rng: RNG, mean: number, spread: number): number =>
  mean + (rng() + rng() + rng() - 1.5) * spread;

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export function shuffle<T>(rng: RNG, arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
