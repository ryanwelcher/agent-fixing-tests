# Two-model review handoff: results

_Generated 2026-09-21 15:38 from 1 run(s) in `results/runs.jsonl`._

Fixture: `wp-event-manager`, a WordPress plugin with 76 deliberately seeded defects
(22 critical, 32 high, 13 medium, 9 low). 75 are checked by deterministic regex detectors;
one is graded by hand. Fix rate is measured on the code, not claimed by the model.

## Headline

Two fix rates. **Detector** is the optimistic one: the broken pattern is gone and a
plausible API appears. **Verified** is the honest one: a judge read the code and confirmed
the defect is actually gone. Quote the verified number.

| Arm | Reviewer | Implementer | Detector | Verified | Verified rate | Cost | Tokens | Wall | Cost/verified fix | Surface | Lint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | haiku | haiku | 35/75 | - | - | $0.709 | 3,130,483 | 6m52s | - | intact | pass |

## Fix quality

Of the fixes the detectors passed, how many survive reading the code.

| Arm | Implementer | Correct | Superficial | Removed feature | Uncertain | Regressions introduced | Detector overstated by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | haiku | - | - | - | - | - | - |

## Fix rate by severity

| Arm | Run | Critical | High | Medium | Low |
| --- | --- | --- | --- | --- | --- |
| `handoff` | smoke-handoff | 15/22 | 15/32 | 2/12 | 3/9 |

## Fix rate by category

| Arm | Run | accessibility | correctness | i18n | performance | security | wp-standards |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | smoke-handoff | 1/3 | 5/11 | 1/1 | 0/4 | 27/44 | 1/12 |

## Review recall vs. fixes landed

The gap between what the reviewer found and what the implementer landed is the cost of the handoff.

| Arm | Run | Judge recall | False positives | Fixed | Found→fixed |
| --- | --- | --- | --- | --- | --- |
| `handoff` | smoke-handoff | ~35/76 (heur.) | - | 35 | 100% |

## Tokens and context, per phase

| Arm | Phase | Model | Turns | Tools | Output | Cache read | Billed in | Total | Cost | Peak context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `handoff` | review | haiku | 22 | 21 | 18,655 | 293,296 | 333,877 | 352,532 | $0.204 | 54,204 (27%) |
| `handoff` | fix | haiku | 53 | 52 | 24,072 | 2,695,948 | 2,753,879 | 2,777,951 | $0.505 | 71,202 (36%) |

## Where the handoff leaked

Defects the reviewer was looking at but the code still exhibits afterwards.


**`handoff` / smoke-handoff** — 40 still open:

```
WP-01 WP-02 DEF-01 BUG-01 WP-03 DBG-01 SEC-04 SEC-05 TZ-01 SEC-06 SEC-10 SEC-12 PERF-01 WP-04 SEC-16 SEC-17 SEC-18 SEC-19 SEC-22 SEC-25 WP-05 SEC-30 WP-06 PERF-02 BUG-05 PERF-04 PERF-05 BUG-06 BUG-07 SEC-35 SEC-36 A11Y-02 SEC-40 A11Y-03 DEF-02 WP-08 JS-02 JS-03 JS-05 JS-07
```

## Raw data

- `results/runs.jsonl` — one JSON object per run, the source of truth.
- `results/results.csv` — one row per run.
- `results/phases.csv` — one row per phase, with the per-turn context series.
- `runs/<name>/` — transcripts (`*.jsonl`), `REVIEW.md`, `PLAN.md`, `IMPLEMENTATION.md`, `fix.diff`.

