# Phase 2: Supply Chain System Design
**Status**: Ready to implement after Phase 1  
**Timeline**: 4-6 hours research + implementation  
**Priority**: Critical for game balance (creates constraint that forces long-term planning)

---

## Problem Statement

**Current state**: Teams order parts instantly, no constraints, no competition for resources.  
**Target state**: Parts take time to manufacture, suppliers have limited capacity, demand drives prices up, scarcity creates strategy.  
**Why it matters**: Without supply chain friction, cash and R&D progression become too easy. With it, every decision has trade-offs.

---

## Core Mechanic: Tiered Part Difficulty

**Concept**: Parts have 5 difficulty levels (1-5). Higher levels take longer to manufacture and consume more resources.

| Level | Type | Examples | Lead Time | Resources | Notes |
|-------|------|----------|-----------|-----------|-------|
| **1** | Budget/Basic | ATK engines, standard chassis | 1-2 weeks | Minimal ($50-100k) | Always available |
| **2** | Competitive | Honda mid-tier engines, Pirella tires | 2-3 weeks | Moderate ($150-250k) | Competitive sweet spot |
| **3** | Premium | Honda top engines, KTM suspension | 3-4 weeks | High ($300-500k) | Performance leaders |
| **4** | Exotic | Prototype engines, custom chassis | 4-6 weeks | Very High ($600-900k) | R&D-dependent |
| **5** | Championship | Full factory engine programs | 8-12 weeks | Extreme ($1-2M+) | Requires $100M+ cash reserves |

**Progression**:
- Year 1 teams: Level 1-2 parts (budget constraints)
- Year 5 teams: Level 2-3 parts (accumulated resources)
- Year 10 teams: Level 3-4 parts (can afford premium)
- Dedicated engine program: Level 5 (final goal, takes full season to arrive)

---

## Manufacturing Queue System

**How it works**:

### 1. Supplier Capacity (per manufacturer, per month)

Each manufacturer (Honda, Kawasaki, Yamaha, Suzuki, ATK) has production capacity:

```typescript
interface Supplier {
  name: string;
  id: string;
  capacity: {
    engines: number;        // max engines/month (e.g., 5-15)
    suspension: number;     // max suspension kits/month
    custom: number;         // max custom orders/month (0-2)
  };
  queue: PartOrder[];       // orders waiting to manufacture
  financialState: 'stable' | 'stressed' | 'crisis';
  reliabilityRating: number; // 0.7-1.3 multiplier on lead times
}
```

### 2. Order Placement (Team Perspective)

When a team places an order:

```typescript
interface PartOrder {
  id: string;
  teamId: string;
  supplierId: string;
  partType: 'engine' | 'chassis' | 'suspension' | 'electronics' | 'custom';
  difficulty: 1 | 2 | 3 | 4 | 5;
  quantity: number;
  cost: number;
  
  // Timing
  placedRound: number;
  baseLeadTime: number;     // 1-12 weeks depending on difficulty
  expectedArrivalRound: number;
  actualArrivalRound?: number;
  
  // Status
  status: 'queued' | 'manufacturing' | 'complete' | 'delayed' | 'cancelled';
  delayReason?: 'supply' | 'capacity' | 'disruption' | 'financial' | 'recall';
  
  // Pricing
  standardCost: number;
  rushMultiplier: number;   // 1.0 = normal, 1.5 = 50% premium for rush
  demandMultiplier: number; // 1.0 + (other_orders_for_same / supplier_capacity)
  finalCost: number;        // standardCost × rushMultiplier × demandMultiplier
}
```

### 3. Queue Resolution (Off-season, then each round)

**Off-season processing** (done FIRST before season):

```
For each manufacturer:
  1. Sort orders by placement date (FIFO)
  2. Calculate base capacity for this season
  3. Process manufacturing:
     - Difficulty 1 parts: 1 unit per 1 capacity slot
     - Difficulty 2 parts: 1 unit per 2 capacity slots
     - Difficulty 3 parts: 1 unit per 4 capacity slots
     - Difficulty 4 parts: 1 unit per 6 capacity slots
     - Difficulty 5 parts: 1 unit per 10 capacity slots
  4. Apply reliability modifier to lead times
  5. Mark orders complete/delayed
```

**Per-round processing**:
- Orders currently manufacturing advance toward completion
- Completed orders available for pickup
- Delayed orders stay queued (or trigger cancellation logic)

---

