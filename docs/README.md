# Paddock Boss Documentation Hub

Welcome to the Paddock Boss knowledge base. This directory contains focused reference guides for all major systems in the game.

---

## Quick Navigation

### 📖 Comprehensive Foundation
- **[CLAUDE.md](../CLAUDE.md)** — Start here. Main documentation with architecture, locked specs, data model, and integration checklist.

### 🏍️ Core Systems

1. **[RIDER_SKILLS_REFERENCE.md](RIDER_SKILLS_REFERENCE.md)**
   - 9-skill training system (pace, braking, racecraft, etc.)
   - Stamina mechanics (free resource, no gating)
   - Potential ceiling (hidden, affects headroom)
   - Traits (positive/negative modifiers)
   - Age decline mechanics (32+)
   - Training program examples

2. **[RACE_SIMULATION_GUIDE.md](RACE_SIMULATION_GUIDE.md)**
   - Single-gate 40-rider race format
   - Pace calculation & modifiers
   - Component failure system (graduated severity)
   - Overtaking & DRS logic
   - Championship points (F1-style)
   - Weather & track conditions
   - Pit stop strategy (future)

3. **[ECONOMY_REFERENCE.md](ECONOMY_REFERENCE.md)**
   - $2.5M seasonal budget allocation
   - Rider salary structure (per-class floors)
   - Per-round purse distribution ($800k)
   - Contract types & performance bonuses
   - Cash flow tracking (annual & per-round)
   - R&D investment & facility levels
   - Budget management strategies

---

## For Different Roles

### 🎮 Game Designers
Read: Main CLAUDE.md (locked specs) → RACE_SIMULATION_GUIDE → ECONOMY_REFERENCE

Questions to answer:
- Is the feature legal under NAMC v15.1?
- How does it affect race balance?
- What's the budget impact?

### 💻 Frontend Developers
Read: Main CLAUDE.md (architecture) → RIDER_SKILLS_REFERENCE → RACE_SIMULATION_GUIDE

Questions to answer:
- Which data structures do I need to display?
- What information is hidden vs. revealed to player?
- How do I render skill progression?

### 🔧 Backend/Sim Engineers
Read: RACE_SIMULATION_GUIDE → ECONOMY_REFERENCE → Main CLAUDE.md (integration checklist)

Questions to answer:
- How does the sim engine generate race results?
- What performance optimizations matter?
- How do I implement a new mechanic?

### 📊 Project Managers / QA
Read: Main CLAUDE.md (integration checklist) → ECONOMY_REFERENCE (season progression)

Questions to answer:
- What's done vs. pending?
- What's the critical path to shipping?
- What breaks the game economically?

---

## Key Concepts

### Locked Specifications
These **never change** without full team consensus:
- 20-round outdoor S4 championship (NAMC v15.1)
- $2.5M seasonal budget (fixed)
- 40-rider single gate (no motos)
- 9-skill system (not fewer, not more)
- F1-style championship points
- Three-strike penalty system

See "Locked Specifications" in main CLAUDE.md.

### Stamina (Free Resource)
- Not a premium currency
- -15 per training session, +10/day rest
- Overtraining (<20 stamina) = injury risk, not a hard block
- No token gating

### Potential (Hidden Ceiling)
- Each skill has independent potential (0-100)
- Not displayed to player
- Controls headroom for training gains
- Creates mystery: "Will this rider keep improving?"

### Engine Modes
- **Conserve** (0.6× wear): Efficient, safer
- **Standard** (1.0× wear): Balanced
- **Push** (1.6× wear): Risky, higher power
- **Attack** (2.2× wear): Extreme risk, race-day only

### Graduated Failures
When a component fails:
- 50% minor (15-40% pace loss)
- 30% moderate (35-60% pace loss)
- 20% terminal (DNF)

Not binary; creates dramatic race variance.

---

## Decision Log

### Why 9 Skills? (vs. Fewer / More)
- **9 is minimum** to represent rider complexity
- Each skill affects race differently (pace, racecraft, fitness, etc.)
- Fewer: Generic, boring trainer
- More: Bloated, dilutes training impact

