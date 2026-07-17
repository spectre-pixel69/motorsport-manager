# Critical Balance Issues & Missing Systems

**Current Problems**: Game progression is 10-100x too fast. Need to slow everything down and add realism.

---

## Problem 1: R&D Progression Too Fast ❌

### Current (Wrong)
```
Season 1: $4M R&D investment
Result: Engine 65 → 100 (mid-season)
Timeline: 10 rounds to max out a system
```

### Should Be
```
Season 1: $200k R&D investment
Result: Engine 65 → 67 (+2 points only)
Timeline: 7-10 seasons minimum to reach 100
```

**Fix**: Reduce R&D gain from 0.5 points per $100k → 0.1-0.15 points per $100k

**Why**: Building a competitive engine takes YEARS. Honda didn't become dominant overnight.

---

## Problem 2: Cash Accumulation Too Fast ❌

### Current (Wrong)
```
Season 1: BVM Motorrad → $130M
Year 1 → Can start engine program
```

### Should Be
```
Season 1: BVM Motorrad → $2-3M profit (after all costs)
Season 7-10: Finally accumulates $100M+ for engine program
```

**The gap**: We're missing MASSIVE expense categories that drain cash.

---

## Problem 3: Missing Expense Categories ❌

**Currently accounted for:**
- Rider salaries
- Appearance/win bonuses

**NOT accounted for (drain cash):**
- [ ] Staff salaries (crew chiefs, mechanics, engineers, logistics)
- [ ] Facility lease/maintenance
- [ ] Travel costs (transportation, hotels, food for 4 class crews per round)
- [ ] Parts inventory/storage costs
- [ ] Insurance (riders, equipment, facility)
- [ ] Support staff (physios, data analysts, engineers)
- [ ] Marketing/sponsorship obligations
- [ ] Equipment depreciation
- [ ] Fuel/transportation fleet
- [ ] Licensing fees
- [ ] Medical team (track doctors on payroll)

**Impact**: Each of these is probably $50k-$500k per season. Together they likely consume 60-80% of race winnings.

---

## Problem 4: Supply Chain System Missing ❌

### The Gap
**What we need**: Raw materials → parts manufacturing → availability → team ordering

**Current state**: Teams just "order parts" instantly.

### What Motorsport Manager Did
Need to research and replicate:
- Raw material supplies (steel, aluminum, electronics)
- Manufacturing capacity (how many engines/month can each supplier make?)
- Lead times (parts take 2-4 weeks minimum to build)
- Supply competition (all teams want same parts from same supplier)
- Price escalation (demand for hot parts drives prices up)
- Bottlenecks (if 5 teams order same engine, supplier delays)
- Supplier reliability (supplier might be out of stock, closed, damaged)
- Alternative suppliers (cheaper but slower, reliable but expensive)

### Supply Chain Mechanics Needed
```
SCENARIO: Hot Engine (high win rate last season)

Week 1: Supplier gets 10 orders for hot engine
Week 2: Supplier has capacity for 4 per month
Week 3: Prices increase 25% (supply constrained)
Week 4: Teams start ordering ATK as alternative
Result: Hot supplier can't fulfill demand → teams forced to switch
        → Hot supplier loses market share → prices drop → equilibrium
```

### Realistic Flow
```
Team decides: "I need a new engine"
  ↓
Team checks supplier availability/pricing
  (not all engines available from all suppliers)
  ↓
Team places order with deposit
  ↓
Manufacturing queue: 2-4 week lead time
  ↓
WAIT period: Can't use engine yet
  (forces season-long planning, not mid-race fixes)
  ↓
Engine arrives next round/season
  ↓
Team uses engine in races
  ↓
Wear accumulation: Part degrades over season
  ↓
Next season: Repeat or upgrade
```

---

## Problem 5: No Inter-Supplier Economics ❌

**Missing**:
- Supplier reputation/reliability rating
- Supplier production capacity
- Supplier availability (can sell out)
- Price dynamics (demand drives price up)
- Quality variance (cheap parts = lower reliability)
- Lead time variance (rush orders = 1.5-2x cost)
- Exclusivity deals (team commits to supplier = discount)
- Supplier conflicts (if you switch away, they might reduce your priority next season)

---

## The Real Cash Drain Simulation Should Look Like