## Demand Pricing Dynamics

**Concept**: When multiple teams order the same popular part, prices escalate.

**Formula**:
```
demandMultiplier = 1.0 + (other_pending_orders / supplier_capacity)

Example:
  - 10 teams want Honda engine
  - Honda capacity: 5/month
  - Supplier has 8 existing orders
  - New order sees: 1.0 + (8/5) = 2.6x price multiplier
  - Honda engine normally $400k → now costs $1.04M (demand surge)
```

**Effect**:
- Popular engines get expensive (feedback discourages oversupply)
- Unpopular suppliers become attractive (budget alternative)
- ATK always available at baseline price (no surge)
- Creates real team decisions: "Wait for Honda or buy ATK now?"

---

## Supplier Disruption Events

**Concept**: Real-world events interrupt supplier operations (weather, accidents, financial crisis).

### Disruption Types

| Event | Probability | Duration | Effect |
|-------|------------|----------|--------|
| Factory fire | 1% per season | 4-8 weeks | Supplier down, all orders delayed |
| Storm damage (east coast) | 5% per season | 2-4 weeks | Capacity reduced 50% |
| Parts shortage | 3% per season | 2-3 weeks | Specific part type unavailable |
| Supplier bankruptcy | 2% per season | Permanent | Supplier exits, orders cancelled |
| Quality recall | 4% per season | 1-2 weeks | Parts must be re-built, lead time +3 weeks |
| Labor strike | 3% per season | 1-3 weeks | Production halted |

### Disruption Mechanics

When disruption triggers:
1. **Notify affected teams** (game message)
2. **Delay all orders** at that supplier (+X weeks)
3. **Increase pricing** (scarcity = higher cost)
4. **Offer alternatives** (switch to other supplier? rush order? wait it out?)
5. **Resolution** (supplier recovers or goes under)

**Example scenario**:
```
Round 8: Storm hits Honda's supplier network (east coast)
Effect: Honda capacity reduced from 8 → 4 engines/month for 3 weeks

Impact on teams:
  - Teams waiting for Honda get +3 week delay
  - Honda price multiplier goes from 1.2x → 2.1x (scarcity)
  - ATK becomes attractive ($400k stable vs $1.2M Honda)
  - Smart teams switch to ATK or accept delay

Round 11: Storm passes
Effect: Honda capacity returns to 8/month, prices normalize

Result: Opportunistic timing matters. Teams that ordered ahead or switched suppliers avoided the crunch.
```

---

## Lead Time Calculation

**Base lead time** (determined by difficulty level):
- Level 1: 1-2 weeks
- Level 2: 2-3 weeks
- Level 3: 3-4 weeks
- Level 4: 4-6 weeks
- Level 5: 8-12 weeks

**Modifiers**:

```
finalLeadTime = baseLeadTime 
  × reliabilityMultiplier (supplier rating 0.7-1.3)
  × capacityMultiplier (queue depth, 0.8-2.0)
  × disruption (1.0-1.5 if event active)
  + rushDiscount (-25% if paid rush fee, min 1 week)
```

**Examples**:

Normal order:
- Level 2 Honda, normal demand, reliable supplier
- Base: 2 weeks × 1.0 × 1.0 × 1.0 = 2 weeks
- Arrives: Current round + 2 weeks

Surge demand:
- Level 2 Honda, high demand (8 teams queued), stressed supplier
- Base: 2 weeks × 1.1 × 1.8 × 1.0 = 3.96 weeks ≈ 4 weeks
- Price: $400k × 1.0 × 2.0 = $800k

Rush order:
- Level 2 Honda, rush fee (+$150k), skilled supplier
- Base: 2 weeks × 1.0 × 1.0 × 1.0 = 2 weeks
- With rush: 2 × 0.75 = 1.5 weeks ≈ 1 week
- Cost: $400k + $150k rush = $550k (premium for speed)

---

## Implementation Plan

### Phase 2a: Supplier Capacity System (2-3 hours)

1. **Add Supplier interface** to types.ts
   - Capacity (engines/suspension/custom per month)
   - Queue (array of orders)
   - Financial state & reliability rating

2. **Create supplier database** in data/suppliers.ts
   - Honda: 10 engines/month, 1.0 reliability, stable
   - Kawasaki: 6 engines/month, 0.9 reliability, stable
   - Yamaha: 8 engines/month, 1.1 reliability, stable
   - Suzuki: 5 engines/month, 0.95 reliability, stable
   - ATK: 20 engines/month, 1.0 reliability, always stable (budget supplier, infinite capacity)

