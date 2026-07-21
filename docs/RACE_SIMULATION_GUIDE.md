# Race Simulation Engine — Technical Guide

The race simulation (`src/sim/index.ts`) generates deterministic, seeded race outcomes. Each race is reproducible given the same seed.

---

## Race Format

**Single Gate, 40-Rider Grid** (NAMC v15.1):
- No motos, no relegation
- One 25-35 minute race (distance varies by track)
- F1-style championship points (25-1 across top 20, scale down for 40-rider grid)
- 1 point awarded for 40th place (minimum)

---

## Pace Model

### Base Pace Calculation

Each rider gets a **base pace** (lap time in milliseconds):

```
basePace = trackBaselineLapTime × (riderSkillBlend / 100)
```

**RiderSkillBlend** (normalized to 0-100 equivalent):
```
blend = (pace×0.35 + racecraft×0.2 + consistency×0.15 + 
         cornerSpeed×0.15 + braking×0.1 + feedback×0.05) / 100
```

**Example**:
- Track baseline: 87,000 ms (87 seconds)
- Rider blend: 82/100
- Base pace: 87,000 × 0.82 = 71,340 ms per lap

### Modifiers Applied Per Lap

**Bike Reliability**:
```
paceAdjustment = bikeReliability / 100
```
- Reliable bike (90 rel): -10% pace (faster, stable)
- Unreliable bike (60 rel): -40% pace (erratic, risky)

**Engine Mode Wear**:
```
wearMultiplier = 1.0 + (wear% × 0.01)  // 0-100% wear = 1.0 to 2.0× failure risk
```
- Affects failure chance per lap, not base pace
- But part failures cause immediate pace loss (see Failures section)

**Weather**:
```
weatherMod = dry: 1.0 | wet: riderWetSkill/100
```
- Dry conditions: neutral
- Wet conditions: riders with high wet skill gain advantage
  - wet = 50: paceAdjustment = 0.5× (30% slower)
  - wet = 80: paceAdjustment = 0.8× (20% slower)

**Tire Compound** (future expansion):
- Soft tires: +5% pace, -10% durability
- Medium tires: baseline
- Hard tires: -5% pace, +10% durability

---

## Component Failure System

### Failure Trigger Per Lap

For each component on the bike:

```
failureChance = max(1%, (100 - reliability) × 0.0025) × wearMultiplier
```

**Example 1**: Engine, rel=80, wear=0%
```
failureChance = max(1%, (100-80) × 0.0025) × 1.0 = max(1%, 0.5%) = 1%
```

**Example 2**: Engine, rel=60, wear=50%
```
failureChance = max(1%, (100-60) × 0.0025) × 1.5 = max(1%, 1.5%) = 1.5%
```

### When a Component Fails

Roll `severity = random(0, 100)`:

| Severity | Impact | Description |
|----------|--------|-------------|
| 0-49 (50%) | Minor | 15-40% pace loss for rest of race |
| 50-79 (30%) | Moderate | 35-60% pace loss |
| 80-99 (20%) | Terminal | DNF (Did Not Finish) |

**After Failure**:
- Rider's pace degrades by severity %
- Component wear increases by 10% (already damaged)
- Pit stop logic (future): Can pit to swap component, costs time

### Graduated Failure Example

**Scenario**: Suspension fails at lap 8 (of 25-lap race)

- Roll severity: 62 (moderate)
- Pace loss: 45% (random 35-60)
- Old pace: 71,340 ms/lap → New pace: 103,443 ms/lap
- Remaining 18 laps: slow but finishes
- Suspension wear: +10% after failure

---

## Overtaking & DRS Logic

### Overtaking Sequence (simplified for now)

On each lap, if a faster rider is within 1 second of a slower rider ahead:

```
overtakeProbability = (fasterPace - slowerPace) / 1000 × racecraftBonus
racecraftBonus = fasterRider.racecraft / 100  // 0.5-1.0 range
```

**Example**:
- Faster rider pace: 70,000 ms/lap, racecraft = 75
- Slower rider pace: 71,500 ms/lap (1.5 sec slower)
- Gap < 1 sec? No, waiting...
- Lap 12: gap closes to 0.8 sec
- overtakeProbability = (71,500 - 70,000) / 1000 × 0.75 = 1.125 (100% attempt)
- Roll risky overtake → Overtaking rider gains 1 position

