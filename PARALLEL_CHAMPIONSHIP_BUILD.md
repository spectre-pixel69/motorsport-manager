# Parallel Championship Implementation
**Status**: ACTIVE (every 6 hours)  
**Timeline**: Week 1 (target UE5 demo working)  
**Strategy**: 3 parallel agent teams + main thread

---

## Architecture: 3 Discipline Threads (Each with 3 Classes)

```
NAMC (Motocross) ─────── Phase 2: Supply Chain
  ├─ Phase 2a: Supplier Capacity (2-3h)
  ├─ Phase 2b: Demand Pricing (1-2h)
  ├─ Phase 2c: Disruptions (1-2h)
  └─ Testing: 10-season sim with supply constraints

GP (Road Racing) ──────── 3-Class System
  ├─ Moto3 (125cc feeder class)
  │   ├─ ~30 riders, ~15 teams
  │   ├─ 13-round calendar
  │   └─ Entry-level progression path
  │
  ├─ Moto2 (intermediate class)
  │   ├─ ~30 riders, ~15 teams
  │   ├─ 13-round calendar
  │   └─ Path to MotoGP
  │
  └─ MotoGP (premier class)
      ├─ ~25 riders, ~11 teams
      ├─ 25-round calendar
      └─ Manufacturer factory programs

SBK (Super Bike) ──────── 3-Class System
  ├─ SSP300 (Supersport 300, feeder)
  │   ├─ ~30+ riders, ~20+ teams
  │   ├─ 13-round calendar
  │   └─ Entry-level single-make bikes
  │
  ├─ SSP (Supersport, intermediate)
  │   ├─ ~25 riders, ~15 teams
  │   ├─ 13-round calendar
  │   └─ Open bike class, mixed manufacturers
  │
  └─ SBK (World Superbike, premier)
      ├─ ~30 riders, ~11+ teams
      ├─ 13-round calendar (double-headers)
      └─ Factory + satellite manufacturer teams
```

**Scale**: 9 total class hierarchies (3 disciplines × 3 classes each)
- **Riders**: 200+ across all series
- **Teams**: 60+ organizations
- **Tracks**: Shared circuits (Mugello, Misano, etc. run multiple championships)
- **Economies**: 3 per discipline (different purse structures, sponsorship models)

---

## 6-Hour Cycle (Recurring)

### Cycle 1 (Hours 0-6): Research & Specification
**Trigger**: Routine fires every 6 hours  
**Agents deployed**: 3 research agents (1 per discipline)

```
1. Agent: GP Research
   Task: Download latest FIA MotoGP rulebook 2025+
   Output: MOTOGP_RULEBOOK_ANALYSIS.md (125cc, 300, Moto3, Moto2, MotoGP classes, points, qualifying, race format)

2. Agent: SBK Research  
   Task: Download latest WorldSBK rulebook 2025+
   Output: WORLDSBK_RULEBOOK_ANALYSIS.md (Supersport, Supersport 300, World Superbike format, rules, points)

3. Main: NAMC Phase 2 Parallel Work
   Task: Implement supply chain Phase 2a (supplier capacity)
   Output: src/game/supply-chain.ts (Supplier interface, capacity queues)
```

**Success criteria**:
- [ ] MotoGP rulebook downloaded and parsed
- [ ] SBK rulebook downloaded and parsed
- [ ] NAMC supply chain Phase 2a ~50% complete
- [ ] Rulebook analyses saved as .md files

---

### Cycle 2 (Hours 6-12): Data Model Implementation (3-Class Structure)
**Trigger**: Routine fires 6h later  
**Agents deployed**: 3 agents (one per class) per road discipline

