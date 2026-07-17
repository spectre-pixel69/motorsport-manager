# Paddock Boss — NAMC v15.3 Manager Game
## Documentation & Knowledge Base

**Project**: spectre-pixel69/motorsport-manager  
**Branch**: claude/motorsport-manager-jn6ugx  
**Tech Stack**: TypeScript, Preact, Vite, Node.js/Express  
**Status**: v0.1.0 — Core systems implemented, NAMC v15.3 rulebook locked  

---

## ⚠️ SOURCE OF TRUTH
The ONLY authority for NAMC rules is **docs/NAMC_RULEBOOK_v15.3_07162026.pdf**
(in this repo). When this file and CLAUDE.md disagree, THE PDF WINS. Read the
PDF before implementing any league rule. Current compliance: v15.3 points scale
(§11.2), dynamic ballast (§8.6), all-outdoor 20-round calendar (§10.0), unified
40-rider single gate (§3.4), four-class structure (§3.1).

## LOCKED SPECIFICATIONS (superseded by the PDF above where they conflict)

These are contractual constraints from the NAMC v15.3 rulebook. All game mechanics must honor these.

### Championship Format
- **20-round all-outdoor S4-only championship** (future: 2S championship parallel)
- **Unified 40-rider single gate** (no motos, no relegation)
- **v15.3 championship points** (§11.2):
  - **Main Event** (1.0x): 75/60/52/37/36/35/34/33/32/31/30/29/28/27/26/25/24/23/22/21/20/19/18/17/16/15/14/13/12/11/10/9/8/7/6/5/4/3/2/1
  - **Sprint** (0.5x): Each value halved (37.5/30/26/18.5/18/17.5/...)
  - **Podium Cliff**: 3rd→4th = 15 point gap (52→37) intentional
- **4 independent NAMC classes**: 350 Pro (4S), 250 Men (4S), 250P Restricted (4S), Women's 250 (4S)
- **All rounds**: Outdoor natural terrain (§10.0, eliminated stadium/supercross format)

### Dynamic Ballast System (§8.6, v15.2+)
- **Success handicap applied per round** based on **final Sunday Main Event standings**:
  - Win = +2kg at next round
  - Podium (2nd–3rd) = +1kg at next round
  - Off-podium (4th+) = -1kg at next round (minimum 0kg)
- **Pace effect**: 0.07 seconds/lap per kg of ballast
- **Cap**: 12kg maximum per rider (~0.84s/lap penalty)
- **Reset**: Ballast resets to 0kg every season
- **Verification**: Mandatory weigh-in before Sprint and Main Event
- **All classes**: 350 Pro, 250, 250P, Women's 250

### Budget & Purse
- **$2.5M seasonal budget per team** (fixed capital, no mid-season funding)
- **Per-round purse**: $800k distributed across 4 classes proportionally
- **25% of purse goes to riders** (appearance bonuses + finish-position bonuses)
- **75% operational split**: Staff salaries, R&D investment, parts/tires, reserves

### Penalties
- **Three-strike system**: Penalties for technical infractions, unsportsmanlike conduct, or rule violations
- **Strike 1**: Warning, no points penalty
- **Strike 2**: 5-point deduction for rider in class
- **Strike 3**: Automatic suspension (1-3 rounds) or team technical penalty

### Rider Salaries (Annual, per class)
| Class | Floor | Appearance/Round | Win Bonus | Bench Retainer |
|-------|-------|------------------|-----------|----------------|
| 350 Pro | $400,000 | $1,000 | $75,000 | $50,000 |
| 250 Men | $200,000 | $1,000 | $40,000 | $50,000 |
| 250P Restr. | $100,000 | $1,000 | $20,000 | $50,000 |
| Women's 250 | $100,000 | $1,000 | $20,000 | $50,000 |

**Pro Debut Bonus**: $25k (one-time for first pro start)  
**Min Finish Payout** (40th place): $5k per round

---

## Core Systems

### 1. Rider Development (9-Skill System)

Each rider has 9 independent skills (0-100 exact values, hidden potential ceiling):