### Overtake Risk Model

Racecraft-heavy riders take smarter lines; low-racecraft riders take risky chances:

```
crashRisk = (100 - fasterRider.consistency) / 100 × 0.15
```

If crash rolls: slower rider stays ahead, faster rider loses 1 position + pace loss (5 laps recovery).

### DRS Detection (Future)

When available (designated straights):
- Faster rider within 1 second of car ahead
- Gains 5% pace boost for 1 lap
- Can achieve overtake with lower racecraft requirement

---

## Grid Formation

### Starting Grid

**Order**: Determined by qualifying simulation (mini-race, 1 lap) or previous round points.

**Qualifying Pace** = same as race pace but:
- Single lap (no tire strategy)
- No component failures (fresh parts)
- Engine mode = standard (no attack risk in qual)

### Traction Control / Launch

**Starts Skill Advantage**:
```
launchBonus = rider.starts / 100
```

- High-starts rider (starts=85): +0.85 position gain on start
- Low-starts rider (starts=30): +0.30 position gain on start

**Example**: Grid position 5 rider with starts=85 vs position 6 rider with starts=30
- Position 5 effective start: 5 - 0.85 = 4.15 (beats position 6)

---

## Points & Standings

### Championship Points (F1-Style, Scaled for 40 Riders)

| Position | Points |
|----------|--------|
| 1 | 25 |
| 2 | 20 |
| 3 | 18 |
| 4 | 16 |
| 5 | 15 |
| 6 | 14 |
| 7 | 13 |
| 8 | 12 |
| 9 | 11 |
| 10 | 10 |
| 11-20 | 9-1 (descending) |
| 21-40 | 0 points |

**Fastest Lap Bonus**: 1 extra point (top-10 finisher with fastest lap)

### Constructor Points

Accumulated by manufacturer (sum of both team drivers):
- Used for manufacturer championship (parallel track)
- Affects sponsorship opportunities

---

## Weather & Track Conditions

### Weather Generation

Per-round weather chance determined by track:

```
rainChance = trackWeatherBias × (0.5 + random(-0.5, 0.5))
```

| Track Type | Weather Bias | Notes |
|-----------|--------------|-------|
| Road course | 0.3 | Occasional rain |
| Stadium | 0.2 | Mostly dry |
| Outdoor national | 0.5 | Unpredictable |

### Wet Race Pace Impact

Wet skill becomes dominant:

```
wetPaceMultiplier = 1.0 - ((100 - wetSkill) / 100) × 0.35
```

**Examples**:
- wet = 20: multiplier = 1.0 - 0.8×0.35 = 0.72× (28% slower)
- wet = 50: multiplier = 1.0 - 0.5×0.35 = 0.825× (17.5% slower)
- wet = 90: multiplier = 1.0 - 0.1×0.35 = 0.965× (3.5% slower)

### Track Evolution

Tire grip evolves over the race (future expansion):
- Laps 1-5: Lower grip (cold tires, marbles)
- Laps 6-20: Peak grip (rubber laid down)
- Laps 21+: Tire degradation (-2% per lap after lap 20)

---

## Pit Stops & Strategy (Future)

### When a Pit Stop Occurs

Scenarios:
1. **Mandatory pit** (rule = must pit once per 30 laps)
2. **Component failure pit** (broken part needs swap, future)
3. **Tire change pit** (wear-based, future)

### Pit Stop Time

```
stopTime = 45 seconds (base) + componentSwapTime (if needed) + fuelTime (if applicable)
```

Pit entry/exit: ~5 seconds each = 55 seconds minimum

### Strategy Impact

Example: Leader pits on lap 18, loses 1 minute to 2nd place rider → restarts in 2nd.

---

## Example Race: 350 Pro Class, Round 8

**Grid**: 40 riders, Daytona Supercross (stadium round)  
**Weather**: Dry (grasstrack bias = 0.2, rolled dry)  
**Track baseline**: 84,000 ms/lap (84 seconds)  
**Distance**: 25 laps (~35 min)

