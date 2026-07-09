# Onboarding Guide — Get Up to Speed in 30 Minutes

New to Paddock Boss? Start here.

---

## The One-Minute Pitch

**Paddock Boss** is a NAMC v15.1 motorcycle team manager game (browser-based). You:
- Build a team of riders
- Train their skills (9 dimensions)
- Manage a $2.5M annual budget
- Watch them race in a 20-round championship
- Compete against 19 AI teams

**Core loop**: Train → Race → Earn → Upgrade → Repeat.

---

## 5 Core Concepts (Memorize These)

### 1. The 9-Skill System
Every rider has 9 independent skills (0-100):
- **pace** (raw speed) + **braking** (late entry) + **cornerSpeed** (lean)
- **racecraft** (overtaking) + **consistency** (avoiding crashes)
- **starts** (launch) + **fitness** (stamina) + **wet** (rain) + **feedback** (R&D quality)

Each skill improves via training (costs stamina, free resource).

**Key insight**: A rider with high pace but low consistency crashes a lot. A rider with good racecraft but low pace can still win through smart positioning.

### 2. Hidden Potential
Each rider has a hidden skill ceiling (0-100). You discover it by training; gains shrink as you approach the ceiling.

**Player strategy**: Train a skill repeatedly. If gains slow down, you've found the potential ceiling. Is this rider worth investing more in? Probably not.

### 3. The $2.5M Budget
Your team gets $2.5M per season (fixed). You allocate it to:
- Rider salaries ($1M+)
- Staff & coaches ($300-500k)
- Bike parts & tires ($300-500k)
- R&D / facility upgrades ($100-200k)
- Emergency buffer ($50-150k)

You can't earn more mid-season. You can't take loans. Plan carefully.

### 4. The Race Format
40 riders, single gate (one race, no motos), all outdoor (NAMC rules). The fast racers get 25 points (1st), 20 (2nd), etc. Slow racers get 0-1 points.

Parts fail randomly. A good driver in a bad car might DNF (Did Not Finish).

### 5. The Season Arc
- Round 1-12: Stadium rounds (mixed terrain, favor technical riders)
- Round 13-20: Outdoor nationals (pure dirt, favor strong starts & fitness)

Win championships in your class(es) to unlock sponsorships and prestige for next year.

---

## Architecture in 90 Seconds

```
Game Engine (src/game/)
├─ index.ts: GameManager (team + season orchestration)
├─ state.ts: CareerState (player progress, round tracking)
├─ economy.ts: Budget & purse calculations
├─ training.ts: Skill gains, stamina system
└─ reliability.ts: Part failures, wear

Race Simulator (src/sim/)
├─ index.ts: Main race engine (pace model, overtakes)
├─ physics.ts: Pace calculation & modifiers
└─ weekend.ts: WeekendResult (qual + race data)

Data Layer (src/data/)
├─ types.ts: Core interfaces (Rider, Team, Track, etc.)
├─ universe.ts: Universe generator (seeded RNG)
├─ bikes.ts: Engines, chassis, tires, costs
├─ namc.ts: NAMC-specific rules
└─ classes.ts: Class definitions (350 Pro, 250, etc.)

UI Layer (src/ui/)
├─ Hub.tsx: Main HQ screen (calendar, standings, rosters)
├─ TeamDashboard.tsx: NAMC team management
├─ RaceView.tsx: Live race broadcast
├─ showroom/: Parts shopping
├─ training/: Training center
└─ garage/: Parts management

Backend (src/api/)
└─ server.ts: Express app (save/load, future cloud sync)
```

---

## File Quick Reference

| File | Purpose | When to Read |
|------|---------|--------------|
| `src/data/types.ts` | Data model (source of truth) | Understanding what a Rider is |
| `src/game/training.ts` | Skill gain formulas | Why a rider trained but didn't improve |
| `src/sim/index.ts` | Race sim engine | How races are generated |
| `src/ui/Hub.tsx` | Main HQ screen | Understanding UI flow |
| `CLAUDE.md` | Full documentation | Everything |
| `docs/RIDER_SKILLS_REFERENCE.md` | Training deep-dive | Why potential matters |
| `docs/ECONOMY_REFERENCE.md` | Budget deep-dive | How to allocate $2.5M wisely |
| `docs/RACE_SIMULATION_GUIDE.md` | Race sim deep-dive | How pace is calculated |