| Skill | Domain | Notes |
|-------|--------|-------|
| **pace** | Raw speed in isolation (no traffic) | Improves with age 22-27, declines 32+ |
| **braking** | Late corner entry, stopping power | Critical on road courses |
| **cornerSpeed** | Mid-corner lean angle & carry | Correlated with fitness |
| **racecraft** | Overtaking, defending, line reading | Improves with experience |
| **consistency** | Crash/error avoidance | Declines with overtraining |
| **starts** | Launch/holeshot ability | Holeshot-king trait +30 bonus |
| **fitness** | Stamina, injury resistance | Declines fastest post-32 |
| **wet** | Rain performance (track multiplier) | Wet-master trait +40 bonus |
| **feedback** | R&D development quality | Drives engine/handling upgrades |

**Traits** (6 positive, 3 negative):
- Positive: wet-master, holeshot-king, late-braker, ice-veins, development-guru, fan-favorite
- Negative: fragile, reckless, slow-starter

**Training System**:
- **Stamina Resource**: 15/session cost, 0-100 resource
- **Free Regen**: +10/day rest (always available, no tokens needed)
- **Gain Formula**: `0.3 × ageMod × headroomMod × facilityMod × coachMod`
  - `ageMod`: 22- = 1.5, 22-27 = 1.0, 28-31 = 0.6, 32+ = 0.3
  - `headroomMod`: min(1.0, (potential - current) / 20)
  - `facilityMod`: 0.8-1.6 (levels 1-5)
  - `coachMod`: 0.8-1.5 (team coach quality)
- **Age Decline**: 32+ years lose 0.1-0.3/skill/season on physical stats (pace, braking, fitness)
- **Overtraining Penalty**: <20 stamina = 0-30% injury risk, temporary skill loss

**Potential** (Hidden):
- Determines skill ceiling (not displayed to player)
- Affects training headroom (gains shrink as skill approaches potential)
- Each skill has independent potential (not a single "overall" cap)

---

### 2. Parts Reliability & Wear

**Engine Modes** (affect reliability wear):
- **Conserve** (0.6×): Low wear, lower power output
- **Standard** (1.0×): Baseline wear, balanced
- **Push** (1.6×): High wear, higher power output
- **Attack** (2.2×): Extreme wear, maximum power (race-day only)

**Failure Mechanics**:
- **Base Failure Chance**: `max(1%, (100 - reliability) × 0.25)`
  - 100 rel = 1% failure
  - 80 rel = 5% failure
  - 60 rel = 10% failure
- **Wear Multiplier**: Accumulates at 1% per 100 miles
  - Multiplies failure chance: 1.0 - 1.8× depending on wear level
- **Graduated Failures** (when part fails):
  - 50% minor (15-40% pace loss)
  - 30% moderate (35-60% pace loss)
  - 20% terminal (DNF)

**Component Lifecycle**:
- Parts degrade with mileage (track/weather affects wear rate)
- Rebuilds reset wear to 0% (expensive, requires off-week budget)
- Manufacturer bias affects reliability floor:
  - Fragile (40-60 rel): Aggressive performance, high DNF risk
  - Balanced (60-75 rel): Competitive, reliable
  - Bulletproof (80-95 rel): Conservative, ultra-reliable

**Performance Ceiling**: Each manufacturer has a performance ceiling (inverse correlation with reliability).

---

### 3. Economy Management

**Budget Allocation** (Seasonal, $2.5M total):
- Staff costs (annual salaries)
- Rider salaries (including bonuses per contract)
- Bike hardware (engine leases, chassis leases)
- Equipment maintenance (tires, consumables, repairs)
- R&D investment (unlock tech paths)
- Reserved cash buffer (minimum recommended 10%)

**Cash Flow** (Per-round):
- Appearance fees: $1k per active rider per round
- Finish bonuses: Scaled by class (min $5k at 40th place)
- Win bonuses: $20-75k per class
- Purse share (75%): Paid to operational budget

**Contract Structure**:
- Base salary (per-season)
- Signing bonus (lump sum)
- Appearance fee (per round)
- Win bonus (per victory)
- Podium bonus (top 3 finish)
- Championship bonus (title win)
- No. 1 Rider status (team lead, negotiating power)
- Release clause (buyout cost, 0 = none)
- Teammate veto (can block teammate signings)

