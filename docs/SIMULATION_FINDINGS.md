# 100 × 5-Season Simulation Study — Findings & Priority List

**Run:** 2026-07-13 · 100 independent careers × 5 seasons × 20 rounds × 4 classes
(~40,000 race weekends) · seeds 1000-1693 · harness: scratchpad `five_season_study.ts`
**Result:** 100/100 completed, zero crashes, 34s wall time.

The boss's estimate going in: ~71% done with motocross. The data agrees with the
shape of that: **the core race/season loop is solid; the connective tissue
between seasons is what's missing.**

---

## THE GOOD

1. **Stability: 100/100 five-season careers, zero exceptions.** The sim engine,
   the new 40-man gate format, psychology, and the new season rollover all
   survived every seed.
2. **Mental-state discipline held.** Across ~40,000 weekends: zero cap
   violations. Confidence/tilt stayed in bounds; the ±3-per-event and ±1% pace
   rules are respected everywhere.
3. **Champion profile is believable.** Average champion age 26.4 — right in the
   real-world prime. Titles cluster in the 24-28 window naturally because of
   the age curves.
4. **Competitive balance is reasonable at the top.** 2.94 distinct champions
   per class per 5 seasons; a 4-or-5-title dynasty appears in 17.8% of
   class-runs. Dynasties exist (they should — this sport has Jett Lawrences)
   without being the norm.
5. **Race texture:** 10.0% DNF rate per main (4 of 40 riders), ~25 injuries per
   season across the league, 21.6% wet races. All plausible starting points,
   all tunable from single constants.
6. **The rollover works** (built tonight): champions crowned, legacy plates
   awarded (gold/platinum/diamond at 1/3/5 titles), team championship purse
   paid, riders age, 32+ decline applies, injuries heal, mental states reset.

## THE BAD

1. **Champions score 746 of a possible 800 points.** To average that, the champ
   is finishing ~P2 or better in essentially every main for 20 rounds. Real
   champions have mechanicals, bad gates, 12th-place mud races. The
   skill→result mapping is too deterministic; race-to-race variance is too low.
   Tuning targets: per-lap noise, start variance, incident impact.
   *(Counter-signal: title margin averages only 36 pts, so the #2 rider is
   scoring ~710 — the whole front of the field is too metronomic, not just one
   guy.)*