---

## Your First 30 Minutes

### 5 min: Read This (You're doing it!)

### 10 min: Read the Locked Specs

Open `CLAUDE.md`, section "LOCKED SPECIFICATIONS". Understand:
- NAMC v15.1 rulebook (20 rounds, 40 riders, 4 classes)
- $2.5M budget, $800k purse per round
- 9 skills (don't add more, don't remove any)
- F1-style championship points

### 5 min: Look at the UI

Run `npm run dev`. Create a new game (pick a team name). Click around:
- Hub tab: Calendar, standings, team roster
- Race tab: Select rider strategies (conserve/normal/push)
- Standings tab: Driver & team rankings
- Money tab: Budget breakdown
- Team tab: Roster details

Don't race yet. Just click.

### 5 min: Read "5 Core Concepts" Again

Make sure you can explain to someone:
1. What the 9 skills are
2. What potential means
3. Why the budget is hard constraint
4. How the race format works
5. What stadium vs. outdoor rounds mean

### 5 min: Ask Questions

Slack or DM: "I don't understand [X]". Better to ask now than implement wrong.

---

## Common Gotchas

**"Stamina is a premium currency / can block training"**  
❌ Wrong. Stamina is free. +10/day automatic. Never blocks training. Overtraining (<20) = injury risk.

**"I can add more than 9 skills"**  
❌ No. 9 skills locked in spec. Adding more requires full team vote.

**"Budget can be adjusted mid-season"**  
❌ No. $2.5M fixed per season. No loans, no mid-season funding. Plan ahead.

**"Races are purely random"**  
❌ No. Seeded RNG = deterministic. Same seed + round = same race outcome always. Player choices (strategies, parts, training) change outcomes.

**"I can fire a rider mid-season"**  
❌ Not yet. Riders locked in by contract. Future feature: contract buyouts.

**"Potential is the same for all skills"**  
❌ No. Each skill has independent potential. A rider might max out at pace=92 but potential=100 for racecraft.

---

## Your First Real Game

1. **Game creation**:
   - Pick a team name (e.g., "Red Thunder Racing")
   - Pick discipline: NAMC
   - You get a team with 4 riders, $2.5M budget

2. **Initial decisions**:
   - Review your riders' skills (check the 9 skill breakdown)
   - Check budget (should be $2.5M free)
   - Plan training: Which rider to develop first?

3. **Round 1**:
   - Set rider strategies (conserve/normal/push)
   - Hit "Go Racing"
   - Watch live race broadcast
   - See results

4. **After Round 1**:
   - Check earnings (purse payment)
   - Check rider morale
   - Review standings
   - Plan training for Round 2

5. **By Round 5**:
   - You'll understand the loop
   - You'll see which riders are improving
   - You'll realize where your budget went

---

## Key Decisions You'll Make

### Training
- Which rider to focus on?
- Which skill to train?
- How many sessions per week (vs. rest)?

### Budget
- How much to rider salaries vs. team infrastructure?
- Invest in facility upgrade now or save for later?
- New tires every round or use worn tires?

### Race Strategy
- Conserve mode (safe, slower) or push mode (risky, faster)?
- Pit stops (future feature): when to stop, what to change?

### Roster
- Keep current roster or try to sign free agents (future)?
- Which class to focus on (350, 250, etc.)?

---

## Terminology Cheat Sheet

| Term | Meaning |
|------|---------|
| Stamina | Training fatigue resource (0-100), free +10/day |
| Potential | Hidden skill ceiling (per skill) |
| Headroom | potential - current skill = remaining growth |
| Pace | Combined rider speed in race (not same as pace skill) |
| Engine Mode | Wear multiplier (Conserve 0.6×, Standard 1.0×, Push 1.6×, Attack 2.2×) |
| Reliability | Component failure chance (0-100, higher = more reliable) |
| Wear | Damage to parts from mileage (1% per 100 miles) |
| Purse | $800k prize pool per round |
| DNF | Did Not Finish (part failed, rider crashed, etc.) |
| Prestige | Team reputation (1-100) |
| Dual-Charter | One org runs teams in both 4S (350) and 2S (250) championships |

