# Rider Skills System — Quick Reference

**9 Independent Skills** (0-100 exact values) with hidden potential ceiling.

## Skills at a Glance

| Skill | Domain | Training Boosts | Decline Rate (32+) | Key Trait |
|-------|--------|-----------------|-------------------|-----------|
| pace | Raw speed (no traffic) | +0-5/training | -0.3/season | Natural talent |
| braking | Late corner entry, stopping | +0-4/training | -0.2/season | Risk taker |
| cornerSpeed | Mid-corner lean, carry | +0-4/training | -0.2/season | Smoothness |
| racecraft | Overtaking, defending, reading | +0-3/training | -0.1/season | Smart (experience) |
| consistency | Crash/error avoidance | +0-3/training | -0.1/season | Maturity |
| starts | Launch/holeshot ability | +0-4/training | -0.2/season | Reflexes |
| fitness | Stamina, injury resistance | +0-4/training | -0.3/season | Conditioning |
| wet | Rain performance | +0-3/training | -0.1/season | Wet-master trait |
| feedback | R&D development quality | +0-2/training | 0.0/season | Intelligence |

---

## Training Mechanics

### Training Gain Formula
```
gain = 0.3 × ageMod × headroomMod × facilityMod × coachMod
```

**Where**:
- `0.3` = base gain per session
- `ageMod` = age-based multiplier (see below)
- `headroomMod` = min(1.0, (potential - current) / 20)
- `facilityMod` = 0.8-1.6 (facility levels 1-5)
- `coachMod` = 0.8-1.5 (team coach quality)

### Age Modifiers
| Age Range | Multiplier | Notes |
|-----------|-----------|-------|
| < 22 | 1.5 | Young + hungry |
| 22-27 | 1.0 | Prime training years |
| 28-31 | 0.6 | Slower gains |
| 32+ | 0.3 | Decline kicks in |

### Example: Training Pace

**Rider**: Age 26, pace = 75, potential = 92 (hidden)  
**Facility**: Level 3, coach = 1.1

```
headroom = 92 - 75 = 17
headroomMod = min(1.0, 17/20) = 0.85
facilityMod = 1.2  (level 3)
ageMod = 1.0  (age 26)

gain = 0.3 × 1.0 × 0.85 × 1.2 × 1.1 = 0.33 pace points
```

After training: pace = 75.33

---

## Stamina System

**Resource**: 0-100, tracks training fatigue

| Event | Stamina Change | Notes |
|-------|-----------------|-------|
| Training session | -15 | Always free, no token required |
| Rest day (passive) | +10 | Automatic, every 24h |
| Recovery facility (L3+) | +12 | Slightly faster regen |
| Injury | -20 to -40 | Depends on severity |
| Race weekend | -5 to -10 | Depends on class/mileage |

**Overtraining Penalty**:
- If stamina drops below 20 after training: 0-30% injury risk triggered
- Injury causes temporary 1-5 point skill loss

**No Gating**: Stamina never prevents training. Negative stamina = increased injury risk, not a hard block.

---

## Potential (Hidden)

**What it is**: Skill ceiling. Each skill has independent potential (0-100).

**How it works**:
- Not displayed to player (creates uncertainty, realism)
- Affects training gains via headroom calculation
- As skill approaches potential, gains shrink exponentially
- Cannot exceed potential via training (capped at 99)

**Example**: Rider with pace potential = 85
- At pace = 50: headroom = 35, headroomMod = 1.0 (good gains)
- At pace = 75: headroom = 10, headroomMod = 0.5 (half gains)
- At pace = 80: headroom = 5, headroomMod = 0.25 (quarter gains)
- At pace = 85: headroom = 0, headroomMod = 0 (no gains possible)

**Player Strategy**: Discover potential by training repeatedly; watch if gains slow = close to ceiling.

---

## Traits (Modifiers)

**Positive Traits** (6 available, rare):
- **wet-master**: +40 wet skill baseline
- **holeshot-king**: +30 starts skill baseline
- **late-braker**: +25 braking skill baseline
- **ice-veins**: +20 consistency (nerves of steel)
- **development-guru**: +40 feedback skill (excellent R&D quality)
- **fan-favorite**: +1 morale per round (prestige boost)