```
SEASON 1: BVM Motorrad wins 45 races

REVENUE:
  Race winnings: 45 × $75k = $3.375M
  Championship points: 19210 × $500 = $9.605M
  Sponsorship baseline: $5M
  TOTAL IN: $18M

EXPENSES:
  Staff salaries (crew × 4 classes): $2.5M
  Facility lease/ops: $400k
  Travel (20 rounds, full crew): $800k
  Insurance: $200k
  Medical team: $300k
  Equipment/fleet: $300k
  Rider salaries: $2.2M (already separated from team budget)
  Parts inventory/storage: $500k
  Licensing/regulatory: $100k
  Depreciation: $400k
  Unexpected costs (crashes, damage, emergency repairs): $400k
  R&D investment (capped): $200k
  TOTAL OUT: $8.2M

NET PROFIT: $18M - $8.2M = $9.8M (NOT $130M)

CASH ON HAND: $2.5M starting + $9.8M = $12.3M
  (Not $130M. More realistic.)
```

---

## Required Changes

### Immediate (Slow the game down)
1. [ ] Reduce R&D gain: 0.5 → 0.1 points per $100k
2. [ ] Add staff salary expenses (cut cash by ~50%)
3. [ ] Add travel/facility costs
4. [ ] Cap max progression: Engine should be 65-85 range most of game

### Short-term (Supply chain foundation)
1. [ ] Create Supplier type/interface
2. [ ] Add supplier capacity (how many parts/season)
3. [ ] Add supplier production queue
4. [ ] Add lead time system (2-4 week delays)
5. [ ] Research Motorsport Manager supply chain for reference

### Medium-term (Supply dynamics)
1. [ ] Implement demand-driven pricing
2. [ ] Add supplier reliability variance
3. [ ] Implement bottleneck scenarios
4. [ ] Add supplier disruption events (storms, accidents)
5. [ ] Create alternative supplier options

### Long-term (Economic realism)
1. [ ] Supply chain disruptions (weather, accidents, closures)
2. [ ] Exclusive supplier contracts (loyalty rewards)
3. [ ] Supplier reputation system
4. [ ] Multi-year supply agreements
5. [ ] International supply delays (shipping, customs)

---

## Timeline Expectations (Player Perspective)

### Year 1
- Budget: $2.5M
- Cash on hand at year end: $9.8M
- Best R&D progress: Engine 65→66 (+1 point)
- Status: Building foundation, can barely afford new parts

### Year 3
- Budget: Accumulated ~$25M
- Can invest: ~$200k in R&D
- R&D progress: Engine 65→69 (+4 points total)
- Status: Competitive, but not dominant

### Year 7
- Budget: Accumulated ~$80M
- Can invest: ~$200k in R&D (capped)
- R&D progress: Engine 65→75 (+10 points)
- Status: Top team, but long way from maxed

### Year 10+
- Budget: Accumulated ~$130M+
- Can start engine development PROGRAM
- R&D progress: Engine 75→85 (unlocks new paths)
- Status: Manufacturer-level investment possible

---

## Reference: Motorsport Manager Supply Chain

**Action needed**: Research how Motorsport Manager implemented:
- Supplier tiers (budget/mid/premium)
- Production queues
- Lead times
- Demand pricing
- Supply disruptions
- Supplier reputation

**Expected learnings**:
- How they balanced accessibility vs scarcity
- How they created player decisions (rush order? wait? use alternative?)
- How they prevented exploits (hoarding parts, pre-ordering everything)
- How supply events created emergent gameplay (supply crisis forces change)

---

## Bottom Line

**Current game**: Win once, have $130M, max out all systems in 10 weeks. 🚫

**Target game**: Take 7-10 years of seasons to build a competitive manufacturer. Hard choices every round. Supply drama adds realism. Players feel reward when they finally max out an engine after 8 seasons. 

**Reference philosophy**: EverQuest ("ever crack") - long grind, but worth it.

---

## TODO List (Add to Project)

- [ ] Reduce R&D progression rate (10x slower)
- [ ] Add staff/operational expenses (50% cash drain)
- [ ] Research Motorsport Manager supply chain system
- [ ] Design supplier types and capacity system
- [ ] Implement lead time system (2-4 week orders)
- [ ] Add demand-driven pricing for parts
- [ ] Create supplier disruption events
- [ ] Add supplier reliability ratings
- [ ] Implement production queue system
- [ ] Create exclusivity/loyalty contracts
- [ ] Add international shipping delays
- [ ] Balance: Ensure 7-10 year progression to engine program
- [ ] Player onboarding: Teach about supply chain
- [ ] Debug: Verify cash flow matches realistic budgets
- [ ] Balance: Test that teams don't break 100+ cash accumulation early

---

## Status

**Current build**: Too fast, too generous, unrealistic.  
**Next phase**: Slow down everything, add realism, add supply chain.  
**Philosophy**: Long-term planning. Supply matters. Every decision counts.
