---
name: paddock-shift
model: opus
description: Run one Paddock Boss build shift — pick a real unit of work, build it to the design system, verify, commit and push, and log scope questions for a ruling. Use when a "Scheduled build shift" brief fires, or the user says /paddock-shift. Honors the boss rules (rulebook PDF is authority; no scope-changing or irreversible decisions unattended).
---

# paddock-shift — one Paddock Boss build shift

Do ONE complete, verified, pushed unit of work. Ship quality over quantity.
Branch: `claude/motorsport-manager-jn6ugx`. Never force-push.

## Authority & guardrails

- **`docs/NAMC_RULEBOOK_v15.3_07162026.pdf` is the only authority on league
  rules.** When code and PDF disagree, the PDF wins — read the § before touching
  a rule.
- **No scope-changing or irreversible decisions unattended.** If a task needs a
  ruling (balance tune, new class, discipline support, rulebook conflict), write
  the question into a task via TaskCreate and move on — don't guess.
- Demo work (task #17) is ON HOLD until all three disciplines are in.

## Priority order — pick the first that has a real unit

1. **Flesh out live screens.** Take an existing screen/stub (dashboard sub-pages,
   rider detail, financial tracker, league health, standings, showroom detail
   views, garage) and make it complete and information-rich using the design
   system (dark glass-morphism, `dashboard.css`) and existing game data. Every
   button must route somewhere real — **do not polish an orphaned component**
   (grep that it's imported/routed from `HubScreenNew`/`TeamDashboard` first).
2. **Sim items** from `docs/SIMULATION_FINDINGS.md` priority table (per-component
   reliability, gate selection, penalties enforcement, sponsors, …).

Prefer work that surfaces data the sim already produces but the UI never shows —
those are clean, live, bounded wins.

## The loop

1. **Scout**: survey for a thin-but-live target (grep for stubs, check the
   component is routed). If nothing is actionable, stop quietly — don't
   manufacture busywork or re-do finished tasks.
2. **Build** it to the design system, reading the surrounding code's idioms.
3. **Verify**: invoke the `verify` skill (build + sim as appropriate). Fix
   failures before proceeding.
4. **Commit + push** this one unit with a clear message; end with the repo's
   trailer:
   ```
   Co-Authored-By: Claude <noreply@anthropic.com>
   Claude-Session: <session url>
   ```
   `git push -u origin claude/motorsport-manager-jn6ugx` (retry on network error
   with backoff; never force-push).
5. **Log** any scope/ruling question found along the way as a task.
6. Report: what shipped, what was verified, and any ruling now waiting.

## Anti-patterns (seen in past shifts)

- Re-implementing an already-complete task because a brief re-fired — confirm
  state first, don't churn finished code.
- Committing changes to an orphaned screen and calling it "fleshed out."
- Making a balance/scope call unilaterally instead of logging it for a ruling.
