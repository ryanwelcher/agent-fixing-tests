# agent-fixing-tests

A benchmark for the two-model workflow: **one model reviews and plans, a different model
implements the fixes.** The subject is a deliberately awful WordPress plugin with 76
seeded defects and a deterministic scorer.

> **The plugin in `fixture/` is intentionally vulnerable.** It contains SQL injection,
> unauthenticated destructive endpoints, arbitrary file upload and hardcoded credentials.
> It is a test fixture. Never install it on a real WordPress site.

## What gets measured

| Phase | Question | Graded by |
| --- | --- | --- |
| Review | Did the reviewing model find the defects? | `harness/judge.sh` (LLM judge vs. the key), or `grade-review.mjs` for a fast heuristic |
| Plan | Was the plan good enough for a second model to act on with no context? | `--plan-only` mode, then the fix score |
| Fix | Did the implementing model actually fix them, without breaking the plugin? | `harness/check.mjs` — 75 regex detectors + `php -l` / `node --check` |

## Layout

```
fixture/wp-event-manager/   the broken plugin (pristine; never edited by a run)
ground-truth/issues.mjs     the answer key: 76 issues with detectors and keywords
harness/                    run scripts and scorers
prompts/                    reviewer.md, implementer.md, judge.md
runs/<name>/                one experiment: plugin/, REVIEW.md, PLAN.md, plugin-fixed/, score.json
```

## Run it

```bash
# full pipeline: fresh copy -> review -> fix -> score
./harness/run.sh opus-to-sonnet opus sonnet

# or step by step
./harness/new.sh my-run                 # fresh copy of the fixture + detector sanity check
./harness/review.sh my-run opus         # writes runs/my-run/REVIEW.md and PLAN.md
./harness/fix.sh my-run sonnet          # writes runs/my-run/plugin-fixed/ and fix.diff
./harness/score.sh my-run               # lint + fix score + heuristic review recall
./harness/judge.sh my-run opus          # LLM-graded review recall -> GRADE.json
```

Each agent phase runs in a `mktemp -d` sandbox containing only the plugin (and, for the
fix phase, the plan). The answer key never enters the agent's working directory.

### The interesting flag

```bash
./harness/fix.sh my-run sonnet --plan-only
```

Hands the implementer `PLAN.md` **without** `REVIEW.md`. This is the real test of the
handoff: a plan that only makes sense next to the review it came from will score worse
here than one written to stand alone.

## Experiments worth running

- **Model matrix.** Same reviewer, different implementers, and vice versa. Where does
  the score actually come from — finding the bugs or fixing them?
- **Plan quality.** `--plan-only` vs. full context, same models. The gap is the cost of a
  vague plan.
- **Self-review.** Same model on both ends as the control.
- **Cheap reviewer, strong implementer.** Often the most useful configuration to know about.
- **Severity triage.** `node harness/check.mjs <dir> --sev=critical,high` to score only
  what would block a release.
- **Scope discipline.** Read `fix.diff`. An implementer that rewrote the architecture
  instead of applying the plan is a finding, even if the score is high.

## The answer key

`ground-truth/issues.mjs` holds one entry per seeded defect:

```js
{
  id: 'SEC-09', cat: 'security', sev: 'critical',
  file: 'includes/class-event-db.php',
  title: 'SQL injection in get_rsvps() via $event_id and $status',
  why: 'Unprepared string concatenation straight into the query.',
  keywords: [ 'sql injection', 'prepare', 'wpdb', 'concatenat' ],
  forbid: [ /WHERE event_id = " \. \$event_id/ ],   // must be gone after a fix
  require: [ /\$wpdb->prepare/ ],                    // must be present after a fix
}
```

Spread: 22 critical, 32 high, 13 medium, 9 low — 44 security, 12 WP standards,
11 correctness, 5 performance, 3 accessibility, 1 i18n.

Every detector is verified to fire against the untouched fixture:

```bash
node harness/check.mjs fixture/wp-event-manager --baseline
```

Run that after any edit to the fixture or the key. If a detector reports PASS on the
pristine plugin, it is measuring nothing.

## Known limits

- **`grade-review.mjs` is a proxy, not a grade.** It matches on file + nearby keywords,
  so one mention of "SQL injection" in `class-event-db.php` can credit several of the
  five injection issues in that file. Use `harness/judge.sh` for a number you can quote.
- **Detectors check for the shape of a fix, not its correctness.** A model can satisfy
  `/\$wpdb->prepare/` with a wrong placeholder. Read `fix.diff` before trusting a high score.
- **One issue (`PERF-03`) is marked `codeCheck: false`** — the N+1 in the shortcode loop
  has no single textual signature. It is graded from the review and the diff by hand.
- Agents run with `--dangerously-skip-permissions` so they can lint their own work. They
  are confined to a temp copy. Set `SAFE=1` to use `acceptEdits` instead, at the cost of
  the agents' ability to run `php -l`.
