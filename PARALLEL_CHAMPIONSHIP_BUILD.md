# Parallel Championship Implementation
**Status**: ACTIVE (every 6 hours)  
**Timeline**: Week 1 (target UE5 demo working)  
**Strategy**: 3 parallel agent teams + main thread

---

## Architecture: 3 Discipline Threads

```
NAMC (Motocross) ─────── Phase 2: Supply Chain
  ├─ Phase 2a: Supplier Capacity (2-3h)
  ├─ Phase 2b: Demand Pricing (1-2h)
  ├─ Phase 2c: Disruptions (1-2h)
  └─ Testing: 10-season sim with supply constraints

GP (Road Racing) ──────── Parallel Research
  ├─ Agent 1: FIA MotoGP Rulebook Analysis
  ├─ Agent 2: Data Model (tracks, riders, teams)
  ├─ Agent 3: Economy System (purses, salaries, contracts)
  ├─ Agent 4: Race Simulation (road-specific physics)
  └─ Agent 5: UI/Dashboard

SBK (Super Bike) ──────── Parallel Research
  ├─ Agent 1: WorldSBK Rulebook Analysis
  ├─ Agent 2: Data Model (tracks, riders, teams)
  ├─ Agent 3: Economy System (purses, salaries, contracts)
  ├─ Agent 4: Race Simulation (production-based bikes)
  └─ Agent 5: UI/Dashboard
```

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

### Cycle 2 (Hours 6-12): Data Model Implementation
**Trigger**: Routine fires 6h later  
**Agents deployed**: 2 data agents per road discipline

```
1. Agent: GP Data Model
   Input: MOTOGP_RULEBOOK_ANALYSIS.md
   Task: Create src/data/gp.ts with:
     - Teams (Ducati, Aprilia, Honda, KTM, Yamaha)
     - Riders (MotoGP grid, all 25 riders)
     - Tracks (23 GP circuits: Mugello, Silverstone, Aragon, etc.)
     - Purses (based on official FIA prize money)
     - Points scale (25/20/16/13/11/10/9/8/7/6/5/4/3/2/1)
     - Contract structure (team orders, title contention, constructor program)
   Output: src/data/gp.ts (complete data model)

2. Agent: SBK Data Model
   Input: WORLDSBK_RULEBOOK_ANALYSIS.md
   Task: Create src/data/sbk.ts with:
     - Teams (Kawasaki, BMW, Ducati, Honda)
     - Riders (WorldSBK grid, riders per team)
     - Tracks (13 SBK circuits: Phillip Island, Misano, Donington, etc.)
     - Purses (based on WorldSBK official prize money)
     - Points scale (20/16/13/11/10/9/8/7/6/5/4/3/2/1)
     - Contract structure (manufacturer programs, privateer teams)
   Output: src/data/sbk.ts (complete data model)

3. Main: NAMC Phase 2 Parallel Work
   Task: Implement supply chain Phase 2b (demand pricing)
   Output: Continue src/game/supply-chain.ts
```

**Success criteria**:
- [ ] src/data/gp.ts complete and compilable
- [ ] src/data/sbk.ts complete and compilable
- [ ] All teams/riders/tracks imported from rulebooks
- [ ] NAMC supply chain Phase 2b ~50% complete

---

### Cycle 3 (Hours 12-18): Economy & Purse System
**Trigger**: Routine fires 6h later  
**Agents deployed**: 1 economy agent per discipline

```
1. Agent: GP Economy
   Input: FIA MotoGP official prize money structure
   Task: Implement src/game/gp-economy.ts with:
     - Purse distribution (constructors vs riders split)
     - Bonus structure (win, podium, fastest lap)
     - Contract salary floors per tier
     - TV revenue distribution
     - Manufacturer development fund
   Output: src/game/gp-economy.ts

2. Agent: SBK Economy
   Input: WorldSBK official prize money structure
   Task: Implement src/game/sbk-economy.ts with:
     - Purse distribution (team vs manufacturer split)
     - Bonus structure (win, podium, fastest lap)
     - Contract salary floors
     - Manufacturer support fund
     - Satellite team economics
   Output: src/game/sbk-economy.ts

3. Main: NAMC Phase 2 Parallel Work
   Task: Implement supply chain Phase 2c (disruption events)
   Output: Finalize src/game/supply-chain.ts
```

