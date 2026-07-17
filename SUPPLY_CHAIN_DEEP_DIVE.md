# Supply Chain Deep Dive: Reverse-Engineer & Build
**Status**: Ready to spawn (added to 6-hour routine)  
**Strategy**: 5-agent team + subroutine  
**Goal**: Complete supply chain system designed & implemented by Week 2

---

## The Mission

Motorsport Manager has ~4 dedicated screens for supply chain management. We don't have pixel-perfect documentation, so we'll:
1. **Research** what's visible in MM gameplay
2. **Reverse-engineer** mechanics from player strategies
3. **Design** our own 24-bonus system with percentages
4. **Build** complete implementation (data models, UI, economy integration)
5. **Test** against realistic motorsport scenarios

---

## Agent Team Composition

### Agent 1: MM Supply Chain Archaeologist
**Task**: Deep research on Motorsport Manager supply chain mechanics

Find and analyze:
- All MM gameplay videos showing supply chain screens
- Community strategy posts (bonuses, optimal paths, asset strategies)
- Reddit/Discord discussions about supply chain meta
- Wiki pages (if exist) for MM supplier network
- YouTube guides on supply chain progression
- Any leaked game data or community reverse-engineering

**Deliverable**: `MM_SUPPLY_CHAIN_RESEARCH.md`
- All 24 bonuses mapped (estimated)
- Asset acquisition mechanics (estimated timelines)
- Bonus effects (inferred from gameplay)
- Progression pathways
- Hubs and global expansion strategy

---

### Agent 2: Bonus Architecture Designer
**Task**: Design our 24-bonus system for motorsport

Starting from MM's framework:
- 24 progressive bonuses (tier 1-6, ~4 bonuses per tier)
- Transportation methods: Planes, Trucks, Ships
- Hub locations: Europe, Americas, Asia-Pacific

**Design targets**:
- Tier 1 bonuses: Small bonuses (0.5-1% effects)
- Tier 2: Medium bonuses (1-3% effects)
- Tier 3: Major bonuses (3-7% effects)
- Tier 4: Significant bonuses (7-12% effects)
- Tier 5: Game-changing bonuses (12-20% effects)
- Tier 6: Championship-tier bonuses (20%+ effects)

**Bonus categories** (4 per tier):
- Shipping speed bonuses (lead time reduction)
- Part supply bonuses (quantity available per order)
- Cost reduction bonuses (price multipliers)
- Reliability bonuses (quality/consistency)

**Deliverable**: `SUPPLY_CHAIN_BONUS_DESIGN.md`
- All 24 bonuses documented
- Exact percentages for each
- How they stack
- Progression pathways
- Hub unlocking conditions

---

### Agent 3: Asset & Acquisition Mechanic Designer
**Task**: Design acquisition system and asset mechanics

Define:
- **How many assets needed per bonus** (3, 4, 6 total?)
- **Asset types** (Planes, Trucks, Ships, Manufacturing Plants, Distribution Centers?)
- **Acquisition timeline** (how many races per asset?)
- **Influence cost** (rush multiplier, base cost)
- **Asset specializations** (each transport type gives different bonuses?)

**Questions to answer**:
- Do 3 planes + 3 trucks + 3 ships = first bonus? Or different threshold?
- Can you get 1 plane, 2 trucks, 1 ship (mixed) or do you need matched sets?
- Does acquiring Plane #2 take less time than Plane #1?
- How does Influence factor into acceleration?

**Deliverable**: `ASSET_ACQUISITION_SYSTEM.md`
- Asset types and specializations
- Acquisition timelines (per asset type)
- Influence mechanics
- Bonus unlock conditions
- Global expansion costs

---

### Agent 4: Recipes & Parts Manufacturing Designer
**Task**: Design recipe system for engine/chassis parts

Create:
- **Raw materials**: Aluminum, Steel, Electronics, Carbon Fiber, Titanium (5-8 types)
- **Intermediate parts**: Castings, Forgings, Circuits, Composites (4-5 types)
- **Final parts**: Engines, Gearboxes, Suspension, Brakes, Chassis (5-6 types)

**Recipe mechanics**:
- Each final part requires 3-5 intermediate parts
- Each intermediate part requires 2-3 raw materials
- Supply chain bonuses affect:
  - Raw material availability
  - Manufacturing lead time
  - Part quality/consistency
  - Batch sizes

**Manufacturing complexity**:
- Level 1 parts (basic ATK): Easy recipe, 2 raw materials, 1-2 week manufacturing
- Level 5 parts (factory engines): Complex recipe, 5+ materials, 8-12 week manufacturing

**Deliverable**: `RECIPE_SYSTEM_DESIGN.md`
- Complete material → part tree
- All recipes documented
- Manufacturing timelines
- Difficulty ratings
- Supply chain bonus effects

---

### Agent 5: Integration & UI Specification Designer
**Task**: Design UI screens and game integration

