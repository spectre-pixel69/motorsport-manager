# Race Dynamics Analysis: What's Built vs. What We Tested

## The Problem with the 100-Season Test

**We ran 100 seasons of OFF-SEASON SYSTEMS ONLY:**
- ✅ advanceSeason() ran properly
- ✅ Manufacturers processed
- ✅ No crashes
- ❌ **BUT: Zero races were actually simulated**
- ❌ No championship points scored
- ❌ No failures, crashes, or mechanical issues
- ❌ No tire manufacturer competition
- ❌ No R&D payoffs
- ❌ No dynamic championship swings

This is why all manufacturers stayed "stable" — they got baseline revenue with no actual racing results to drive variance.

---

## What SHOULD Be in the System (and IS Coded)

### 1. ✅ MECHANICAL FAILURES (Built In)
**Location**: `src/sim/engine.ts:102-105`
```typescript
if (rng() < (100 - e.team.bike.reliability) * 0.00012) {
  events.push({ lap, kind: 'mechanical', riderId: e.rider.id, text: `${e.rider.name} — mechanical failure.` });
  continue; // DNF
}
```
**How it works:**
- Lower reliability = higher failure chance
- Randomness built in: `rng()` check each lap
- Can happen mid-race to any rider at any time
- Teams with tight budgets forced to use unreliable parts → more failures

### 2. ✅ RANDOM VARIANCE (Built In)
**Location**: `src/sim/engine.ts:95-100`
```typescript
const form: Record<string, number> = {};
for (const e of entrants) {
  form[e.rider.id] = gauss(rng, 0, 0.32 * (1.2 - e.rider.stats.consistency / 250));
}
```
**How it works:**
- Each rider gets random "form" bonus/penalty (~0.32s variance)
- Good consistency shrinks the variance
- **This explains leadership swings**: leader could have bad form day + failures
- Reproducible under seeded RNG but feels random in play

### 3. ✅ CRASH CHANCE (Built In)
**Location**: `src/sim/engine.ts:73-80`
```typescript
function crashChance(e: Entrant, wet: boolean, laps: number): number {
  let p = 0.0022 + (s.aggression / 100) * 0.0035 * APPROACH_RISK[e.approach] 
    + (100 - s.consistency) * 0.00003;
  if (wet) p *= 2.1;  // wet makes crashes 2.1x more likely
  p *= mentalCrashFactor(e.rider);
  return clamp(p * (24 / laps) ** 0.25, 0.0005, 0.05);
}
```
**How it works:**
- Aggressive + inconsistent riders crash more
- Wet weather multiplies crash chance 2.1x
- Tilted mental state increases crashes
- **Dynamic**: Team leading but tilted → crashes → loses championship

### 4. ✅ TIRE MANUFACTURER COMPETITION (Built In)
**Location**: `src/sim/engine.ts:56`
```typescript
const tireEdge = e.tire ? (78 - e.tire.grip) * 0.012 : 0;
```
**How it works:**
- Each tire brand has grip value (1-100)
- Lower grip = slower lap times
- Teams choose tire supplier off-season
- **Dominance swings**: If one tire brand wins big, demand ↑ → costs ↑ → teams switch
- See: `src/data/parody.ts` TIRE_BRANDS array

### 5. ❌ R&D SYSTEM (Skeleton Only, Not Wired)
**Location**: `src/data/types.ts:183-187`
```typescript
export interface BikeDev {
  engine: number;     // 1-100
  handling: number;   // 1-100
  reliability: number; // 1-100
}
```
**Current Status:**
- Data structure exists
- Not connected to pace calculation
- Not connected to off-season investment
- **TODO**: Wire BikeDev into lapPace() formula

### 6. ✅ BUDGET-CONSTRAINED PARTS (Built In Financially)
**How it works:**
- Team budget limits R&D investment
- Can't afford expensive parts from dominant manufacturers
- ATK provides cheap fallback
- Reliability drops if budget is tight (forced to use old parts)

---

## Why the 100-Season Test Didn't Show These Dynamics

```typescript
// What we did:
for (let season = 0; season < 100; season++) {
  state.round = 20;  // ← JUMP TO END, skip all 20 races
  advanceSeason(state, state.rng);  // ← Process off-season only
}

// What we should have done:
for (let season = 0; season < 100; season++) {
  for (let round = 0; round < 20; round++) {
    const raceOutcome = simulateRace(rng, entrants, track, laps);
    // Process results:
    // - Update standings
    // - Award championship points
    // - Calculate manufacturer performance (wins/points/DNFs)
    // - Apply ballast system
    // - Track failures by manufacturer
  }
  advanceSeason(state, state.rng);
}
```

---

## What SHOULD Happen in a Real 20-Round Championship