```
GP Discipline (3 agents):
──────────────────────────

1. Agent: Moto3 Data Model
   Input: MOTOGP_RULEBOOK_ANALYSIS.md (Moto3 section)
   Task: Create src/data/gp-moto3.ts with:
     - Teams (~15 teams: Leopard, Pons, GASGAS, etc.)
     - Riders (~30 riders, all under 18, international grid)
     - Tracks (13-round calendar on GP circuits)
     - Purses (official FIA Moto3 prize money)
     - Points scale (25/20/16/13/11/10/9/8/7/6/5/4/3/2/1)
     - Contract structure (team development, talent scouting)
   Output: src/data/gp-moto3.ts

2. Agent: Moto2 Data Model
   Input: MOTOGP_RULEBOOK_ANALYSIS.md (Moto2 section)
   Task: Create src/data/gp-moto2.ts with:
     - Teams (~15 teams: Kalex, Speed Up, NTS chassis suppliers)
     - Riders (~30 riders, 18-25 age range, progression from Moto3)
     - Tracks (13-round calendar on GP circuits)
     - Purses (official FIA Moto2 prize money)
     - Points scale (25/20/16/13/11/10/9/8/7/6/5/4/3/2/1)
     - Contract structure (manufacturer supply deals)
   Output: src/data/gp-moto2.ts

3. Agent: MotoGP Data Model
   Input: MOTOGP_RULEBOOK_ANALYSIS.md (MotoGP section)
   Task: Create src/data/gp-motogp.ts with:
     - Teams (~11 factory + satellite teams: Ducati, Aprilia, Honda, KTM, Yamaha, Suzuki)
     - Riders (~25 riders, elite progression from Moto2)
     - Tracks (25-round calendar: Mugello, Silverstone, Aragon, COTA, Sepang, etc.)
     - Purses (official FIA MotoGP prize money, highest of all classes)
     - Points scale (25/20/16/13/11/10/9/8/7/6/5/4/3/2/1)
     - Contract structure (factory programs, constructor championships, title contention)
   Output: src/data/gp-motogp.ts

SBK Discipline (3 agents):
──────────────────────────

4. Agent: SSP300 Data Model
   Input: WORLDSBK_RULEBOOK_ANALYSIS.md (SSP300 section)
   Task: Create src/data/sbk-ssp300.ts with:
     - Teams (~20+ teams, regional competitors)
     - Riders (~30+ riders, young talent, single-make bikes)
     - Tracks (13-round calendar, selected WorldSBK venues)
     - Purses (Dorna WorldSBK SSP300 prize money)
     - Points scale (20/16/13/11/10/9/8/7/6/5/4/3/2/1)
     - Contract structure (bike manufacturers, team sponsorships)
   Output: src/data/sbk-ssp300.ts

5. Agent: SSP Data Model
   Input: WORLDSBK_RULEBOOK_ANALYSIS.md (SSP section)
   Task: Create src/data/sbk-ssp.ts with:
     - Teams (~15 teams: Yamaha, Kawasaki, Honda, Triumph)
     - Riders (~25 riders, progression from SSP300)
     - Tracks (13-round calendar, all WorldSBK venues)
     - Purses (Dorna WorldSBK SSP prize money)
     - Points scale (20/16/13/11/10/9/8/7/6/5/4/3/2/1)
     - Contract structure (manufacturer support, open bikes)
   Output: src/data/sbk-ssp.ts

6. Agent: SBK Data Model
   Input: WORLDSBK_RULEBOOK_ANALYSIS.md (SBK section)
   Task: Create src/data/sbk-world.ts with:
     - Teams (~11+ teams: Kawasaki, BMW, Ducati, Honda, Yamaha, R1, WSBK grid)
     - Riders (~30 riders, elite from SSP or international talent)
     - Tracks (13-round calendar double-headers: Phillip Island, Misano, Donington, Estoril, etc.)
     - Purses (Dorna WorldSBK prize money, shared with SSP/SSP300)
     - Points scale (20/16/13/11/10/9/8/7/6/5/4/3/2/1)
     - Contract structure (factory programs, manufacturer support, satellite teams)
   Output: src/data/sbk-world.ts

Main Thread:
────────────
7. Main: NAMC Phase 2 Parallel Work
   Task: Implement supply chain Phase 2b (demand pricing)
   Output: Continue src/game/supply-chain.ts
```

**Success criteria**:
- [ ] src/data/gp-moto3.ts complete and compilable
- [ ] src/data/gp-moto2.ts complete and compilable
- [ ] src/data/gp-motogp.ts complete and compilable
- [ ] src/data/sbk-ssp300.ts complete and compilable
- [ ] src/data/sbk-ssp.ts complete and compilable
- [ ] src/data/sbk-world.ts complete and compilable
- [ ] All teams/riders/tracks imported from rulebooks (180+ riders, 60+ teams)
- [ ] NAMC supply chain Phase 2b ~50% complete

---