Design screens:
1. **Supply Chain Hub Map** (world map with hubs, assets, acquisition progress)
2. **Bonus Management** (view all 24 bonuses, current progress, next unlock)
3. **Asset Acquisition** (queue assets, view timelines, use Influence)
4. **Recipe Browser** (view all recipes, required materials, manufacturing cost/time)
5. **Orders & Manufacturing** (place orders, view queue, track progress)

**Integration points**:
- How does supply chain affect race simulation? (parts availability for rounds)
- How does it affect economy? (parts cost, lead time constraints)
- How does it affect team strategy? (plan ahead, order early)
- How does it affect off-season? (finish manufacturing orders, place new ones)

**Deliverable**: `UI_AND_INTEGRATION_SPEC.md`
- 5 screen mockups (text descriptions, data requirements)
- Data model for supply chain (TypeScript interfaces)
- Integration hooks (where it touches race sim, economy, state.ts)
- Progression visualization (how bonuses stack over time)

---

## Output Artifacts (All Deliverables)

```
docs/
  ├── MM_SUPPLY_CHAIN_RESEARCH.md          [Agent 1] MM reverse-engineering
  ├── SUPPLY_CHAIN_BONUS_DESIGN.md         [Agent 2] All 24 bonuses + percentages
  ├── ASSET_ACQUISITION_SYSTEM.md          [Agent 3] Asset mechanics + timelines
  ├── RECIPE_SYSTEM_DESIGN.md              [Agent 4] Materials → parts tree
  └── UI_AND_INTEGRATION_SPEC.md           [Agent 5] Screen designs + integration

src/data/
  ├── supply-chain-bonuses.ts              [NEW] Bonus definitions (all 24)
  ├── recipes.ts                           [NEW] Recipe system (materials → parts)
  └── supply-chain-hubs.ts                 [NEW] Hub locations, asset types

src/game/
  └── supply-chain.ts                      [UPDATE] Phase 2 + full system

tests/
  └── test-supply-chain-progression.ts     [NEW] Verify 10-season progression with bonuses
```

---

## Design Philosophy

This isn't a guess-and-check system. We're building it with:

1. **Realism**: Bonuses based on real supply chain metrics (lead time, cost reduction, quality)
2. **Balance**: Progression feels earned (7-10 seasons to max bonuses, like main R&D)
3. **Depth**: 24 bonuses = real strategic choices (which path to pursue first?)
4. **Tension**: Supply constraints create drama (can't get parts fast enough, prices surge)
5. **Integration**: Supply chain affects race outcomes (parts unavailable = forced to use old tech)

---

## Success Criteria

✅ **Research Phase Complete**: MM mechanics reverse-engineered, best practices documented  
✅ **24 Bonuses Designed**: All defined, percentages calculated, progression paths clear  
✅ **Asset System Designed**: Acquisition timelines, Influence mechanics, hub expansion  
✅ **Recipes Complete**: Full material tree, manufacturing complexity defined  
✅ **UI Specified**: 5 screens designed, integration points identified  
✅ **Code Ready**: TypeScript interfaces, game hooks identified, ready to implement  

---

## Timeline

**This 6-hour cycle**:
- Agents deploy immediately
- Research + design (parallel)
- All artifacts finalized
- Code scaffolding ready

**Next 6-hour cycle**:
- Implementation (convert designs to code)
- Integration into game loop
- First test (1-season supply chain sim)

**Cycle after**:
- Full 10-season test with supply chain progression
- Verify bonuses stack correctly
- Confirm balance (not too fast, not too slow)

---

## Why This Works

Instead of guessing percentages (0.1%? 0.5%? 1%?), we:
1. Research what exists (MM's 4 screens give us hints)
2. Design systematically (Tier 1-6 progression makes sense)
3. Build it (code reflects design)
4. Test it (10-season sim proves balance)
5. Iterate (if 0.1% feels too slow, bump to 0.2%, test again)

By Week 2, we have a complete, playtested supply chain system that feels as deep as MM's, with numbers we can defend.

---

## Bonus Stacking Example (Estimated)

```
Year 1: Start with 0 bonuses
  - Acquire: 1 plane, 1 truck, 1 ship
  - Unlock Bonus 1 (Shipping Speed +0.5%, Lead Time -1 week)

Year 2-3: Acquire more assets
  - Plane 2, Truck 2 → Unlock Bonus 2 (Parts Supply +3% per order)
  - Ship 2 → Unlock Bonus 3 (Cost Reduction -2%)
  - Plant 1 → Unlock Bonus 4 (Manufacturing Reliability +5%)

Year 5: Expanded network
  - Multiple assets per type
  - 8-12 bonuses active
  - Cumulative: Shipping +4%, Cost -8%, Reliability +15%

Year 10: Global dominance
  - All 24 bonuses active
  - Cumulative: Shipping +10%, Cost -25%, Reliability +60%
  - Parts arrive 3-4 weeks faster, cost 25% less, fail 40% less often
  - Can field top-tier engines every season
```

---

This is the deep dive. By end of this cycle, we'll have spec'd out the entire supply chain system from first principles, tested it on paper, and be ready to code.

