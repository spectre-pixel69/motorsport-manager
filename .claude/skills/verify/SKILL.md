---
name: verify
model: haiku
description: The Paddock Boss pre-commit gate — typecheck + production build, plus a full-season sim run when game logic changed. Use after any nontrivial change under src/ and before committing. Not needed for docs-only or comment-only diffs.
---

# verify — Paddock Boss pre-commit gate

Run this before committing any nontrivial change. It is the single source of
truth for "is this change safe to ship." Report results plainly; if anything
fails, do NOT commit — fix or report the failure with its output.

## 1. Always: typecheck + build

```bash
npm run build     # tsc -b && vite build — must end "✓ built"
```

Any TypeScript error or a non-zero exit fails the gate.

## 2. When game logic changed: full-season sim

If the diff touches `src/game/`, `src/sim/`, or `src/data/`, run a season to
prove the change doesn't crash the loop or skew balance:

```bash
npx tsx run-full-season.ts     # must print "SEASON … COMPLETE", no stack trace
```

For balance-sensitive changes (points, ballast, penalties, reliability), write a
tiny throwaway harness in the repo root that runs several seeded seasons and
prints the metric you changed (see how penalty frequency was checked — new
career, loop `runRound` 20×, tally), run it, then delete it. Don't eyeball;
measure.

## 3. UI-only change

If the diff only touches `src/ui/`, the build gate is enough — but confirm the
edited screen is actually reachable in the live app (routed from
`HubScreenNew` / `TeamDashboard`), not an orphaned component. A build passing on
a dead screen is not a real verification.

## Pass criteria

- `npm run build` ends `✓ built`, exit 0.
- Sim (if run) prints season-complete, no exception.
- UI change lands on a live-routed screen.

Only then is the change eligible to commit.