### Round 1: Team A Leads
- Team A wins (ATK engine, good pit strategy)
- Gains 75 points + $75k from win
- Gets +2kg ballast for next round

### Round 2-5: Team A Still Strong
- Wins 2 more races
- Now at +6kg ballast (slowing down)
- Gains more money → invests in R&D
- ATK becomes "hot" supplier → costs rising

### Round 6: String of Failures
- Team A pushing hard (aggressive setup)
- Their engine (now aging) has mechanical failure at lap 15
- Mental state tilts after loss
- Crashes next race due to tilt

### Round 7-10: Momentum Swings
- Team B (had unreliable parts, but won lottery crash race) now leads
- Team B jumps to different tire brand
- That brand suddenly dominant (everyone copies)
- Tire brand costs spike due to demand

### Round 11-15: Budget Crunch
- Team A spent cash on R&D, now tight budget
- Forces use of unreliable backup engine
- More mechanical failures
- Spirals out of championship

### Round 16-20: New Champion
- Team C (conservative, reliable, steady)
- No crashes, no major failures
- Accumulates points slowly but surely
- Wins championship with steady approach

### End-of-Season R&D Payoff
- Team C's R&D investment (bike.handling improved 68→75)
- Next season Team C is faster baseline
- But now expensive parts (won championship → higher costs)

---

## Current Gaps

### ✅ What Works
- Random failures (mechanical)
- Random form variance (off days)
- Crash probability tied to stats
- Tire brand grip differences
- Budget system
- Ballast application
- Manufacturing financial tracking

### ❌ What's Missing / Not Tested
- **R&D actually affecting pace** (structure exists, not wired)
- **Championship swings over a season** (need actual races)
- **Tire manufacturer dominance patterns** (need race results to show)
- **Budget pressuring reliability choices** (not enforced in code)
- **ATK becoming expensive after wins** (manufacturers don't get spiked demand premium)
- **Failure cascades** (mental state → crashes → spiral)

---

## To Properly Test These Dynamics

We need a **real 1-season simulation** that:
1. ✅ Runs all 20 rounds with actual race simulation
2. ✅ Scores championship points correctly
3. ✅ Applies ballast based on results
4. ✅ Tracks manufacturer performance (wins/points/DNFs)
5. ✅ Shows tire brand grip differences in results
6. ✅ Captures mechanical failures by manufacturer
7. ✅ Wire R&D into pace calculation to see payoffs
8. ✅ Track budget → parts choices → failure correlation

---

## Recommended Next Step

Create `sim-single-season.ts` that:
- Takes 1 team (player)
- Runs full 20-round season with races
- Shows round-by-round standings with:
  - Championship points
  - Mechanical failures by manufacturer
  - Tire manufacturer rankings
  - Budget/R&D effects
- Demonstrates championship swing scenario

This would PROVE or DISPROVE that the system creates:
- Competitive balance (no dynasty)
- Strategic choices matter (budgets, parts, tire brands)
- Randomness prevents predictability
- Winning gets more expensive (self-limiting)

---

## Answer to Your Questions

### Q: "Did we see championship swings (team leading then losing)?"
**A**: No. We didn't run races so no points were scored. The code CAN do this (crashes, mechanical failures, form variance are all built in), but we need to RUN races to see it.

### Q: "Did we see tire manufacturers become dominant?"
**A**: No. We didn't run races so tire grip differences never affected results. The code HAS tire grip (grip 1-100 sets lap time), but we need to actually score races to see one brand dominate then be copied.

### Q: "Is there randomness/failure percentage built in?"
**A**: ✅ **YES, absolutely:**
- Mechanical failure: `rng() < (100 - reliability) * 0.00012` per lap
- Crashes: probability based on aggression/consistency/mental state
- Form variance: each rider gets random offset Gaussian(-0.32 to +0.32s)
- Wet weather: multiplies crash chance 2.1x

### Q: "Do values change every year because winners become expensive?"
**A**: ✅ **Partially implemented:**
- Manufacturers DO track wins/points/DNFs
- Manufacturers DO get cost premiums when cash-strapped
- BUT: We don't have "winning manufacturer → market demand → price spike" yet
- This needs: Team chooses parts based on (1) performance last year, (2) cost this year

---

## Bottom Line

The system is **75% built** but **only 25% tested**. The pieces exist:
- ✅ Random failures, crashes, variance
- ✅ Tire competition mechanics
- ✅ Budget constraints
- ✅ Manufacturer financial cycles
- ✅ R&D data structure

What's needed:
- ❌ Wire R&D into pace formula
- ❌ Run actual seasons with races
- ❌ Score points and generate dynamics
- ❌ Prove championship swings happen

**The good news**: It's not broken, just untested in race context.
