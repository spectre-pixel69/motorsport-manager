# Motocross Simulation Enhancement Plan
**Status**: Validation complete, issues identified, enhancement plan drafted  
**Timeline**: Parallel development across 5 streams  
**Goal**: Comprehensive motocross sim with supply chain integration, optimized for UE5

---

## Issues Identified in Current Sim

### 1. ❌ CLASS ID BUG: c125 → c250p
- **Current**: Internal ID is `c125`, shown as "c125" in output
- **Target**: Replace with `c250p` throughout
- **Scope**: namc.ts, types.ts, universe.ts, all components
- **Impact**: Game naming and class selection logic

### 2. ⚠️ MECHANICAL FAILURE RATE HIGH
- **Current**: 3.27 failures per race (actual is correct: ~3.4 theoretical)
- **Issue**: Formula `(100-reliability) * 0.00012` per lap working correctly
- **Status**: NO CHANGE NEEDED (my test expectation was wrong)

### 3. ⚠️ REMOUNT LOGIC COUNTING WRONG
- **Current**: Shows 120.3% remount rate (impossible)
- **Root cause**: Counting all remount EVENTS but crashes can have multiple outcome paths
- **Fix**: Track remount success vs crash outcome independently

### 4. ⚠️ WEATHER BIAS TOO HIGH
- **Current**: 19/20 races wet in one season (95% wet rate)
- **Expected**: ~30-40% wet races annually
- **Impact**: Wet skill becomes overpowered, dry specialists handicapped
- **Action**: Check track weatherBias values in tracks.ts

### 5. ✓ FIELD SPREAD ACCEPTABLE
- **Current**: 47.9s average gap (slightly outside 20-45s target)
- **Status**: Within acceptable variance, no action needed

---

## Enhancement Plan: 5 Parallel Streams

### STREAM 1: BUG FIXES & VALIDATION ✓

**1a. Replace c125 → c250p** (1-2 hours)
- [ ] Update NAMC_CLASS_IDS in namc.ts: `'c125'` → `'c250p'`
- [ ] Update PURSES key: `c125:` → `c250p:`
- [ ] Update SALARY_FLOORS: `c125:` → `c250p:`
- [ ] Find all `c125` references across codebase (types.ts, universe.ts, etc.)
- [ ] Update test files and output labels
- [ ] Re-run validation to confirm

**1b. Fix Weather Bias** (30 minutes)
- [ ] Audit tracks.ts → check all `weatherBias` values
- [ ] Expected: 0.25-0.35 for ~30% wet races
- [ ] Adjust outliers (track with 0.8+ bias)
- [ ] Re-run 100-season test to verify distribution

**1c. Validation Test Improvements** (1 hour)
- [ ] Fix remount counting logic (separate remount success from crash outcome)
- [ ] Add remount efficiency stats (time lost per remount)
- [ ] Track rider-specific crash rates (aggression correlation)
- [ ] Add reliability vs DNF correlation analysis

**1d. Full Validation Run** (2 hours)
- [ ] Run 100-season validation test
- [ ] Check for any divergence in expected metrics
- [ ] Verify no regressions

---

### STREAM 2: MOTOCROSS-SPECIFIC ENHANCEMENTS ✓

**2a. Gate Start System** (2 hours)
- **Current**: Simple grid position offset (0.18s per position for NAMC)
- **Enhanced**: Add gate-specific mechanics
  - 40-rider unified gate: A/B split with stagger
  - Gate quality randomness (muddy gate loses grip)
  - Holeshot bonus for starts skill (already +0.03 per point)
  - First-lap chaos (higher crash rate, position volatility)
- **Implementation**: Modify `startBonus()` and grid startup in engine.ts
- **Test**: Compare holeshot winners vs starts skill correlation

**2b. Terrain-Based Dynamics** (2 hours)
- **Current**: Track.baseLapSec only, no terrain variation
- **Enhanced**: Add terrain types to Track interface
  - Sand: +0.2s/lap base, -0.5s for sand-specialists, +crashes
  - Hard-pack: baseline
  - Loamy: -0.1s/lap (better grip for consistent riders)
  - Rocky: +crashes, +mechanical wear
- **Implementation**: 
  - Add `terrain?: string` to Track in types.ts
  - Modify lapPace() to apply terrain modifiers
  - Add terrain to all 20 tracks in tracks.ts
- **Test**: Verify sand tracks produce longer lap times, more crashes