---

### 4. Design System (Dark Glass-Morphism)

**Color Palette** (locked):
- Background: `#0a0e27`
- Primary Panel: `#15192e`
- Secondary Panel: `#1a1f3a`
- Accent Green: `#2ecc71` (success, highlights)
- Accent Blue: `#3498db` (info, interactive)
- Accent Red: `#e74c3c` (warnings, failures)
- Accent Gold: `#f39c12` (leadership, premium)

**Motion**:
- Transition duration: 0.2-0.3s ease
- Use backdrop blur for glass-morphism depth

**Responsive Breakpoints**:
- Mobile: 600px
- Tablet: 900px
- Desktop: 1200px+

**Components**:
- `.screen` = full page container with topbar
- `.panel` = rounded card with backdrop blur
- `.tabs` = navigation row
- `.row` = flexbox row container (mb = margin-bottom)
- `.muted` = secondary text color
- `.ghost` / `.primary` = button styles
- `.scroll` = overflow-y auto

---

## Architecture Overview

```
src/
├── data/                    # Core data models & constants
│   ├── types.ts             # TypeScript interfaces (Rider, Team, Track, etc.)
│   ├── universe.ts          # Universe generator, seed-based world creation
│   ├── bikes.ts             # Engines, chassis, tires, build costs
│   ├── setups.ts            # Electronics, exhaust systems, round configs
│   ├── brand.ts             # Manufacturers, tire brands, sponsors
│   ├── staff.ts             # Coaching staff, facility levels
│   ├── classes.ts           # NAMC class definitions (350, 250, etc.)
│   ├── namc.ts              # NAMC-specific constants (calendar, rules)
│   └── tracks.ts            # Tracks DB (road courses, stadiums, nationals)
│
├── game/                    # Game logic layer
│   ├── index.ts             # GameManager (orchestrates teams, seasons)
│   ├── state.ts             # CareerState, runRound, riderStandings
│   ├── economy.ts           # Budget, purse distribution, cash flow
│   ├── training.ts          # Rider training gains, stamina system
│   ├── reliability.ts       # Part failures, wear accumulation
│   └── strategy.ts          # Race strategies, approach mapping
│
├── sim/                     # Race simulation engine
│   ├── index.ts             # Main race sim (40-rider single gate)
│   ├── weekend.ts           # WeekendResult (qual + race data)
│   ├── physics.ts           # Pace model, weather effects
│   ├── drs.ts               # DRS detection, overtake simulation
│   └── grid.ts              # Grid formation, starting procedures
│
├── ui/                      # Preact UI components
│   ├── Hub.tsx              # Main HQ screen (calendar, standings, tabs)
│   ├── HubScreen.tsx        # Hub wrapper with state management
│   ├── TeamDashboard.tsx    # NAMC team management dashboard
│   ├── RaceView.tsx         # Live race broadcast view
│   ├── NewGame.tsx          # Game creation (name, discipline, class)
│   ├── Logo.tsx             # Team logo renderer
│   ├── dashboard/           # Dashboard sub-components
│   │   ├── ChampionshipStandings.tsx
│   │   ├── RiderRoster.tsx
│   │   ├── FinancialTracker.tsx
│   │   ├── SeasonCalendar.tsx
│   │   ├── ClassPanel.tsx
│   │   └── ...
│   ├── garage/              # Garage management
│   │   └── PartsManager.tsx
│   ├── showroom/            # Parts shopping
│   │   ├── EngineShowroom.tsx
│   │   ├── ChassisShowroom.tsx
│   │   ├── TiresShowroom.tsx
│   │   └── ...
│   └── training/            # Training management
│       └── TrainingCenter.tsx
│
├── api/                     # Backend (Express)
│   ├── server.ts            # Express app, save/load routes
│   └── routes/              # API endpoints
│
└── util/                    # Utilities
    ├── rng.ts               # Seeded RNG (determines race outcomes)
    └── ...
```

---

## Data Model

### Core Entities