2. **The talent pool is frozen.** League average overall moves 68.7 → 68.4 over
   five years. Nobody develops (training isn't wired into the loop), and decline
   is nearly invisible (0.1-0.3/season per spec). The world doesn't evolve —
   riders are the same number for half a decade.
3. **The league ages one year per year with no new blood.** Average age 24.5 →
   29.5 over five seasons. There is no rookie intake and no retirement. By
   season 10 this is a 34-year-old league in walkers. This is the single
   biggest long-play blocker.
4. **Injured starters just vanish from the gate.** `gridOf()` excludes injured
   riders and bench riders — so an injury means a 38-man gate, not a bench
   substitution. Bench riders NEVER race, despite being generated, paid
   retainers, and required by rulebook 4.8.1.

## NOT CONNECTED YET — Priority order

| # | System | State | Why it matters now |
|---|--------|-------|--------------------|
| 1 | **Season rollover UI** | `advanceSeason()` built tonight, but no off-season screen; the Hub has no "start next season" flow | The game literally ends at round 20 for a player |
| 2 | **Weekly economy settlement** | `settleNamcRound()` is a stub — purse tables, salaries, appearance fees exist as data but no money moves during a season | Budget is a core management resource that currently does nothing; only the annual team-title purse (wired tonight) moves money |
| 3 | **Rookie intake + retirement** | Nothing exists | Without it the 5+ season game dies; pairs with the Young Rider's Academy design |
| 4 | **Rider development loop** | `training.ts` is complete but only reachable from the player UI; AI teams never train; potential is never consumed | The frozen-talent problem; also the post-race skill-points design (boss ruling: earned points, rider/manager negotiated focus) |
| 5 | **Bench substitution** | Bench riders exist, never race | Injured starter should promote a bench rider (rulebook 4.8.1: 2M+1F bench) |
| 6 | **Transfer market / contract negotiation** | Contracts auto-renew forever (stopgap in rollover); `purseShareTeamPct` field exists, unused | The back-and-forth negotiation design (temperament, lockout after 2 rejections, factory leverage) is fully specced from 2026-07-13 session |
| 7 | **Per-component reliability & engine modes** | `reliability.ts`, `BikeSetup.components`, engine modes all exist; race engine uses flat `team.bike.reliability` | Parts wear, rebuilds, conserve/attack modes are dead data until the sim reads them |
| 8 | **Gate selection** | Every rider has a 10-metric profile + 8 archetypes; qualifying currently maps rank→grid slot directly | The whole point of the gate research; needs track gate-advantage data (matrix exists in scratchpad research) + pick-order logic |
| 9 | **Race variance tuning** | — | Fix the 746/800 dominance (see BAD #1) |
| 10 | **Three-strike penalties** | `team.strikes` field exists, never incremented | Rulebook system, zero enforcement |
| 11 | **Sponsors** | Generated in universe, no income or activation | Revenue stream + prestige hook |
| 12 | **Media shows** (Throttlesauce / Track Days) | Designed 2026-07-13 (task #18); psychology storyline feed already produces the content | The player-facing voice of the season |
| 13 | **Broadcast cut-in window + lip-synced hosts** | Designed 2026-07-13 (UE5.7 client feature) | See task list; depends on #12 for scripts |
| 14 | **Weather/track surface effects on gate + pace** | `weatherBias` works (21.6% wet); wet skill applies; but surface/drainage gate advantages unused | Pairs with #8 |

## Update 2026-07-16 — development loop + race-day form (task #21)

- Off-season development wired: young riders grow toward hidden potential
  (age curve x headroom x facility x coach). League overall now RISES
  68.7 → 69.0 over 5 seasons (was falling to 65.3). Rookies become stars.
- Race-day form variance added (per-rider per-race pace offset, consistency
  shrinks the swing): champion points 636 → 628 of 800.
- Dynasty rate is STRUCTURAL, not variance-driven: raising form sigma 31%
  changed nothing (40.3% → 41.3%). Dynasties happen when one rider's rating
  tops a class for an era — which is authentic motocross (Carmichael, Jett).
  If the boss wants fewer, the knob is the POTENTIAL distribution (rarer
  95+ ceilings), not more randomness. Design decision, not a bug.

## Update 2026-07-17 — BOP success ballast + real atrophy (boss rulings)

- **Success ballast** (Super GT model scaled for bikes; rulebook BOP glossary
  is the in-fiction mechanism): Main Event win +2kg, podium +1kg, P4+ sheds
  1kg, cap 8kg, ~0.07s/lap per kg, resets each season. Study: champion points
  628 → 587, title margin 73 → 61. Seasons are tighter and winners get
  hunted; era dynasties remain merit-driven (41.5%) — ballast prevents
  runaways, not eras, same as real Super GT.
- **Real atrophy**: post-32 decline steepened (~0.6/season at 32, ~1.7 at 35 —
  visible), and retirement is now performance-based: 33+ riders whose overall
  falls below 62 retire because the youth have passed them; 36 stays the
  hard stop. League avg age 25.4, quality stable.
- **Demo work HALTED** (boss ruling): no demo until all three disciplines
  ship. Routine re-aimed at fleshing out game pages.

## Update 2026-07-20 — GP/SBK dashboard build-out (task #25) + off-season gap found

- Shipped: `constructorStandingsFor(state, classId)` in `src/game/state.ts`
  (GP constructor / WorldSBK manufacturer championship per class — reads
  the `constructor:<class>` / `manufacturer:<class>` keys `applyPoints()`
  already wrote, which nothing previously read). Fixed a real bug found
  along the way: `teamStandingsFor()`'s 'road' branch read a
  `<class>:road` key that `applyPoints()` never writes for gp/sbk, so
  GP/SBK team standings — including HubScreenNew's player-team rank — were
  silently always empty; it now delegates to `constructorStandingsFor`.
- `TeamDashboard.tsx` is now discipline-aware: GP/SBK get their real
  3-tier class ladder (gp1/gp2/gp3, sbk/ss600/ss300 via new
  `classLadderFor()` in `dashboard/helpers.ts`) instead of the hardcoded
  NAMC 4-class panel grid, a discipline-labeled header instead of a fixed
  "• NAMC" string, and a new `ConstructorStandings.tsx` panel in place of
  the (NAMC-only) tire championship. `SeasonCalendar.tsx` no longer shows
  NAMC's flat $800k purse and "After Round 20" for GP (22 rounds) / SBK
  (12 rounds) — it now reads each discipline's real revenue-share model.
- **New finding, needs a boss ruling on scope/sequencing**: while fixing
  SeasonCalendar's off-season text, found that `advanceSeason()` in
  `state.ts` gates its ENTIRE roster off-season cycle — retirements,
  contract expiry, the draft-equivalent rookie intake, free agency — behind
  `if (state.discipline === 'namc')`. Only champion-crowning and per-rider
  aging/development run for gp/sbk; team-championship purse payout is also
  namc-only. Net effect: a GP or SBK career's roster is frozen forever —
  no rider ever retires, ages out, or changes teams, season after season.
  This is a full build (GP/SBK-appropriate contract expiry, retirement
  age/quality curve, a rookie-intake mechanism analogous to but distinct
  from the NAMC Draft since real MotoGP/WSBK don't have one, and free
  agency), not a dashboard-sized unit — did not attempt it unannounced.
  Priority-list item added below (#15).

## NOT CONNECTED YET — Priority order (cont'd)

| 15 | **GP/SBK off-season roster cycle** | `advanceSeason()` runs retirement/contract-expiry/draft/free-agency only for `discipline === 'namc'`; gp/sbk rosters never change season to season | Same "game dies after N seasons" problem as old #3, but for two of the three disciplines the boss ruled must ship |

## Notes for tuning sessions (numbers to revisit)

- Champion pts 746/800, margin 36 → add variance, not rubber-banding
- DNF 10%/main → watch after per-component reliability lands (will likely rise; may need base crash rate down)
- Injuries ~25/season league-wide → feels low-impact while substitution doesn't exist; revisit with bench system
- Age decline 0.1-0.3/season (rulebook spec) → invisible in practice; consider steeper post-34 curve when retirement exists
- Wet 21.6% → outdoor weatherBias 0.22; confirm against desired season texture

---
*Living document — update after each study run. Harness lives in the session
scratchpad; rerun with different SIMS/SEASONS constants as systems come online.*