**Negative Traits** (3 available, common):
- **fragile**: -10 fitness, higher injury risk
- **reckless**: +10 aggression (wins easier) but -15 consistency (more crashes)
- **slow-starter**: -15 starts skill

**Application**: Applied as base skill bonus. e.g., wet-master starts at wet = 40 instead of 0.

---

## Skill Blending in Race Simulation

**Pace Calculation** (simplified model):
```
riderPace = (pace×0.35 + racecraft×0.2 + consistency×0.15 + 
             cornerSpeed×0.15 + braking×0.1 + feedback×0.05) 
            × bikeReliability × weatherMod
```

**Notes**:
- Pace is the dominant factor (35%)
- Racecraft (overtaking, line reading) second (20%)
- Consistency (error avoidance) matters in long races (15%)
- Wet weather multiplies wet-skill rider speeds by 1.1-1.5×

---

## Training Facility Levels

| Level | Multiplier | Cost | Details |
|-------|-----------|------|---------|
| 1 | 0.8 | $0 (default) | Basic track, no amenities |
| 2 | 1.0 | $50k/year | Gym, medical staff |
| 3 | 1.2 | $150k/year | Advanced simulators, coaching |
| 4 | 1.4 | $350k/year | Wind tunnel, custom setups |
| 5 | 1.6 | $700k/year | Premium: everything |

**Investment**: Facility level is a team budget decision (R&D allocation).

---

## Age Decline Mechanics (32+)

Once a rider hits age 32, annual decline applies:

**Affected Skills** (physical stats):
- pace: -0.3/season (most aggressive)
- braking: -0.2/season
- starts: -0.2/season
- fitness: -0.3/season (fastest decline)
- cornerSpeed: -0.2/season

**Unaffected Skills** (mental/experience):
- racecraft: 0.0 (experience = better with age)
- consistency: -0.1/season (slight decline only)
- feedback: 0.0 (intelligence doesn't fade)
- wet: -0.1/season (slight decline)

**Strategic Implication**: After 32, riders lose physical performance but gain racecraft and can still develop (albeit slower).

---

## Designing Custom Training Programs

**Example 1: Junior Prodigy (age 20, new to 350)**
- High pace potential, low racecraft
- Focus: racecraft development (learn to race wheel-to-wheel)
- Secondary: consistency (avoid crashes in new class)
- Train 3-4 sessions/week

**Example 2: Veteran Champion (age 34, elite racecraft)**
- Maintain pace, leverage experience
- Focus: fitness (stay sharp for endurance)
- Avoid: overtraining (injury risk > benefit)
- Train 2 sessions/week, lots of recovery

**Example 3: Development Rider (Low feedback, high pace)**
- Goal: Unlock R&D from bike testing
- Focus: feedback skill (only way to improve bike)
- Secondary: wet-weather skills (diverse data for engineers)
- Train 5 sessions/week, intensive program

---

## FAQ

**Q: Can a rider exceed 100 in a skill?**  
A: No. Maximum is 99 (hard cap). Training stops there.

**Q: What's the difference between potential and overall?**  
A: Overall = derived headline rating (discipline-weighted blend). Potential = hidden per-skill ceiling.

**Q: How do I discover a rider's potential?**  
A: Train repeatedly in one skill. If gains drop to near-zero, you've hit the ceiling.

**Q: Can negative traits ever be removed?**  
A: No. Traits are permanent. Choose signings carefully.

**Q: What's the max facility level a team can have?**  
A: Level 5 is maximum. Costs $700k/year, part of R&D budget.

**Q: If a rider has wet-master trait, what's their wet skill minimum?**  
A: Minimum of 40 (40 + any training gains). wet-master gives +40 baseline.

**Q: Does age decline apply in season or between seasons?**  
A: Between seasons (annually). A 32-year-old doesn't decline mid-season; decline applies after year ends.

---

**Last Updated**: 2026-07-09