**Universe**:
```typescript
interface Universe {
  seed: number;                              // Determines all randomness
  season: number;                            // Year (2027, etc.)
  riders: Record<string, Rider>;             // All 160 riders
  teams: Record<string, Team>;               // All 20 teams
  manufacturers: Record<string, Manufacturer>;
  sponsors: Record<string, Sponsor>;
  tireBrands: Record<string, TireBrand>;
  tracks: Record<string, Track>;
  calendars: Record<DisciplineId, CalendarRound[]>;  // 20 rounds per discipline
}
```

**Rider**:
```typescript
interface Rider {
  id: string;
  name: string;
  age: number;                     // Affects training gain & decline
  nationality: string;
  number: number;                  // Race bib
  
  skills: RiderSkills;             // 9 independent skills (0-100)
  potential: number;               // HIDDEN: skill ceiling
  overall: number;                 // Derived headline rating
  stamina: number;                 // 0-100, training resource
  traits: RiderTrait[];            // Positive/negative modifiers
  
  salary: number;                  // Per-season
  contract: RiderContract;         // Full contract terms
  morale: number;                  // 0-100
  
  careerWins: number;
  careerPodiums: number;
  championships: number;
  legacyPlate: 'none' | 'gold' | 'platinum' | 'diamond';
  
  teamId: string | null;
  classId: ClassId | null;         // 350, 250, etc.
  championship: ChampionshipId;    // 'road', 'fourStroke', 'twoStroke'
  
  isFemale: boolean;
  bench: boolean;                  // Reserve status
  injuredForRounds: number;        // 0 = fit
}
```

**Team**:
```typescript
interface Team {
  id: string;
  name: string;
  shortName: string;               // 3-4 letters for timing tower
  
  discipline: DisciplineId;        // 'namc' | 'gp' | 'sbk'
  championship: ChampionshipId;    // Which championship (dual-charter teams can run 2)
  orgId: string;                   // Shared org ID for dual-charter teams
  
  logo: LogoSpec;
  colors: { primary: string; secondary: string };
  
  manufacturerId: string;          // Engine supplier
  tireBrandId: string;             // Tire supplier (NAMC only)
  
  bike: BikeDev;                   // Current engine/handling/reliability stats
  bikeSetup: BikeSetup;            // Per-round setup with engine mode & wear
  
  budget: number;                  // Cash on hand
  prestige: number;                // 1-100 team prestige
  isPlayer: boolean;               // Player-controlled team
  
  facilityLevel: number;           // 1-5 (affects training gain)
  coachQuality: number;            // 0.8-1.5 (affects training gain)
  
  classIds: ClassId[];             // Classes this team fields riders in
  strikes: number;                 // NAMC three-strike penalties
}
```

**BikeSetup**:
```typescript
interface BikeSetup {
  engineMode: EngineMode;              // 'conserve' | 'standard' | 'push' | 'attack'
  components: Record<string, BikeComponent>;  // {engine, chassis, suspension, etc.}
  mileageThisRound: number;
}

interface BikeComponent {
  id: string;
  name: string;
  type: 'engine' | 'gearbox' | 'suspension' | 'brakes' | 'chassis' | 'electronics';
  reliability: number;              // 0-100 base failure rate
  wear: number;                     // 0-100 (1% per 100 miles)
  mileageMiles: number;
  lastRebuild?: number;             // Round number
}
```

---

## Game State & Progression

**CareerState** (Persistent):
- Current season, round, discipline
- Player team ID & focus class
- Championship standings (cached per class)
- Team standings
- Messages & notifications
- Saved round history

**Round Flow**:
1. **Approach Selection**: Player sets rider strategies (conserve/normal/push)
2. **Run Race**: Simulation generates race results
3. **Update State**: Apply results to standings, cash flow, rider stats
4. **Save Career**: Persist to localStorage or backend

**Race Simulation**:
- 40-rider single gate (one moto, no relegation)
- Pace determined by: rider skill blend + bike reliability + engine mode + track conditions
- Weather (track moisture) affects wet-skill riders
- DRS/overtake logic for realistic action
- Failure simulation per component reliability & wear

---

## Integration Checklist

