---
name: review-handoff
description: Review a codebase with one model, then hand the remediation plan to a second model in a fresh context to implement it, verify the result and report. Use when the user asks to review and fix a repo, run a two-model review/fix handoff, audit and remediate a plugin or codebase, or run the handoff self-test. Also covers WordPress plugin security and standards reviews.
---

# Review handoff

Two agents, two contexts. A **reviewer** reads the code and writes a plan but changes
nothing. An **implementer** starts cold with only the plan and applies it. Then the work
is verified and reported.

The split is the point: the implementer never sees the reviewer's reasoning, so a vague
plan fails loudly instead of being silently rescued by shared context.

## Arguments

```
/review-handoff [target] [--reviewer <model>] [--implementer <model>]
                [--diff | --staged] [--dry-run] [--selftest [quick|full]]
```

- `target` — path to review. Default: the working directory.
- `--diff` / `--staged` — review only changed files instead of the whole tree.
- `--reviewer` — default `opus`. `--implementer` — default `sonnet`.
- `--dry-run` — stop after the plan. Nothing is edited.
- `--selftest` — skip everything below and run **Self-test** instead.

## Phase 0 — Preflight

Do this before spawning anything.

1. **Refuse to work on a dirty tree.** Run `git status --porcelain`. If it is not empty,
   stop and tell the user to commit or stash. Their uncommitted work is not yours to risk.
   If the target is not a git repo, say so and ask before continuing — without git there
   is no undo.
2. **Branch.** `git checkout -b review-handoff/$(date +%Y%m%d-%H%M%S)`. Never work on the
   default branch. Never push, and never open a PR unless the user asks.
3. **Scope.** Build the file list. With `--diff`, use `git diff --name-only`; with
   `--staged`, `--cached`. Otherwise walk the tree, skipping `node_modules`, `vendor`,
   `.git`, build output and lockfiles. If the list exceeds ~200 files, report the size
   and ask which subtree to review rather than guessing.
4. **Find the verify command.** Look, in order, for: a `test` / `lint` script in
   `package.json`, `composer.json` scripts, a `Makefile` target, `phpunit.xml`,
   `phpcs.xml`. Record what you find. If nothing exists, fall back to syntax-only checks
   (`php -l`, `node --check`) and say so in the report — an unverified fix is a claim,
   not a result.

Write the preflight facts to `.review-handoff/context.md`: branch name, scope, file
count, verify command. Both agents read it.

## Phase 1 — Review

Spawn **one** agent. Read `reference/review-rubric.md` and pass it as the prompt, with
the target path and `.review-handoff/context.md` appended.

```
Agent(
  subagent_type: "general-purpose",
  model: <reviewer>,
  description: "Review codebase",
  prompt: <contents of reference/review-rubric.md> + scope + context
)
```

The reviewer writes `.review-handoff/REVIEW.md` and `.review-handoff/PLAN.md`. It must
not edit the code. When it returns, verify that with `git status --porcelain` — if the
tree changed, reset those files and note the violation in the report.

Commit the artifacts: `git add .review-handoff && git commit -m "review-handoff: plan"`.
This checkpoint is what makes the next phase safe to undo.

If `--dry-run`, stop here and show the user the plan.

## Phase 2 — Implement

Spawn a **second, fresh** agent. Read `reference/plan-contract.md` and pass it as the
prompt. Give it the plan and the target path.

**Pass `PLAN.md` only. Do not pass `REVIEW.md` and do not summarize the review for it.**
That isolation is the experiment. If the plan is not self-sufficient, that is a finding
about the reviewer, and you want to see it.

```
Agent(
  subagent_type: "general-purpose",
  model: <implementer>,
  description: "Apply remediation plan",
  prompt: <contents of reference/plan-contract.md> + plan + scope + context
)
```

## Phase 3 — Verify

1. Run the verify command from preflight. Capture the output.
2. If it fails, spawn **one** repair agent with the failure output and the plan. Re-run.
   Allow at most **two** repair rounds, then stop and report the failure honestly. Do not
   keep grinding, and do not weaken a test to make it pass — if a test now fails because
   the fix was wrong, say the fix was wrong.
3. Re-read the plan and check each step against the diff (`git diff --stat` and the file
   contents). Mark every step done, partially done, or skipped.

Commit: `git add -A && git commit -m "review-handoff: apply plan"`.

## Phase 4 — Report

Print, and write to `.review-handoff/RESULT.md`:

- Branch name and how to undo (`git checkout <original> && git branch -D <branch>`).
- Findings by severity, and how many the implementer actually landed.
- **Every plan step that was skipped or only partially applied, and why.** This is the
  most valuable part of the report. Lead with it if the list is non-empty.
- Verify command output: pass or fail, with the failing output if it failed.
- Anything the implementer changed that the plan did not ask for.

Never report success for a phase you did not actually run.

## Self-test

`--selftest` runs the whole pipeline against a fixture with 76 known, deliberately
seeded defects and scores the result. It answers "does this skill still work" with a
number instead of a vibe.

```bash
.claude/skills/review-handoff/scripts/selftest.sh quick   # 1 arm, cheap models, ~5 min
.claude/skills/review-handoff/scripts/selftest.sh full    # the whole matrix
```

Run it, then show the user the summary table it prints. Every run appends to
`results/runs.jsonl` and regenerates `results/report.md` and `results/results.csv`.

The self-test never touches the user's repo — it copies the fixture into a temp
directory. See `reference/self-test.md` for the arms and what each one isolates.

## Rules

- Two contexts, always. Never review and fix in one agent, and never paste the review
  into the implementer's prompt. The isolation is the method.
- The reviewer does not edit. The implementer does not re-review; it executes the plan
  and reports what it could not do.
- Report what happened, including skipped steps and failed verification. A run that
  fixed 12 of 30 findings and says so is useful. One that claims 30 is not.