### Why Hidden Potential?
- Creates mystery and replayability
- Players discover ceilings through training, not spreadsheet
- Mirrors real scouting (talent unknown until proven)
- Prevents min-maxing (can't look up optimal training path)

### Why $2.5M Budget (Not $5M or $1.5M)?
- $2.5M = enough to field competitive 4-rider team in one class
- Not enough to run elite in multiple classes (forces choices)
- Purse is $800k/round, so 3 great rounds = budget for 1 rider
- Creates dynamic: Can't hire everyone, must specialize

### Why 3-Skill Traits (Not 2 or 5)?
- 3 is balanced: positive (rare) vs. negative (common)
- Enough variety without diluting individual impact
- 6 positive traits = desirable, huntable in draft
- 3 negative traits = penalties real but not game-breaking

### Why Graduated Failures (Not All-or-Nothing)?
- More dramatic narrative: engine limping to finish vs. DNF
- Strategic: Pit stop decisions matter (fix vs. limp home)
- Realism: Parts don't always "break"; they degrade
- Replay value: Same seed, different strategies = different outcomes

---

## How to Add a New Feature

### Example: Tire Compound Selection

1. **Spec it** (write locked constraint):
   - Soft: +5% grip, -10% durability
   - Medium: Baseline
   - Hard: -5% grip, +10% durability

2. **Data** (add to types.ts):
   ```typescript
   interface BikeSetup {
     tireCompound: 'soft' | 'medium' | 'hard';
   }
   ```

3. **Logic** (implement in sim):
   ```typescript
   const gripMod = {
     soft: 1.05,
     medium: 1.0,
     hard: 0.95,
   }[bikeSetup.tireCompound];
   ```

4. **UI** (let player select):
   ```typescript
   <select onChange={(e) => setTireCompound(e.target.value)}>
     <option>Soft</option>
     <option>Medium</option>
     <option>Hard</option>
   </select>
   ```

5. **Test**: Verify soft tires are faster but wear out, hard tires last longer but slower.

6. **Document**: Add section to RACE_SIMULATION_GUIDE.md

---

## Common Questions

**Q: Where's the Preact UI code?**  
A: `src/ui/` directory. Main hub is `HubScreen.tsx`.

**Q: How do I run the game locally?**  
A: `npm run dev` (Vite dev server). `npm run api` (Express backend).

**Q: Where are the 160 riders generated?**  
A: `src/data/universe.ts` (seeded RNG).

**Q: What's the difference between 350 Pro and 250?**  
A: Different salary floor ($400k vs. $200k), different skill baselines (pros faster), same 40-rider format.

**Q: Can riders transfer between classes mid-season?**  
A: Not yet (locked in at season start). Future: yes, with conditions.

**Q: Where are saves stored?**  
A: localStorage (browser) or backend API (to implement).

**Q: Can I play offline?**  
A: Yes. Everything runs in-browser except cloud sync (future).

---

## Troubleshooting

**"Rider skills aren't improving"**  
→ Check facility level (default 1 = 0.8× multiplier). Upgrade to level 2+.  
→ Check stamina (below 20 = injury risk, not hard block). Ensure rider gets rest days.  
→ Check potential (hidden ceiling). After 2-3 seasons, may hit cap.

**"Races are too predictable / too chaotic"**  
→ Adjust `FAILURE_RATE_MULTIPLIER` in `src/sim/index.ts`.  
→ Tune skill blend weights (currently pace=35%, adjust to 25% if too dominant).

**"Budget doesn't balance"**  
→ Purse calculations: $800k/round ÷ 4 classes ÷ grid size per class.  
→ Verify SALARY_FLOOR in `src/game/economy.ts` matches v15.1 spec.

**"Game won't load"**  
→ Check browser console (F12) for errors.  
→ Clear localStorage: `localStorage.clear()`.  
→ Rebuild: `npm run build`.

---

## File Structure

```
docs/
├── README.md                           ← You are here
├── RIDER_SKILLS_REFERENCE.md           ← Training, stamina, traits
├── RACE_SIMULATION_GUIDE.md            ← Sim engine, pace, failures
└── ECONOMY_REFERENCE.md                ← Budget, salaries, purses

../CLAUDE.md                            ← Main documentation
```

---

## Contributing to Docs

When you implement a new feature:

1. **Spec it first**: Write the constraint/formula in CLAUDE.md (locked specs section).
2. **Code it**: Implement in appropriate file (`src/game/`, `src/sim/`, etc.).
3. **Document it**: Add to relevant reference guide (RIDER_SKILLS, ECONOMY, or RACE_SIM).
4. **Mark integration**: Update checklist in CLAUDE.md.
5. **Share**: Link to docs in PR description.

---

## Glossary

| Term | Meaning |
|------|---------|
| NAMC | National Amateur Motorcycle Championship (v15.1) |
| Purse | $800k prize pool per round |
| Appearance Fee | $1k guaranteed per rider per round |
| Headroom | Potential - Current Skill = remaining growth |
| Stamina | Training fatigue resource (0-100) |
| Potential | Hidden skill ceiling (per skill, per rider) |
| Graduated Failure | Part fails with varying severity (minor/moderate/terminal) |
| DRS | Future overtaking mechanic (slipstream advantage) |
| Prestige | Team standing (1-100, affects sponsorships) |
| Dual-Charter | One org runs riders in both 4S + 2S championships |

---

## Version History

| Date | Change |
|------|--------|
| 2026-07-09 | Initial documentation created. All core systems documented. |

---

**Questions?** Search this folder or CLAUDE.md first. Then ask a teammate or the Documentation Agent.

**Last Updated**: 2026-07-09