### Economy System
- [x] Budget allocation (initial $2.5M)
- [x] Purse distribution per round (25% to riders)
- [x] Rider salary payroll (base + appearance + bonuses)
- [x] Cash flow tracking (revenue per round)
- [x] R&D investment tracking
- [ ] Transfer market (free-agent signing)
- [ ] Contract negotiation UI
- [ ] Mid-season budget adjustments

### Rider Development
- [x] 9-skill training system
- [x] Stamina resource management
- [x] Age-based modifiers (decline post-32)
- [x] Training facility scaling (levels 1-5)
- [x] Coach quality modifiers
- [ ] Trait interaction (wet-master = +40 wet skill)
- [ ] Hidden potential ceiling (display ceiling vs. actual)
- [ ] Injury system (overtraining penalty)

### Parts Reliability & Economy
- [x] Component wear accumulation
- [x] Engine mode wear multipliers
- [x] Failure chance calculation
- [x] Graduated failure severity (minor/moderate/terminal)
- [x] Manufacturer financial health (stable/stressed/crisis/recovering)
- [x] Engine order system (off-season ordering, lead times 1-2 weeks)
- [x] Order fulfillment based on manufacturer capacity
- [x] ATK manufacturer (always-available parts company)
- [ ] Rebuild system (reset wear, cost budget)
- [ ] Performance ceiling by manufacturer (getEnginePerformanceModifier wired into sim)
- [ ] Mid-race pit-stop strategy (future)

### Race Simulation
- [x] Single-gate 40-rider format
- [x] Pace model (skill + bike + weather)
- [x] Component failure injection
- [ ] Wet weather logic (track moisture, wet skill bonus)
- [ ] DRS/overtake sequences
- [ ] Driver championship points (F1 scoring)
- [ ] Constructor points (manufacturer ranking)