### Cycle 3 (Hours 12-18): Economy & Purse System (Per-Class)
**Trigger**: Routine fires 6h later  
**Agents deployed**: 3 economy agents per discipline (one per class)

```
GP Discipline Economy (3 agents):
─────────────────────────────────

1. Agent: Moto3 Economy
   Input: FIA Moto3 official prize money structure
   Task: Implement src/game/gp-moto3-economy.ts with:
     - Purse distribution (per-round and season totals)
     - Bonus structure (win, podium, fastest lap)
     - Contract salary floors (junior riders, team bikes, sponsorship)
     - Team operational budget (small budgets, growing programs)
   Output: src/game/gp-moto3-economy.ts

2. Agent: Moto2 Economy
   Input: FIA Moto2 official prize money structure
   Task: Implement src/game/gp-moto2-economy.ts with:
     - Purse distribution (higher than Moto3)
     - Bonus structure (win, podium, fastest lap)
     - Contract salary floors (intermediate tier)
     - Chassis supplier economics (Kalex, Speed Up revenue models)
   Output: src/game/gp-moto2-economy.ts

3. Agent: MotoGP Economy
   Input: FIA MotoGP official prize money structure (highest tier)
   Task: Implement src/game/gp-motogp-economy.ts with:
     - Purse distribution (constructors + riders, massive budgets)
     - Bonus structure (win, podium, fastest lap, championships)
     - Contract salary floors (elite riders, factory programs)
     - Manufacturer support fund (engine development budgets)
     - TV revenue distribution (constructors get massive shares)
   Output: src/game/gp-motogp-economy.ts

SBK Discipline Economy (3 agents):
──────────────────────────────────

4. Agent: SSP300 Economy
   Input: WorldSBK SSP300 prize money structure
   Task: Implement src/game/sbk-ssp300-economy.ts with:
     - Purse distribution (entry-level salaries)
     - Bonus structure (win, podium, fastest lap)
     - Single-make bike economics (standardized costs)
     - Team budgets (small regional teams)
   Output: src/game/sbk-ssp300-economy.ts

5. Agent: SSP Economy
   Input: WorldSBK Supersport prize money structure
   Task: Implement src/game/sbk-ssp-economy.ts with:
     - Purse distribution (intermediate tier)
     - Bonus structure (win, podium, fastest lap)
     - Open bike manufacturer economics (Yamaha, Kawasaki, Honda, Triumph support)
     - Satellite team budgets
   Output: src/game/sbk-ssp-economy.ts

6. Agent: SBK Economy
   Input: WorldSBK official prize money structure (premier tier)
   Task: Implement src/game/sbk-world-economy.ts with:
     - Purse distribution (constructors + riders, factory programs)
     - Bonus structure (win, podium, fastest lap, championships)
     - Double-header race economics (two races same weekend)
     - Manufacturer support fund (bike development, satellite team support)
     - Factory team budgets vs privateer economics
   Output: src/game/sbk-world-economy.ts

Main Thread:
────────────
7. Main: NAMC Phase 2 Parallel Work
   Task: Implement supply chain Phase 2c (disruption events)
   Output: Finalize src/game/supply-chain.ts
```

**Success criteria**:
- [ ] All 6 economy files complete (gp-moto3, gp-moto2, gp-motogp, sbk-ssp300, sbk-ssp, sbk-world)
- [ ] All purse values validated against official FIA/Dorna sources
- [ ] Class progression economics working (junior tier vs elite tier)
- [ ] Manufacturer support models reflect real sponsorship structures
- [ ] NAMC supply chain Phase 2 ~100% complete

---

### Cycle 4 (Hours 18-24): Race Simulation & Integration (Per-Class)
**Trigger**: Routine fires 6h later  
**Agents deployed**: 3 sim agents per discipline (one per class)