3. **Implement order placement** in game/supply-chain.ts
   - `placePartOrder(team, part, difficulty, rushOrder?)`
   - Calculate lead time based on capacity queue
   - Calculate cost with demand multiplier
   - Add to supplier queue

4. **Implement queue resolution** in game/state.ts
   - `processSupplierQueues()` - runs off-season and each round
   - Advance manufacturing progress
   - Mark completed orders
   - Detect delays

### Phase 2b: Demand Pricing (1-2 hours)

1. **Add demand multiplier calculation**
   - Count pending orders for each part
   - Scale price based on queue depth

2. **Add ATK as always-available** fallback
   - Level 1 parts only
   - $400k base (no surge)
   - 1-2 week lead time

3. **Test pricing feedback loop**
   - Popular engines → expensive
   - Expensive → teams switch to alternatives
   - Equilibrium emerges

### Phase 2c: Disruption Events (1-2 hours)

1. **Create disruption event table** in data/events.ts
   - Factory fire, storm, shortage, bankruptcy, recall, strike
   - Probability per season
   - Duration and intensity

2. **Implement event trigger** in game/supply-chain.ts
   - Random per off-season
   - Apply effects to affected supplier
   - Delay all orders

3. **UI notifications**
   - "Storm hits east coast! Honda capacity halved for 3 weeks"
   - Show impacted teams
   - Suggest alternatives (ATK, Kawasaki)

### Phase 2d: Integration & Testing (1 hour)

1. **Wire into game loop**
   - advanceSeason() calls processSupplierQueues()
   - Each round checks for disruptions
   - Teams can place orders in Hub UI

2. **Test scenarios**
   - Single season with disruption
   - Multi-season supply chain stability
   - Demand surge pricing
   - Bankruptcy scenarios

3. **Verify game balance**
   - Teams should accumulate resources realistically
   - No exploits (hoarding, pre-ordering everything)
   - Supply crises create interesting decisions

---

## Success Criteria

✅ **Constraints are real**: Teams can't get parts instantly  
✅ **Decisions matter**: Rush order vs wait, expensive part vs budget alternative  
✅ **Supply scarcity creates drama**: "I need this engine NOW but Honda is booked"  
✅ **Long-term planning**: Order custom parts months in advance for big races  
✅ **No exploits**: Can't game the system by overordering or pre-buying  
✅ **Emergent gameplay**: Disruption events force improvisation  
✅ **Balances progression**: Slows down game without feeling unfair  

---

## Motorsport Manager Reference

Key mechanics to investigate from MM:
1. **Tier progression** (how they scaled parts availability by team budget/prestige)
2. **Supplier loyalty** (exclusive deals that give discounts)
3. **Manufacturing queues** (queue depth affects lead time)
4. **Demand events** (seasonal spikes in popular parts)
5. **Alternative suppliers** (budget options available but slower)
6. **Supply disruptions** (weather, accidents, quality issues)

Research direction: Watch YouTube gameplay footage of MM supplier screen, note:
- How orders are placed
- How delivery dates are shown
- What pricing looks like
- How queue depth affects availability
- How rivals compete for same parts

---

## User Context

From latest feedback:
- "Parts should take time to complete. Level 1 easy/fast, Level 5 hard/slow."
- "Like recipes in games - harder items need more resources and time."
- "Supply chain creates real constraints that slow down progression."
- "It's about creating tension: wait for good part or buy suboptimal part now?"

This should feel like EverQuest crafting - some items quick to craft, some require grinding for materials and patience. Every part you own should feel earned.

---

## Next Steps

1. **Research Motorsport Manager** (1 hour) - gameplay videos, mechanics review
2. **Design supply chain UI** (1 hour) - order screens, queue visualization, notifications
3. **Implement Phase 2a** (supplier capacity system)
4. **Implement Phase 2b** (demand pricing)
5. **Implement Phase 2c** (disruptions)
6. **Multi-season testing** (verify long-term balance)
7. **Polish Phase 1+2 together** (comprehensive rebalance test)

---

## Summary

Phase 2 transforms supply chain from "instant gratification" to "strategic resource management". Teams will plan purchases months ahead, make hard choices between options, and experience the tension of supply scarcity. This is the final piece needed to achieve EverQuest-style long-term progression where everything takes time and every decision matters.