### NAMC Specifics
- [x] 4-class championship (350, 250, 250P, Women's)
- [x] Dual-charter teams (run 2S + 4S)
- [x] Three-strike penalty system
- [x] Stadium rounds (1-12) vs. Nationals (13-20)
- [ ] Class-specific salaries & purses
- [ ] Women's 250 equality (same calendar, points)
- [ ] Cross-championship rider transfers

### UI/Dashboard
- [x] HQ hub (standings, calendar, roster)
- [x] Team Dashboard (NAMC team management)
- [x] Rider roster view (stats, contracts)
- [x] Financial tracker (budget, cash flow)
- [x] Standings display (driver + team rankings)
- [x] Garage / parts manager
- [x] Showroom (parts shopping)
- [x] Training center (skill development)
- [ ] Transfer market (free-agent bidding)
- [ ] Contract extension UI
- [ ] Mid-round injury reports
- [ ] League health panel (regulation checks)

### Persistence & Save/Load
- [ ] Backend API routes (save/load career)
- [ ] Game export (JSON download)
- [ ] Game import (JSON upload)
- [ ] Cloud sync (optional future)

---

## Common Tasks & Patterns

### Adding a New Rider Skill

If expanding beyond 9 skills:
1. Add to `RiderSkills` interface in `src/data/types.ts`
2. Add age modifier logic to `ageModifier()` in `src/game/training.ts`
3. Add UI label/icon in relevant dashboard components
4. Update training center to include new skill selection
5. Update race simulation to use new skill in pace calculation

### Implementing a New Constraint

e.g., "riders under 20 get +15 starts skill":
1. Edit rider generator in `src/data/universe.ts`
2. Apply modifier when assigning skills: `if (age < 20) skills.starts += 15`
3. Document constraint in this file under "Locked Specifications"
4. Add test to verify constraint is always honored

### Tweaking Economy Values

- Base salary floor per class: `RIDER_SALARY_FLOOR` in `src/game/economy.ts`
- Purse distribution: `ROUND_PURSE`, `WIN_BONUS` in same file
- Training gain: `BASE_GAIN`, `ageModifier()` in `src/game/training.ts`
- Part costs: `calculateBikeBuildCost()` in `src/data/bikes.ts`

**Important**: Change values in ONE place; re-derive all dependent values (don't hardcode).

### Race Simulation: Adding Weather Effects

1. Add weather field to `CalendarRound`: `weather?: 'dry' | 'wet' | 'mixed'`
2. In sim engine, apply wet-skill multiplier: `pace *= 1.0 + (wetSkill * 0.002)`
3. Scale tire grip: `tireGrip *= weather === 'wet' ? 0.85 : 1.0`
4. Document weather bias on track in `src/data/tracks.ts`

### Working with Teams & Riders

```typescript
// Get all riders for a team (including bench)
import { ridersOfTeam } from 'src/data/universe';
const myRiders = ridersOfTeam(universe, teamId);

// Get team standings for a class
import { teamStandingsFor } from 'src/game/state';
const standings = teamStandingsFor(state, classId);

// Filter active riders (not injured, not bench)
const active = myRiders.filter(r => !r.bench && r.injuredForRounds === 0);
```

---

## Documentation Standards

When documenting a new feature or system:

1. **Spec Block**: What does it do? Why?
2. **Data Structures**: Show TypeScript interface
3. **Formulas**: Document math with concrete examples
4. **Edge Cases**: List boundary conditions (age limits, cap values, etc.)
5. **Integration Points**: Which other systems does it touch?
6. **Configuration**: Where are tunable values (constants)?
7. **Testing Vectors**: How to verify it works

---

## Glossary

| Term | Meaning |
|------|---------|
| NAMC | National Amateur Motorcycle Championship |
| S4 / 4S | Four-stroke engine class |
| S2 / 2S | Two-stroke engine class |
| Purse | Prize money pool distributed per round |
| Appearance Fee | Guaranteed per-round rider payment (not performance-based) |
| Legacy Plate | Championship trophy tracking (none/gold/platinum/diamond) |
| Headroom | `potential - currentSkill` = remaining growth available |
| Engine Mode | Wear multiplier setting (conserve 0.6× to attack 2.2×) |
| Graduated Failure | Part fails with varying severity (minor/moderate/terminal) |
| Stadium Round | Mixed terrain, rounds 1-12 |
| Outdoor National | Pure dirt, rounds 13-20 |
| Dual-Charter | Single org runs riders in both 4S + 2S championships |
| Three-Strike | Penalty system: warnings → deductions → suspension |
| Hub | Main team HQ screen (calendar, standings, finances) |
| Prestige | Team's public standing (1-100, affects sponsorship/draft) |

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/data/types.ts` | All TypeScript interfaces (source of truth for data model) |
| `src/game/economy.ts` | Budget, purses, salaries, cash flow |
| `src/game/training.ts` | Rider skill gains, stamina, age modifiers |
| `src/game/state.ts` | CareerState, round progression, save/load |
| `src/sim/index.ts` | Race simulation engine (pace, failures, overtakes) |
| `src/ui/Hub.tsx` | Main HQ screen |
| `src/ui/TeamDashboard.tsx` | NAMC team management |
| `src/data/namc.ts` | NAMC-specific constants (classes, calendar rules) |
| `src/data/universe.ts` | Universe generator, seeded RNG for deterministic worlds |

---

## Next Steps

### High Priority
1. Implement transfer market (free-agent signings, contract negotiations)
2. Add weather simulation (wet tracks affect pace differently)
3. Implement three-strike penalty enforcement UI
4. Add R&D investment UI (unlock tech paths)

### Medium Priority
1. Injury system UI (report injuries, recovery timeline)
2. Streaks & momentum (winning streak affects morale/setup confidence)
3. Sponsor system (prestige unlocks high-tier sponsors)
4. League health indicators (regulatory fines, budget audits)

### Polish
1. Replay viewer (show race highlights, overtakes, failures)
2. Player commentary (generate narrative for races)
3. Achievement system (milestones, trophies)
4. Difficulty settings (salary caps, budget constraints, RNG severity)

---

## Questions? 

For clarifications on **locked specs**, consult the NAMC v15.1 rulebook section references in this document.  
For **code questions**, search this file first, then read the implementation in `src/game/` or `src/sim/`.  
For **architecture questions**, reference the folder structure and integration checklist above.

---

**Last Updated**: 2026-07-17 — Parts economy system wired (manufacturer financial health, 1-2 week lead times, ATK always-available)  
**Documentation Agent**: Claude, Documentation & Knowledge Base  
**Status**: Active — v15.3 rulebook locked, parts economy live, long-career testing phase