```
GP Discipline Simulation (3 agents):
────────────────────────────────────

1. Agent: Moto3 Race Simulation
   Task: Create src/sim/gp-moto3-engine.ts (lightweight bikes, 13 rounds):
     - Rider development (young talent learning curve)
     - Slipstreaming dynamics (crucial in small-displacement racing)
     - Tire degradation (shorter races, 15-20 laps)
     - Qualifying format (single session, position battle)
     - Weather sensitivity (small bikes affected more)
   Output: src/sim/gp-moto3-engine.ts

2. Agent: Moto2 Race Simulation
   Task: Create src/sim/gp-moto2-engine.ts (intermediate class, 13 rounds):
     - Pit stop strategy (fuel/tire changes, rare but crucial)
     - Chassis supplier balance (Kalex vs Speed Up handling differences)
     - Mid-race tactical decisions (tire conservation vs pace)
     - Qualifying format (FP1/FP2 → Q1/Q2)
     - Weather dynamic (moderate sensitivity)
   Output: src/sim/gp-moto2-engine.ts

3. Agent: MotoGP Race Simulation
   Task: Create src/sim/gp-motogp-engine.ts (elite 25-round championship):
     - DRS zones (strategic following, straightaway activation)
     - Advanced pit stop strategy (fuel, tires, setup changes, real-time decisions)
     - Weather dynamics (wet/dry transitions, slick tires, track evolution)
     - Manufacturer/constructor advantage (engine, aerodynamic differences)
     - Qualifying format (FP1/FP2/FP3 → Q1/Q2, wet weather scenarios)
     - Constructor championship (manufacturer points alongside rider)
   Output: src/sim/gp-motogp-engine.ts

SBK Discipline Simulation (3 agents):
─────────────────────────────────────

4. Agent: SSP300 Race Simulation
   Task: Create src/sim/sbk-ssp300-engine.ts (single-make, 13 rounds):
     - Standardized bike constraints (all riders same equipment)
     - Pure rider skill/consistency metric (no manufacturer advantage)
     - Tire management (limited tire choices, racing tires only)
     - Qualifying format (timed session, field determination)
     - Weather sensitivity (entry-level bikes affected by conditions)
   Output: src/sim/sbk-ssp300-engine.ts

5. Agent: SSP Race Simulation
   Task: Create src/sim/sbk-ssp-engine.ts (open production bikes, 13 rounds):
     - Manufacturer differences (Yamaha, Kawasaki, Honda, Triumph handling)
     - Pit stop strategy (tire changes, fuel, setup tuning)
     - Tire management (open tires vs racing slicks, compound selection)
     - Qualifying format (combined or separated qualifying sessions)
     - Weather impact (production-based bikes more sensitive than pure racers)
   Output: src/sim/sbk-ssp-engine.ts

6. Agent: SBK Race Simulation
   Task: Create src/sim/sbk-world-engine.ts (elite superbikes, 13 rounds double-header):
     - Factory bike differences (cutting-edge manufacturer programs)
     - Double-header race dynamics (two races same weekend, tire management across races)
     - Advanced pit strategy (bike changes possible, tire/fuel decisions critical)
     - Tire management (Pirelli tire degradation, compound strategy)
     - Qualifying format (Superpole, race-day practice, wet weather challenges)
     - Manufacturer championship (factory points alongside team points)
   Output: src/sim/sbk-world-engine.ts

Main Thread:
────────────
7. Main: Testing & Integration
   Task: Wire NAMC Phase 2 into test-complete-system.ts
   Output: test-namc-phase2.ts (verify supply chain works)
```

**Success criteria**:
- [ ] All 6 sim engines complete (gp-moto3, gp-moto2, gp-motogp, sbk-ssp300, sbk-ssp, sbk-world)
- [ ] Each simulates 13-25 round season cleanly
- [ ] Class-specific mechanics working (DRS for GP, double-headers for SBK, single-make for SSP300)
- [ ] NAMC Phase 2 test passes (20-round season with supply constraints)
- [ ] Ready for UE5 integration

---

## Week 1 Deliverables (Target: UE5 Demo Ready)

**By end of Day 3**:
- ✅ NAMC Phase 2 complete (supply chain, tested)
- ✅ GP data model complete (teams, riders, tracks, economy)
- ✅ SBK data model complete (teams, riders, tracks, economy)

**By end of Day 5**:
- ✅ GP race sim complete (20-round season simulates cleanly)
- ✅ SBK race sim complete (20-round season simulates cleanly)
- ✅ All three disciplines can run full season

**By end of Day 7**:
- ✅ UE5 client receives NAMC, GP, SBK championship data
- ✅ Player can select discipline (NAMC/GP/SBK) in NewGame screen
- ✅ Full season plays start-to-finish in UE5
- ✅ Demo ready for iteration ("play it over and over, see what breaks")

---

## Agent Deployment Schedule