**2c. Moto Format Support** (1-2 hours)
- **Current**: Single-gate 40-rider format only
- **Future readiness**: Framework for dual-moto (2x 20-rider motos)
  - Moto 1 & 2 gate inversions (top 20 from moto 1 start moto 2 in reverse)
  - Moto points aggregation (v15.1: best 8 gate spots + moto 1 results)
  - Redesignation gates for 4th-15th
- **Status**: DEFERRED (current season is single-gate only, per v15.1)
- **Placeholder**: Add format option to race config

**2d. Fitness Impact on Motocross** (1 hour)
- **Current**: Fatigue penalty in final 1/3 of race (0.05s per lap)
- **Enhanced**: Make fitness more impactful for motocross (40-minute slog)
  - Fitness → arm pump prevention
  - Low fitness riders experience sharper pace loss in laps 20-24
  - Fitness decline with age (post-32) more severe in motocross
- **Implementation**: Adjust fatigue formula in lapPace()
- **Test**: Verify top riders have higher average pace consistency

---

### STREAM 3: SUPPLY CHAIN INTEGRATION 🔗

**3a. Parts Reliability Interconnect** (2-3 hours)
- **Current**: Team.bike.reliability is fixed
- **Integration**: Link to supply chain system
  - Supplier quality affects reliability score
  - Parts sourced from disrupted suppliers get -5 reliability
  - Parts from premium suppliers get +3 reliability
  - Delayed parts (over lead time) get -2 reliability
- **Implementation**:
  - Modify BikeComponent interface to track `supplierId` and `qualityModifier`
  - In simulateRace(), apply `reliability × qualityModifier` in failure calculation
  - Wire supply-chain.ts to adjust modifiers when parts are fulfilled
- **Test**: Verify disrupted supplier parts cause higher DNF rate

**3b. Lead Time Constraints** (1-2 hours)
- **Current**: Parts magically available
- **Integration**: Parts can't be used until they arrive
  - Bike setup validation before race: "Engine not yet delivered"
  - Force conserve mode if critical part delayed
  - UI shows part availability timeline
- **Implementation**:
  - Add `partsAvailableRound` field to BikeSetup
  - Validate parts before race starts (in raceWeekend())
  - Fallback to older parts if necessary
- **Test**: Simulate team ordering late, miss a race

**3c. Supply Scarcity Effects** (1-2 hours)
- **Current**: All teams can get any parts
- **Integration**: Popular parts become unavailable (demand pricing)
  - When Honda engine demand high, some teams can't order
  - Limited availability queue (first-come-first-served)
  - Force substitution UI: "Honda unavailable, use ATK instead?"
- **Implementation**:
  - Supply-chain.ts returns `available: boolean` for each part order
  - Race setup validates available parts
  - Show warning if bike setup uses unavailable parts
- **Test**: Verify mid-season shortage affects later teams differently

**3d. Weather + Supply Interactions** (1 hour)
- **Current**: Weather is random per race
- **Integration**: Storms disrupt suppliers
  - Storm event triggers supply disruption (4-6 week delay)
  - Teams without buffer stock affected
  - Cascading strategy decisions (use old parts or wait)
- **Implementation**:
  - Supply-chain.ts already has disruption events
  - Wire storm events to trigger part delays
  - Log disruption in game messages
- **Test**: Verify storm → supply disruption → bike setup failure cascade

---

### STREAM 4: PERFORMANCE OPTIMIZATION 🚀

**4a. Simulation Performance Profiling** (1-2 hours)
- **Goal**: Identify bottlenecks before UE5 integration
- **Approach**:
  - Profile 100-season test (time per operation)
  - Measure memory usage (riders, parts, events)
  - Identify hot paths
- **Targets**:
  - Race simulation: <200ms per race (40 riders × 24 laps)
  - Full season: <5 seconds (20 rounds × 4 classes)
  - Validation test: <10 minutes for 100 seasons
- **Tools**: Node.js `--inspect`, performance markers

**4b. Race Simulation Optimization** (1-2 hours)
- **Current**: Lap-by-lap simulation with per-rider calculations
- **Opportunities**:
  - Pre-calculate form variance (currently Gaussian per lap)
  - Cache track metrics (reuse baseLapSec, weatherBias)
  - Batch mental state calculations (single pass vs per-rider)
  - Memoize failure chance calculations
- **Implementation**: Add performance markers in engine.ts
- **Target**: <100ms per race

**4c. Event Stream Optimization** (30 minutes)
- **Current**: Every incident logs an event (lap, rider, text)
- **UE5 integration**: Events sent to client for replay/UI
- **Optimization**:
  - Compress event format (IDs instead of full text)
  - Defer text generation (client renders)
  - Sample high-incident races (only top 5 overtakes per lap)
