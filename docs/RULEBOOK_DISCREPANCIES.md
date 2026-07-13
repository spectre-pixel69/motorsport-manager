# NAMC Rulebook Discrepancy Log

Running list of places where the game (or its docs) got the rules wrong, so we
can go back to the rulebook and see where the misreadings came from. Add an
entry every time we catch one. Do NOT delete entries after fixing — the point
is the audit trail.

Status meanings:
- **FIXED** — code now matches the correct rule
- **DOC-ONLY** — code was right, documentation (CLAUDE.md) was wrong
- **VERIFY** — implementation and spec disagree; need the rulebook open to settle it

---

## 1. Stadium/outdoor calendar split — FIXED

- **What was built:** 24-round season, rounds 1-12 in stadiums + rounds 13-24
  outdoor. Code comment cited "rulebook 10.3" for the split. CLAUDE.md repeated
  it as "Rounds 1-12: Stadium (mixed terrain), Rounds 13-20: Outdoor nationals."
- **Correct rule:** NAMC is a 20-round, ALL-OUTDOOR championship. No stadium
  rounds at all.
- **Rulebook section to re-check:** 10.3 (calendar). Whatever was read as a
  stadium/outdoor split needs a second look.
- **Fixed in:** `src/data/namc.ts` (NAMC_ROUNDS 24 → 20), `src/data/universe.ts`
  (calendar builder uses outdoor venues only).
- **Leftovers to clean up:** `NAMC_STADIUMS` still exists in `src/data/parody.ts`
  with the stale "rounds 1-12" comment; stadium tracks still generated into the
  universe (unused by the calendar); `RACE_MINUTES.stadium` entries in
  `src/data/namc.ts`; stale comment on `CalendarRound` in `src/data/types.ts`
  ("rounds 1-12 stadium, 13-24 outdoor").

## 2. F1-style championship points — DOC-ONLY

- **What the docs claimed:** CLAUDE.md "locked specifications" listed F1-style
  points (25, 20, 18, 16, ...).
- **Correct rule:** NAMC Main Race points run 40 down to 1 (P1 = 40 pts ...
  P40 = 1 pt), per rulebook 3.9. The code in `src/data/classes.ts`
  (`NAMC_POINTS`) already did this correctly.
- **Action:** CLAUDE.md locked-spec section needs rewriting; re-check
  rulebook 3.9 / 11.0 to confirm the 40→1 table and any DNF minimum
  (code currently gives DNF in the Main 1 pt minimum).

## 3. Two parallel championships (4S + 2S) running now — FIXED

- **What was built:** Both a fourStroke and a twoStroke championship simulated
  every round; 6 dual-charter orgs fielding a team in each championship + 14
  single-charter teams per championship (cited "rulebook 11.4 dual-charter
  constructors championship"). UI tabs showed both championships.
- **Correct rule:** Current game is the S4-only championship. The 2S parallel
  championship is FUTURE content (DLC), not launch content.
- **Rulebook section to re-check:** 11.4 (dual-charter) and wherever the 2S
  championship is described — confirm whether the rulebook presents it as
  active or planned.
- **Fixed in:** `src/data/universe.ts` (builds 20 S4 charters only),
  `src/game/state.ts` (round runner), `src/ui/Hub.tsx`, `src/ui/Standings.tsx`,
  `src/ui/dashboard/helpers.ts`.
- **Kept for DLC:** `twoStroke` in the `ChampionshipId` type, `dualCharter`
  team fields, manufacturer `strokes` ratings, purse split plumbing.

## 4. Class → championship mapping — FIXED

- **What was built:** Dashboard helper mapped 250 / 125 (250P) / Women's
  classes to the twoStroke championship, leaving only the 350 class in
  fourStroke.
- **Correct rule:** All four classes (350, 250, 250P/125, Women's) race inside
  the single S4 championship. A class's engine type is flavor, not its
  championship.
- **Fixed in:** `src/ui/dashboard/helpers.ts` (`getChampionshipForClass`).

## 5. Empty fourStroke grids from the hand-authored rider file — FIXED

- **What was built:** Universe builder tried to fill teams from the
  hand-authored `src/data/riders.ts` (advertised as "160 NAMC riders,
  4 classes × 20 teams"). The file actually contained 75 riders (27 4S / 48 2S),
  block headers that don't match the four class IDs, and most riders had no
  `classId` — so every fourStroke race grid came up empty and the sim crashed
  on race day.
- **Root cause:** The rider file was authored against the wrong championship
  structure (see items 3 & 4), which traces back to the same rulebook
  misreading.
- **Fixed in:** `src/data/universe.ts` — predefined-rider path removed; all
  riders go through `makeRider()` (guarantees class, unique number per
  class+championship per rulebook 6.2, salary floor, gate profile).
  `riders.ts` is retained (unwired) as raw material for the future 2S DLC.

## 6. Weekend format: A/B split vs unified 40-man gate — FIXED

- **What was built:** `src/sim/weekend.ts` ran hot-lap qualifying → A/B split
  (top 20 / bottom 20) → Race 1 + Race 2 qualifying races → separate B-Main and
  A-Main (20 riders each), citing "rulebook 3.x". Points 1-40 assigned across
  A-Main then B-Main finishers.
- **Ruling (boss, 2026-07-13):** The A/B-Main structure is the OLD rule from
  the two-stroke/four-stroke days. Current format: hot-lap qualifying (fastest
  qualifier picks his gate first) → one MAIN RACE on a unified 40-rider single
  gate. No motos, no relegation. Much simpler race weekend across all four
  classes.
- **Root cause to check in rulebook:** section 3.x was read from an outdated
  edition — verify v15.1 replaced the A/B format.
- **Fixed in:** `src/sim/weekend.ts` (runNamcWeekend rewritten),
  `src/data/namc.ts` (A_MAIN_SIZE removed).

## 7. 125-class purse table doesn't sum to its stated total — PARTIALLY RESOLVED

- **Class identity resolved (boss, 2026-07-13):** The table the rulebook labels
  "125" belongs to the **250P Restricted** class — a 250 tuned down to 125-spec
  output; the "P" denotes the restriction. Not a separate 125cc class.
- **Still open:** the arithmetic. The table sums to $385,250 per round but the
  rulebook states the total as $341,200. Re-check 5.10.1 to decide which number
  is authoritative — this looks like an error in the rulebook itself.

## 8. Class naming: "125 Class" vs "250P Restricted" — FIXED

- **What was built:** Code displayed the third class as "125 Class"
  (shortName "125"), reading rulebook 3.1 literally.
- **Ruling (boss, 2026-07-13):** Official class is **250P Restricted**
  (shortName "250P") — a 250 machine restricted to 125-spec output.
- **Fixed in:** `src/data/classes.ts` (display name + shortName). Internal
  class id stays `c125` for save/key compatibility.
- **Rulebook section to re-check:** 3.1 — see whether the rulebook's own
  wording caused the misread.

---

**How to add an entry:** what was built, what the correct rule is, which
rulebook section to re-check, where it was fixed (files), and status.