---

## Next Steps After Onboarding

1. **Read docs in depth**:
   - RIDER_SKILLS_REFERENCE.md (training mechanics)
   - ECONOMY_REFERENCE.md (budget planning)
   - RACE_SIMULATION_GUIDE.md (how races work)

2. **Play a full season** (20 rounds, ~1-2 hours)

3. **Try different strategies**:
   - Conservative budget (low rider salaries, high R&D)
   - Aggressive budget (max rider salaries, minimal reserves)
   - Specialization (focus on one class vs. spread riders)

4. **Ask for code walkthrough**:
   - How does training gain work? (see `src/game/training.ts`)
   - How is pace calculated? (see `src/sim/physics.ts`)
   - How are races saved? (see `src/game/state.ts`)

5. **Contribute**:
   - Bug fixes
   - Feature implementations
   - Documentation updates

---

## Red Flags in Implementation

If you see this in code, ask for clarification:

**"TODO: Implement stamina gating"**  
→ Don't do it. Stamina doesn't gate training (spec violation).

**"Add 10th skill: marketability"**  
→ No. Locked at 9 skills (spec violation).

**"Adjust budget to $5M per team"**  
→ No. Locked at $2.5M (spec violation).

**"Remove graduated failures; make it binary"**  
→ No. Graduated failures locked in spec (50% minor, 30% moderate, 20% terminal).

**"Change championship points from F1 to NASCAR"**  
→ No. F1-style locked in spec (25, 20, 18, 16, 15...).

---

## Who to Ask

| Question | Ask |
|----------|-----|
| "What's the 9-skill system?" | Read RIDER_SKILLS_REFERENCE.md |
| "How does the budget work?" | Read ECONOMY_REFERENCE.md |
| "How are races generated?" | Read RACE_SIMULATION_GUIDE.md |
| "Is this a spec violation?" | Read CLAUDE.md, LOCKED SPECIFICATIONS section |
| "How do I implement [feature]?" | Ask in Slack / code review |
| "Why did this rider's skill not improve?" | Read training.ts, check facility level & stamina |
| "Can we change [locked spec]?" | Requires full team vote + documentation update |

---

## Success Metrics

By end of week 1, you should be able to:
- [ ] Explain the 9-skill system to someone
- [ ] Calculate a training gain (formula: 0.3 × ageMod × headroomMod × facilityMod × coachMod)
- [ ] Explain why $2.5M budget is a constraint
- [ ] Describe the race format (40 riders, single gate, F1 points)
- [ ] Run the game locally and create a game
- [ ] Navigate the Hub (calendar, standings, roster, money)
- [ ] Plan a budget allocation (salaries, hardware, R&D, reserve)
- [ ] Understand what "potential" means (hidden ceiling)
- [ ] Know where to find documentation (CLAUDE.md, /docs/)

---

## Resources

- **Main Docs**: `CLAUDE.md` (architecture, specs, everything)
- **Quick Refs**: `docs/README.md` (navigation hub)
- **Rider Skills**: `docs/RIDER_SKILLS_REFERENCE.md`
- **Race Sim**: `docs/RACE_SIMULATION_GUIDE.md`
- **Economy**: `docs/ECONOMY_REFERENCE.md`
- **Code**: `src/` directory (TypeScript, well-commented)
- **Issues/PRs**: GitHub issues for known bugs & feature requests

---

## Final Checklist

- [ ] Read this file (ONBOARDING.md) ✓ You're here
- [ ] Read CLAUDE.md, section "LOCKED SPECIFICATIONS"
- [ ] Run `npm run dev`
- [ ] Create a game, click around, don't race yet
- [ ] Read one reference guide (pick: RIDER_SKILLS or ECONOMY or RACE_SIM)
- [ ] Ask one question in Slack
- [ ] Run a full season (20 rounds)
- [ ] Read a code file (`src/game/training.ts` or `src/sim/index.ts`)
- [ ] You're onboarded! 🎉

---

**Welcome to the team!**

Questions? Slack the Documentation Agent (me) anytime.

**Last Updated**: 2026-07-09
