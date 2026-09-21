# Self-test

The self-test runs the handoff against `fixture/wp-event-manager`, a WordPress plugin
carrying 76 deliberately seeded defects (22 critical, 32 high, 13 medium, 9 low), and
scores the result against `ground-truth/issues.mjs`.

It never touches the user's repo: every arm copies the fixture into `mktemp -d`.

## Arms

Each arm isolates one variable. Run more than one or the numbers mean nothing.

| Arm | What runs | What it isolates |
| --- | --- | --- |
| `handoff` | reviewer model → plan → implementer model, plan only | the method as the skill ships it |
| `handoff-review` | same, but the implementer also gets `REVIEW.md` | what the plan alone fails to carry |
| `oneshot` | one agent reviews and fixes in a single context | whether the handoff is worth paying for |
| `skill` | the real skill, invoked headlessly end to end | that the orchestration itself works |

`oneshot` is the control. If it matches the handoff on fix rate for less money, the
handoff is only worth it for the audit trail — which is a legitimate answer, and worth
reporting honestly.

## What gets measured

Per arm, per phase:

- **Review recall** — of 76 known defects, how many the review reports. Graded by an LLM
  judge against the key (`harness/judge.sh`); `grade-review.mjs` is a fast heuristic that
  over-counts and should not be quoted.
- **Fix rate** — of 75 auto-checkable defects, how many the code no longer exhibits.
  Deterministic regex detectors in `harness/check.mjs`.
- **Tokens** — input, output, cache reads and creation, billed separately.
- **Cost** — `total_cost_usd` from the CLI result envelope.
- **Peak context** — the largest window any single turn occupied, and what share of the
  model's context that was.
- **Wall time**, **turns**, **tool calls**.
- **Derived**: cost per issue fixed, tokens per issue fixed, recall-to-fix conversion
  (of the defects the reviewer found, what share did the implementer land).

Every run appends one row to `results/runs.jsonl`. `harness/report.mjs` regenerates
`results/report.md` and `results/results.csv` from the ledger.

## Reading the result

- **Fix rate far below recall** — the plan is not carrying the finding. Read the skipped
  steps in `IMPLEMENTATION.md`; that is the handoff failing, and it is the interesting case.
- **`handoff-review` well above `handoff`** — the reviewer is writing plans that only make
  sense next to the review. Fix the rubric, not the implementer.
- **High fix rate, large diff** — check `fix.diff` before celebrating. The detectors test
  the shape of a fix, not its correctness.
- **Detectors passing on the untouched fixture** — the key is broken, not the model.
  `node harness/check.mjs fixture/wp-event-manager --baseline` must stay green.
