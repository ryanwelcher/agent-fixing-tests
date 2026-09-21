# review-handoff

A Claude Code skill that **reviews a codebase with one model, then hands the plan to a
second model in a fresh context to implement it** — plus the fixture and scoring rig
that prove it still works.

Run it and come back to a branch with the fixes applied, a plan, an implementation
report, and an honest list of what was skipped.

```
/review-handoff                        review and fix the current repo
/review-handoff src/ --dry-run         plan only, change nothing
/review-handoff --selftest quick       prove the skill works, on a known-bad fixture
```

## Why two agents

The implementer never sees the reviewer's reasoning. It gets `PLAN.md` and nothing else.

That is the whole method. A plan that only makes sense next to the review it came from
fails loudly here instead of being silently rescued by shared context — which is exactly
what happens when one agent reviews and fixes in a single session, and exactly why that
version looks better than it is.

The self-test measures the cost of that choice rather than assuming it.

## Layout

```
.claude/skills/review-handoff/
  SKILL.md                    the orchestrator: preflight, review, implement, verify, report
  reference/review-rubric.md  the reviewer's prompt
  reference/plan-contract.md  the implementer's prompt
  reference/self-test.md      the arms and how to read them
  scripts/selftest.sh         the self-test driver

fixture/wp-event-manager/     a WordPress plugin with 76 seeded defects
ground-truth/issues.mjs       the answer key: detectors + keywords per defect
harness/                      arms, scorers, telemetry, ledger, report generator
results/                      runs.jsonl, report.md, results.csv, phases.csv
runs/<name>/                  per-run transcripts and artifacts (git-ignored)
```

The self-test runs the **same prompt files the skill uses**. There is no second copy to
drift out of sync.

## Using the skill on a real repo

Preflight refuses to start on a dirty tree, then works on a new
`review-handoff/<timestamp>` branch and commits a checkpoint after the plan, so the fix
phase is always one `git reset` from undone. It never pushes and never opens a PR.

Output lands in `.review-handoff/`: `REVIEW.md`, `PLAN.md`, `IMPLEMENTATION.md`,
`RESULT.md`. Read the skipped steps in `IMPLEMENTATION.md` first — that list is the most
useful thing the run produces.

## The self-test

```bash
.claude/skills/review-handoff/scripts/selftest.sh quick    # 1 arm, haiku, ~5 min
.claude/skills/review-handoff/scripts/selftest.sh full     # 4 arms, ~30-60 min
.claude/skills/review-handoff/scripts/selftest.sh handoff oneshot --reviewer opus
```

Each arm copies the fixture into `mktemp -d`, runs headlessly, and scores the resulting
code against the key. Your repo is never touched.

| Arm | What it isolates |
| --- | --- |
| `handoff` | the method as the skill ships it — plan only |
| `handoff-review` | what the plan alone fails to carry |
| `oneshot` | whether the handoff is worth paying for |
| `skill` | that the orchestration itself works end to end |

`oneshot` is the control. If it matches the handoff for less money, the handoff is only
buying an audit trail — a legitimate finding, and one worth reporting.

## What gets measured

Deterministically, from the code and the CLI's own telemetry — not from what the model
claims it did:

- **Detector fix rate** — of 75 auto-checkable defects, how many the code no longer
  exhibits (`harness/check.mjs`, regex detectors). The optimistic number.
- **Verified fix rate** — of those, how many survive a judge reading the actual code
  (`harness/verify-fixes.sh`). Catches `prepare()` with the variable still interpolated,
  escaping applied to the wrong value, a capability check placed after the side effect.
  **This is the number to quote.**
- **Public surface intact** — 34 markers (routes, hooks, shortcode, DB methods, columns)
  must still exist (`harness/surface.mjs`). Catches a model that deletes the vulnerable
  function instead of fixing it, which otherwise scores as a pass.
- **Regressions** — defects the fix introduced, found by the same judge reading the diff.
- **Review recall** — how many of the 76 the review reported (`harness/judge.sh`, an LLM
  judge against the key).
- **Tokens** — input, output, cache reads and cache creation, billed separately.
- **Cost** — `total_cost_usd` from the result envelope.
- **Peak context** — the largest window any single turn occupied, and what share of the
  model's window that was, reconstructed per turn from the stream-json transcript.
- **Turns, tool calls, wall time.**
- **Derived** — cost per issue fixed, tokens per issue fixed, and found→fixed conversion.

## The data

Every arm appends one row to `results/runs.jsonl` (append-only; the source of truth).
`harness/report.mjs` regenerates:

- `results/report.md` — markdown tables, ready to paste into a draft
- `results/results.csv` — one row per run
- `results/phases.csv` — one row per phase, including the per-turn context series

Full transcripts stay in `runs/<name>/*.jsonl` if you need to quote one.

## Keeping it honest

- `node harness/check.mjs fixture/wp-event-manager --baseline` asserts every detector
  still fires on the untouched fixture. The self-test runs this first and aborts if it
  fails. A detector that passes on the broken fixture is measuring nothing.
- **Detectors check the shape of a fix, not its correctness.** `/\$wpdb->prepare/` can be
  satisfied with a wrong placeholder. That is why the verified rate exists — run with
  `--verify` and quote that instead. Detector rate alone overstates the result, and it
  overstates it most for weaker implementer models.
- **`grade-review.mjs` over-counts** — it matches file + nearby keywords, so one mention
  of "SQL injection" can credit several of the five injections in that file. Quote
  `judge.sh`, not the heuristic.
- One defect (`PERF-03`) has no reliable textual signature and is graded by hand.
- Agents run with `--dangerously-skip-permissions` inside a temp copy so they can lint
  their own work. `SAFE=1` uses `acceptEdits` instead, at the cost of that ability.

> The plugin in `fixture/` is **intentionally vulnerable** — SQL injection, unauthenticated
> destructive endpoints, arbitrary file upload, hardcoded credentials. It is a test
> fixture. Never install it on a real site.