### Every 6 hours:
```
Agents spawn → research/implement → commit changes → scale down
Humans review → approve or request changes → agents continue next cycle
```

### Handoff Protocol:
```
Cycle N Complete
  ↓
Commit work to branch
  ↓
Human reviews: "Looks good" / "Fix X"
  ↓
IF approved: Agents scale down, wait 6h for next cycle
IF changes needed: Same agents continue in-session to fix
  ↓
Next cycle fires (automatically via routine)
```

---

## Real-World Reference: Why This Works

**MotoGP structure**:
- 25 riders, 11 teams, 25-race season
- Official FIA rulebook defines everything (qualifying, race distance, points, safety)
- Manufacturer programs (Ducati factory, Aprilia satellite, etc.)
- TV rights + prize money are public (FIA publishes annually)

**WorldSBK structure**:
- 30+ riders split across Superbike/Supersport/300 classes
- Official WorldSBK rulebook (different from MotoGP, simpler)
- Manufacturer-backed teams vs privateers (hybrid economy)
- Prize money published by Dorna (SBK organizer)

**Why we can copy**: Both have **published, stable rulebooks**. No proprietary mystery. We read the official docs, implement the rules, simulate, done.

---

## Success = Demo Ready

When all three disciplines work:
1. Player creates career (pick NAMC/GP/SBK)
2. Choose team, sponsor, budget
3. Play full season (20+ rounds)
4. See R&D progression, cash flow, supply chain constraints
5. Championship determined at season end
6. Off-season free agency/draft
7. Next season begins

**That's when you know it works** - by playing it repeatedly, you find the rough edges. Then agents fix those, demo gets updated, you play again. Iterate.

---

## Files to Create/Update (9 Class Structure)

```
src/data/
  ├── gp-moto3.ts         [NEW] Moto3 data (30 riders, 15 teams)
  ├── gp-moto2.ts         [NEW] Moto2 data (30 riders, 15 teams)
  ├── gp-motogp.ts        [NEW] MotoGP data (25 riders, 11 teams)
  ├── sbk-ssp300.ts       [NEW] SSP300 data (30+ riders, 20+ teams)
  ├── sbk-ssp.ts          [NEW] SSP data (25 riders, 15 teams)
  ├── sbk-world.ts        [NEW] World Superbike data (30 riders, 11+ teams)
  └── types.ts            [UPDATE] Add all GP/SBK class types

src/game/
  ├── gp-moto3-economy.ts    [NEW] Moto3 purse/salary/contracts
  ├── gp-moto2-economy.ts    [NEW] Moto2 purse/salary/contracts
  ├── gp-motogp-economy.ts   [NEW] MotoGP purse/salary/contracts
  ├── sbk-ssp300-economy.ts  [NEW] SSP300 purse/salary/contracts
  ├── sbk-ssp-economy.ts     [NEW] SSP purse/salary/contracts
  ├── sbk-world-economy.ts   [NEW] World SBK purse/salary/contracts
  ├── supply-chain.ts        [UPDATE] Phase 2 complete (applies to all series)
  └── state.ts              [UPDATE] Add all GP/SBK championship progression

src/sim/
  ├── gp-moto3-engine.ts     [NEW] Moto3 race simulation (13 rounds)
  ├── gp-moto2-engine.ts     [NEW] Moto2 race simulation (13 rounds)
  ├── gp-motogp-engine.ts    [NEW] MotoGP race simulation (25 rounds)
  ├── sbk-ssp300-engine.ts   [NEW] SSP300 race simulation (13 rounds)
  ├── sbk-ssp-engine.ts      [NEW] SSP race simulation (13 rounds)
  └── sbk-world-engine.ts    [NEW] World SBK race simulation (13 double-headers)

Docs/
  ├── MOTOGP_RULEBOOK_ANALYSIS.md     [NEW] FIA rulebook (Moto3/Moto2/MotoGP)
  └── WORLDSBK_RULEBOOK_ANALYSIS.md   [NEW] WorldSBK rulebook (SSP300/SSP/SBK)

Tests/
  ├── test-gp-moto3-season.ts    [NEW] Verify Moto3 13-race season
  ├── test-gp-moto2-season.ts    [NEW] Verify Moto2 13-race season
  ├── test-gp-motogp-season.ts   [NEW] Verify MotoGP 25-race season
  ├── test-sbk-ssp300-season.ts  [NEW] Verify SSP300 13-race season
  ├── test-sbk-ssp-season.ts     [NEW] Verify SSP 13-race season
  └── test-sbk-world-season.ts   [NEW] Verify SBK 13-double-header season
```

