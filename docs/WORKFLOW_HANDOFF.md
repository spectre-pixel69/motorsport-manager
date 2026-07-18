# Workflow Handoff — Operating Guide for a Claude Build Agent

**What this is:** a drop-in operating guide that encodes the working style proven out on
the Paddock Boss repo. Copy it into any repo (root or `docs/`), fill in the
`[bracketed]` fields once, and the agent inherits the same discipline: build the thing
the boss actually asked for, in verified slices, with tight commits and low token waste.

**How to use it:** paste the "Prime directive" and "Per-repo config" sections near the top
of that repo's `CLAUDE.md` (or keep this whole file and reference it from `CLAUDE.md`).
Everything here is stack-agnostic — the Paddock Boss specifics are used only as worked
examples of the method.

---

## Per-repo config (fill this in once)

```
Repo:            [owner/name]
Target stack:    [e.g. Unreal Engine 5.8 C++ / Rust / Go / TS]  ← the ONE stack the boss wants
Work branch:     [claude/<name>-xxxx]   (develop + push here; never another branch)
Build/verify:    [command that proves a slice works, e.g. `cargo test`, `g++ -c …`, `npm run build`]
Reference oracle:[the existing/old implementation to match against, if this is a port]
Environment can run the target? [yes / no — and if no, how correctness is proven instead]
```

---

## 1. Prime directive — build what the boss specified, in the stack specified

This is the rule that matters most, because breaking it wastes weeks.

- **Build in the stack the boss named. Do not silently substitute another stack, framework,
  or approach** because it's easier, faster, or what you'd prefer. If the boss said Unreal,
  it is built in Unreal — not "also in a web stack," not "a prototype in X first."
- **"Do both" is not a compromise — it's a failure.** Two parallel implementations in two
  stacks help no one; only one ships. If you genuinely think a different approach is better,
  **stop and ask first** with a concrete recommendation. Never act on that opinion unilaterally.
- **When you show the boss "the game/app," show the real target build** — not a stand-in in a
  different stack. Showing something that isn't what they asked for erodes all trust, even if
  the stand-in "works."
- **Scope-changing or rule-ambiguous decisions ⇒ don't guess.** Ask, or log it for a ruling.

## 2. The verified-slice workflow (the core loop)

Never do a big-bang rewrite. Work in small, ordered units and prove each one before moving on.

1. **Plan the units in dependency order** and put them in a task list (foundation first:
   the things everything else imports). Mark one `in_progress` at a time.
2. **For each unit:** build it → **verify it** → **commit + push it** → mark it done.
3. A unit is not "done" because it's written. It's done when it's **verified and pushed.**

Worked example (Paddock Boss native port order):
`seeded RNG → data model → constants → world gen → game-logic systems → sim engine →
season/state → presentation layer → delete the old stack`.
The RNG went first because every outcome flows through it.

## 3. Two-layer architecture (for any engine/framework project)

Split the codebase so correctness doesn't depend on the heavy tool being installed:

- **Portable core** — the actual logic (rules, sim, economy, domain model), written with
  **zero dependency on the engine/framework**. Standard library only. This compiles and runs
  **standalone**, so it can be verified anywhere, cheaply.
- **Thin integration layer** — the engine/framework code (UI, actors, widgets, handlers) that
  only *calls into* the verified core and displays results. Keep it as thin as possible.

Payoff: even when the environment can't run the full engine, you can compile and run the core
headless and **prove the logic is correct** before the boss ever opens the heavy tool.

## 4. Verify-as-you-go against a reference oracle

When porting or rewriting, **keep the old implementation as the spec and prove the new code
matches it** before deleting the old:

- Run the old code and the new code on the same inputs; **diff the outputs.**
- Where behavior is deterministic (seeded RNG, hashing, money math, scoring), require
  **bit-/value-exact** matches, not "looks close." A tiny divergence in a foundation primitive
  corrupts everything downstream.
- Keep these checks as throwaway harnesses in a scratch dir — they're proof, not shipping code.
- Only after a system is proven equivalent does the old version become safe to delete.

The old stack is a **specification to match and then retire** — not something to keep running
alongside the new one.

## 5. Determinism & single-source-of-truth

- If the system is seeded/deterministic, **port the RNG first and make it exact.** State the
  contract in a comment ("same seed ⇒ same result; do not reorder these calls").
- **Change every tunable value in exactly ONE place, then re-derive.** Never hardcode a
  dependent copy. Locked constants get a named home and a comment pointing at the authority
  (spec/rulebook/§ref) that supersedes the code on conflict.

## 6. Git discipline

- Develop on the **designated work branch**; create it if missing. **Never push to another
  branch** without explicit permission. **Never force-push** shared history.
- **Commit each verified unit separately** with a clear message: what was ported/changed, why,
  and *how it was verified*. Push after each unit so nothing is lost (containers are ephemeral).
- Push with `git push -u origin <branch>`; on network failure retry with backoff (2s/4s/8s/16s).
- **Do not open a PR unless the boss asks.** If asked, mirror any repo PR template.

## 7. Honesty & environment constraints

- **State constraints plainly and early.** If the environment can't run the target (engine not
  installed, no GPU, etc.), say so up front and explain how you'll prove correctness anyway —
  don't paper over it.
- **Report outcomes faithfully:** if a check fails, show the output; if a step was skipped, say
  so; when something is verified, say that plainly without hedging.
- Never present a substitute as the real deliverable.

## 8. Token efficiency (the "tokenization" win)

- **Act when you have enough info.** Don't re-derive established facts, re-litigate settled
  decisions, or narrate options you won't pursue.
- **Delegate bulk/mechanical execution** (repetitive edits, well-specced builds) to a cheaper
  path/subagent when available; spend the expensive reasoning budget on architecture and
  correctness.
- **Verify in one place, once** — a single reference-diff beats eyeballing many files.
- **Small committed slices** keep context small: finished work leaves the working set instead
  of being re-explained.
- Prefer targeted reads/searches over dumping whole files into context.

---

### One-line summary

Build exactly what the boss asked, in their stack; prove each small slice against a reference
before committing it; keep the logic in a portable core you can verify anywhere; and never
show a substitute for the real thing.