**Key Riders**:
1. #1 (pace=92, racecraft=78, consistency=82) – Team Red Lead
2. #13 (pace=89, racecraft=85, consistency=80) – Team Blue Lead
3. #5 (pace=85, racecraft=72, consistency=88) – Consistent specialist

**Lap-by-Lap Sim** (abbreviated):

- **Lap 1**: Qualifying order + launch bonus
  - #1 (pace lead): front
  - #13 (starts=84): position 2
  - #5 (consistent): position 3
- **Laps 2-8**: #13 closes gap to #1 via superior racecraft, #5 steady
  - Lap 7: #13 overtakes #1 (1.5 sec gap closed, racecraft advantage)
  - #1 consistent, stays close (racecraft=78 < 85)
- **Laps 9-15**: Attrition event
  - Lap 12: Rider #27 engine fails (rel=58, wear=20%) → moderate failure, -50% pace
  - Rider #27 drops from top-15 to mid-pack
  - #13 maintains lead, #5 up to 2nd (consistent strategy paying off)
- **Laps 16-25**: Engine mode adjustment (Push mode per strategy)
  - #1 switches to Push (1.6× wear risk)
  - Lap 19: #1 engine reliability check fails (rel=75, wear accumulated)
    - Roll severity: 48 (minor) → 25% pace loss
    - #1 pace degrades, slips to 3rd behind #5
  - Final laps: #13 wins, #5 2nd, #1 3rd despite early promise

**Results**:
1. #13 (25 pts) + fastest lap (1 pt) = 26 pts
2. #5 (20 pts)
3. #1 (18 pts)
4. #42 (16 pts)
...
40. Rider #27 DNF (0 pts)

---

## Configuration & Tuning

### Failure Rate Multiplier (Global)

In `src/sim/index.ts`, adjust:
```typescript
const FAILURE_RATE_MULTIPLIER = 1.0;  // 1.0 = balanced, 0.5 = half failures, 2.0 = double
```

Lower values = more reliability, fewer DNFs.  
Higher values = more drama, strategic pit stops matter.

### Pace Sensitivity

Adjust skill blend weights to emphasize different aspects:

```typescript
const blend = (
  pace * 0.35 +           // Change to 0.25 for less pace dominance
  racecraft * 0.2 +
  consistency * 0.15 +
  cornerSpeed * 0.15 +
  braking * 0.1 +
  feedback * 0.05
) / 100;
```

### Engine Mode Wear Multipliers

In `src/data/bikes.ts`:
```typescript
const ENGINE_MODE_WEAR = {
  conserve: 0.6,
  standard: 1.0,
  push: 1.6,
  attack: 2.2,
};
```

Adjust to make aggressive strategies more/less risky.

---

## Determinism & Seeding

### How It Works

Every race is generated from a **universe seed** (fixed per career):

```typescript
const u = state.universe;
const rng = new SeededRNG(u.seed + round);  // Round-specific RNG
```

Same seed + round = same race outcome (always).

### Why Deterministic?

- Replayable for broadcast features
- Fair for multiplayer (no RNG cheating)
- Easier to balance (change a value, all races shift predictably)

### Randomness Preserved

Even with seeding, results vary because:
- Rider strategies (player chooses engine mode, approaches)
- Team decisions (facility level, coach quality, parts purchased)
- Season progression (injuries, fatigue, skill changes)

---

## Performance Metrics

### Typical Race Stats

- **Average DNF rate**: 5-10% of grid (depending on part quality)
- **Position changes per race**: 30-50 (overtakes + failures)
- **Fastest lap holder changes**: 2-4 per race
- **Leader changes**: 3-8 per race

Adjust `FAILURE_RATE_MULTIPLIER` if stats seem off.

---

## Future Expansions

- [ ] Pit stop strategy (mandatory/optional pits with tire choice)
- [ ] Tire degradation modeling (compound choice affects durability)
- [ ] Fuel strategy (tank size, consumption rate)
- [ ] Safety car periods (neutralize race, bunching effects)
- [ ] Weather changes mid-race (dry → wet transitions)
- [ ] Setup optimization (suspension, wings) per track
- [ ] Drafting physics (slipstream advantage on straights)

---

**Last Updated**: 2026-07-09