**Scale**: 
- **Files**: 21 new data/game/sim files (6 per discipline class × 3 disciplines, +1 each for supply chain & state updates)
- **Riders**: 200+ across all disciplines
- **Teams**: 60+ organizations
- **Tracks**: Shared circuits (Mugello, Misano, etc. across multiple series)
- **Economies**: 6 independent purse/contract systems (one per class)

---

## Notes for Agents

When spawned, each agent receives this context and focuses narrowly:
- **Research agents**: Read rulebooks, extract rules, produce .md analysis
- **Data agents**: Convert rulebook→data model, validate against source
- **Economy agents**: Calculate purses/salaries from official sources
- **Sim agents**: Implement race physics for road/production bikes
- **UI agents**: Wire dashboards specific to each discipline

**Constraint**: Don't re-implement NAMC. **Copy and adapt**:
- NAMC riders → GP riders (same attributes, road-specific modifiers)
- NAMC teams → GP teams (same structure, manufacturer programs added)
- NAMC race sim → GP/SBK race sims (same engine, discipline-specific tweaks)

**Verify**: Every output compiles cleanly and runs a 1-season test before moving to next cycle.

---

## What Success Looks Like

**Week 1 end, UE5 demo**:
```
[Main Menu]
  ├─ NAMC Career (motocross)
  │   ├─ c125 (limited entry, 125cc)
  │   ├─ c250 (open, 250cc)
  │   └─ c350 (pro, 350cc)
  │
  ├─ GP Career (road racing)
  │   ├─ Moto3 (feeder, 125cc equivalent, 13 rounds)
  │   ├─ Moto2 (intermediate, 13 rounds, progression to MotoGP)
  │   └─ MotoGP (premier, 25-round championship)
  │
  └─ SBK Career (superbike)
      ├─ SSP300 (feeder, single-make, 13 rounds)
      ├─ SSP (intermediate, open bikes, 13 rounds)
      └─ World Superbike (premier, factory teams, 13 double-headers)

[Each class/discipline]:
  ✓ Full season simulation running (13/20/25 rounds depending on series)
  ✓ Economics working per-class (different purses, salary structures)
  ✓ Supply chain constraints (parts take time, demand affects pricing)
  ✓ R&D progression (5x slower than NAMC, 7-10 season grind)
  ✓ Randomness working (different winners per season, no dynasties)
  ✓ Failures cascading (mechanical reliability, psychological tilt)
  ✓ Class progression (Moto3→Moto2→MotoGP, SSP300→SSP→SBK)
  ✓ Championship crowned at season end
  ✓ Off-season free agency/draft/transfers
  ✓ Multi-season career (track progression across 5+ seasons)

[Demo Loop]:
  1. Create career (pick NAMC/GP/SBK)
  2. Pick class (c350 in NAMC, Moto3 in GP, SSP300 in SBK)
  3. Create team
  4. Play season 1-3 (see progression, budget growth, R&D)
  5. Progress to higher class (Moto3→Moto2, SSP300→SSP)
  6. Manage supply chain (order parts, wait for manufacturing, price surges)
  7. Restart, try different strategy
  8. Repeat ("play it over and over, see what breaks")
  9. Report issues
  10. Agents fix issues (agents can hire other agents as needed)
  11. Deploy fix to demo
  12. Repeat

[When this works]: You know the engine is solid. 200+ riders, 60+ teams, 9 class progressions, all working together. Ready for polish and shipping.
```

---

## Timeline Realism

- **Today** (hours 0-6): Rulebook research starts
- **Day 2** (hours 6-18): Data models complete
- **Day 3** (hours 18-24): Economy wired
- **Day 4-5**: Race sims complete, tested
- **Day 6-7**: Integration, UE5 ready
- **Week 2**: Iteration based on demo feedback

---

This is the parallel velocity push. NAMC Phase 2 finishes while GP/SBK spin up simultaneously. By week 1 you have a playable 3-discipline game ready for UE5. Then you play it, find breaks, fix it. That's how you ship.

