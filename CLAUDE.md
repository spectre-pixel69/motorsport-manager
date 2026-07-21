# Paddock Boss — NAMC v15.3 Manager Game

**Repo**: spectre-pixel69/motorsport-manager · **Branch**: claude/motorsport-manager-jn6ugx
**Stack**: TypeScript · Preact · Vite · Node/Express · UE5.8 client (`PaddockBoss-UE5/`)
**Status**: v0.1.0 — NAMC core loop live; GP/SBK data exists, career support partial.

This file is a **directory**, not documentation. It points to where things live and
pins the constraints that aren't derivable from the code. Deep detail lives in the
modules; league rules live in the PDF.

## ⚠️ SOURCE OF TRUTH

The ONLY authority for NAMC rules is **`docs/NAMC_RULEBOOK_v15.3_07162026.pdf`**.
When the PDF and this file disagree, **the PDF wins.** Read the relevant § before
implementing any league rule. Data-model source of truth is `src/data/types.ts`.

## Locked constants (honor these; PDF supersedes on conflict)

- **Format** (§3, §10, §11): 20-round all-outdoor, S4-only. Unified 40-rider single
  gate (no motos/relegation). 4 classes: 350 Pro, 250 Men, 250P Restricted, Women's 250.
- **Points** (§11.2): Main `75/60/52/37/36/35…1`; Sprint = each halved. The 3rd→4th
  cliff (52→37) is intentional.
- **Dynamic ballast** (§8.6): win +2kg / podium +1kg / P4+ −1kg next round; 0.07s/lap
  per kg; **cap 8kg** (§14 glossary; ~0.56s/lap); resets each season; all classes.
- **Budget**: $2.5M/season fixed, no mid-season funding. Per-round purse $800k across
  4 classes; 25% to riders, 75% operational.
- **Penalties** (§13.1): 4-tier — warning → fine (100% to Rider Welfare Fund §13.5) →
  suspension 1–4 rounds → charter revocation. Terminal tech violations §12.4.
- **Engine modes**: conserve 0.6× / standard 1.0× / push 1.6× / attack 2.2× (wear+risk).
  Pace deltas + multipliers: `src/game/reliability.ts` (single source; sim reads it).
- **Rider salary floors** (annual): 350 Pro $400k · 250 Men $200k · 250P $100k ·
  Women's $100k. Appearance $1k/round · bench retainer $50k · 40th-place min $5k/round.
- **Design palette** (locked): bg `#0a0e27` · panels `#15192e`/`#1a1f3a` · green
  `#2ecc71` · blue `#3498db` · red `#e74c3c` · gold `#f39c12`. Glass-morphism, backdrop
  blur, 0.2–0.3s ease. Breakpoints 600/900/1200. CSS: `dashboard.css`, per-screen `*.css`.

## Directory map

```
src/
├── data/        # models + constants (source of truth for shapes)
│   types.ts · universe.ts (seeded world gen) · classes.ts · namc.ts (calendar/rules)
│   bikes.ts · setups.ts · staff.ts · brand.ts · parody.ts (GP/SBK teams) · tracks.ts
│   riders.ts · traits.ts · names.ts · gatePreference.ts · seasonal-weather.ts
│   gp.ts · sbk.ts    # MotoGP / WorldSBK rulesets (verified accurate for 2026)
├── game/        # logic layer
│   index.ts (GameManager) · state.ts (CareerState, runRound, standings, save/load)
│   economy.ts · training.ts · reliability.ts · penalties.ts · psychology.ts
│   parts-economy.ts · supply-chain.ts · news.ts · trackDays.ts
├── sim/         # race engine
│   engine.ts (lap-by-lap, seeded) · motocross.ts (gate starts, terrain) · weekend.ts
│   single-season.ts · crash-severity.ts
├── ui/          # Preact screens
│   HubScreenNew.tsx (live hub) · TeamDashboard.tsx (NAMC dashboard) · RaceView.tsx
│   NewGame.tsx · Showroom.tsx (+ showroom/) · garage/PartsManager.tsx · training/
│   dashboard/ (ClassPanel, FinancialTracker, LeagueHealth, RiderDetailModal, …)
├── api/         # Express: server.ts (save/load + /api/hub for UE5 client), client.ts
└── util/        # rng.ts (seeded — determines all outcomes) · telemetry.ts
```

UE5.8 native client lives in `PaddockBoss-UE5/` (C++ UMG; `BossHubWidget` + `ShowroomStage`,
talks to the Express `/api/hub` endpoint). Reference art: `art/reference/`.

## Key files

| Want to change… | Edit |
|---|---|
| Data shapes / interfaces | `src/data/types.ts` |
| World generation | `src/data/universe.ts` |
| Budget / purse / salaries | `src/game/economy.ts` |
| Training gains, stamina, age curves | `src/game/training.ts` |
| Part failure, wear, engine-mode effects | `src/game/reliability.ts` |
| Penalties / welfare fund | `src/game/penalties.ts` |
| Season loop, standings, save/load | `src/game/state.ts` |
| Race outcomes (pace, failures, overtakes) | `src/sim/engine.ts` |
| NAMC classes/calendar constants | `src/data/namc.ts` |
| Live hub / dashboard | `src/ui/HubScreenNew.tsx` · `src/ui/TeamDashboard.tsx` |

## Round flow

`runRound` (state.ts): approach selection → run weekends per class → apply points →
settle economy → injuries/ballast/penalties → psychology → history → save. Sim is
deterministic under the seeded RNG (`util/rng.ts`); same seed ⇒ same season.

## Conventions

- **Change tunable values in ONE place**, then re-derive — never hardcode a dependent copy.
- **Hand token-heavy execution to Codex — don't burn it here.** Delegate via the
  codex plugin (`/codex:*`) for: bulk or repetitive file edits, well-specced
  builds (clear spec, little ambiguity), and any bug still failing after 2 local
  attempts. Always show the diff for review before writing the changes.
- Verify before commit: `npm run build` (tsc + vite) and a sim run (`run-full-season.ts`);
  commit + push each unit to the branch; never force-push.
- New locked constraint ⇒ add it to "Locked constants" above **and** honor the PDF.
- Scope-changing or rule-ambiguous decisions ⇒ don't guess; open a task for a boss ruling.

## Where the rest lives

- **Rule detail / glossary / §refs** → the rulebook PDF (`docs/`).
- **System internals** → the module itself (`training.ts`, `reliability.ts`, `economy.ts`, …).
- **Backlog / roadmap / open questions** → the task list (see the migrated backlog task
  and the open BOSS-RULING tasks) and `docs/SIMULATION_FINDINGS.md`.