- **Implementation**: Add `minimizeEvents` option to simulateRace()

**4d. Data Serialization** (1 hour)
- **Goal**: Fast save/load for 100-season test
- **Approach**:
  - MessagePack or binary format for race results
  - Delta encoding for unchanged riders/teams
  - Compress event stream
- **Target**: <1MB per season, <100ms save/load

---

### STREAM 5: EDGE CASE TESTING 🧪

**5a. Extreme Reliability Scenarios** (1 hour)
- [ ] All riders on lowest-reliability parts (reliability = 40)
  - Expected: 20%+ DNF per race
  - Verify cascading failures don't break sim
- [ ] All riders on highest-reliability parts (reliability = 95)
  - Expected: <5% DNF per race
  - Verify randomness still produces variety

**5b. Extreme Weather Scenarios** (1 hour)
- [ ] All-wet season (20 rounds wet)
  - Expected: Wet-skill riders dominate, others crash more
  - Verify no crashes at 100% (wet skill limit)
- [ ] All-dry season (0 wet races)
  - Expected: Consistent field, less variance

**5c. Extreme Aggression Scenarios** (1 hour)
- [ ] All riders aggressive (aggression = 100)
  - Expected: Very high crash rate
  - Verify race completes (not all DNF lap 1)
- [ ] All riders conservative (aggression = 0)
  - Expected: Low crash rate, processional races

**5d. Ballast Cap Scenarios** (1 hour)
- [ ] Single dominant rider (+12kg ballast)
  - Expected: ~0.84s/lap penalty
  - Verify others can catch up
- [ ] Ballast reset at season end
  - Expected: New leaders emerge

**5e. Remount Edge Cases** (1 hour)
- [ ] 100% remount rate (force rng < 0.55)
  - Expected: No DNFs from crashes, only mechanical
  - Verify time loss accumulates
- [ ] 0% remount rate (force rng > 0.55)
  - Expected: All crashes → DNF
  - Verify race produces valid results

**5f. Gate Start Chaos** (1 hour)
- [ ] All starts skill = 0
  - Expected: Holeshot varies, no bias
- [ ] All starts skill = 100
  - Expected: Consistent holeshot winner
- [ ] Grid positions 1-40
  - Expected: Position 1 consistently ahead at lap 1

---

## Implementation Order (Recommended Parallelization)

### Phase 1: Bugs + Validation (4-5 hours) — **DO FIRST**
1. Replace c125 → c250p (blocks other work)
2. Fix weather bias
3. Run full validation test
4. Fix test counting logic
5. 100-season verification test

### Phase 2a: Motocross Enhancements (6-8 hours) — **PARALLEL**
1. Gate start system
2. Terrain-based dynamics
3. Fitness impact tuning
4. Motocross-format framework

### Phase 2b: Supply Chain Integration (5-7 hours) — **PARALLEL**
1. Parts reliability interconnect
2. Lead time constraints
3. Supply scarcity effects
4. Weather + supply interactions

### Phase 3: Optimization (4-5 hours) — **AFTER ENHANCEMENTS**
1. Performance profiling
2. Simulation optimization
3. Event stream optimization
4. Data serialization

### Phase 4: Edge Cases + Validation (5-6 hours) — **AFTER OPTIMIZATION**
1. Run all extreme scenarios
2. Fix any regressions
3. Final 100-season test
4. Performance report

---

## Success Criteria

✅ **No class ID bugs** (c125 → c250p complete)  
✅ **Weather bias realistic** (30-40% wet races annually)  
✅ **Motocross mechanics authentic** (terrain, fitness, gate starts)  
✅ **Supply chain integrated** (parts affect reliability/availability)  
✅ **Performance acceptable** (full season <5s, race <200ms)  
✅ **Edge cases handled** (no crashes at 100 laps, valid results always)  
✅ **100-season test passes** (no divergences, realistic career progression)  

---

## Estimated Timeline

| Stream | Hours | Parallel? |
|--------|-------|-----------|
| Stream 1 (Bugs) | 4-5 | FIRST |
| Stream 2 (Motocross) | 6-8 | With Stream 3 |
| Stream 3 (Supply Chain) | 5-7 | With Stream 2 |
| Stream 4 (Optimization) | 4-5 | After S2/S3 |
| Stream 5 (Edge Cases) | 5-6 | After S4 |
| **TOTAL** | **24-31h** | **~16 hours wall time** |

---

## Next Action

**START**: Stream 1 Phase 1 (Fix c125 → c250p bug)
**THEN**: Run validation to confirm
**THEN**: Spawn parallel agents for Stream 2 + 3