**Success criteria**:
- [ ] src/game/gp-economy.ts complete
- [ ] src/game/sbk-economy.ts complete
- [ ] All purse values validated against official sources
- [ ] NAMC supply chain Phase 2 ~100% complete

---

### Cycle 4 (Hours 18-24): Race Simulation & Integration
**Trigger**: Routine fires 6h later  
**Agents deployed**: 1 sim agent per discipline

```
1. Agent: GP Race Simulation
   Task: Adapt sim/engine.ts for road racing:
     - DRS zones (following distance, straightaway activation)
     - Pit stop strategy (tire/fuel decisions)
     - Weather dynamic (track temp affects grip)
     - Tire compound choices (soft/medium/hard)
     - Qualifying format (FP1/FP2/FP3 → Q1/Q2)
   Output: src/sim/gp-engine.ts

2. Agent: SBK Race Simulation
   Task: Adapt sim/engine.ts for superbike racing:
     - Pit stop strategy (bike change mechanics)
     - Production bike constraints (spec parts)
     - Weather impact (higher sensitivity than MotoGP)
     - Tire management (durability across 25-lap race)
     - Qualifying format (combined/separated races)
   Output: src/sim/sbk-engine.ts

3. Main: Testing & Integration
   Task: Wire NAMC Phase 2 into test-complete-system.ts
   Output: test-namc-phase2.ts (verify supply chain works)
```

**Success criteria**:
- [ ] src/sim/gp-engine.ts complete and compiles
- [ ] src/sim/sbk-engine.ts complete and compiles
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

## Files to Create/Update

```
src/data/
  ├── gp.ts               [NEW] MotoGP discipline data
  ├── sbk.ts              [NEW] SBK discipline data
  └── types.ts            [UPDATE] Add GP/SBK types

src/game/
  ├── gp-economy.ts       [NEW] GP purse, salary, contract logic
  ├── sbk-economy.ts      [NEW] SBK purse, salary, contract logic
  ├── supply-chain.ts     [UPDATE] Phase 2 complete
  └── state.ts            [UPDATE] Add GP/SBK championship progression

src/sim/
  ├── gp-engine.ts        [NEW] GP race simulation
  └── sbk-engine.ts       [NEW] SBK race simulation

Docs/
  ├── MOTOGP_RULEBOOK_ANALYSIS.md     [NEW] FIA rulebook breakdown
  └── WORLDSBK_RULEBOOK_ANALYSIS.md   [NEW] WorldSBK rulebook breakdown

Tests/
  ├── test-gp-season.ts      [NEW] Verify GP 25-race season
  └── test-sbk-season.ts     [NEW] Verify SBK 13-race season
```

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
  ├─ NAMC Career (motocross, 20-round, 4 classes)
  ├─ GP Career (road racing, 25-round, 1 class)
  └─ SBK Career (superbike, 13-round, 1 class)

[Each discipline]:
  ✓ Full season simulation running
  ✓ Economics working (budget, R&D, supply chain constraints)
  ✓ Randomness working (different winners per season)
  ✓ Failures cascading (mechanical, psychological)
  ✓ Championship crowned at season end
  ✓ Off-season free agency/draft
  ✓ Next season ready to play

[Demo Loop]:
  1. Create career
  2. Play season 1-3 (see progression)
  3. Restart, try different strategy
  4. Repeat ("play it over and over, see what breaks")
  5. Report issues
  6. Agents fix issues (agents can hire other agents as needed)
  7. Deploy fix to demo
  8. Repeat

[When this works]: You know the engine is solid. Ready for polish and shipping.
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

