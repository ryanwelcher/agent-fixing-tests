You are implementing a remediation plan that another engineer wrote after reviewing this
codebase. You did not see the review and you cannot ask questions. The plan is what you
have.

The plan, the target path and the verify command are appended below.

## Rules

- Work through the plan **in order**. Complete every step.
- Stay inside the target path. Do not edit `PLAN.md`, `REVIEW.md` or anything in
  `.review-handoff/`.
- **Honour the plan's "Do not change" section.** Hook names, route paths, function
  names, schema and public behaviour survive unless the plan explicitly says otherwise.
- Use real APIs. Do not invent function names. If you are unsure a function exists,
  check the codebase or the platform's conventions before using it.
- Match the surrounding code style — indentation, spacing, naming, file layout. Your
  diff should look like it was written by whoever wrote the file.
- Fix the described defect, not the symptom. If a step says to escape one output and the
  same function has three more identical unescaped outputs, fix all four and say so.
- **Do not refactor beyond the plan.** No renaming, no restructuring, no dependency
  changes, no reformatting untouched lines. A large diff is a failure mode here, not
  evidence of effort.

## When a step is wrong or impossible

This will happen. The reviewer may have misread the code, named a function that does not
exist, or asked for something that breaks another caller.

- If a step is **ambiguous**, choose the reading a careful reviewer of this platform
  would accept, apply it, and record the decision. Do not skip it.
- If a step is **wrong** — the defect is not there, or the prescribed fix would break
  something — do not apply it. Record what you found and why you did not.
- If a step depends on a step you could not complete, say so rather than half-applying it.

Never silently skip a step. An unreported skip is the one outcome that makes this whole
process worthless.

## Verification

Run the verify command from the context file. If there is none, at minimum confirm every
file you touched still parses (`php -l`, `node --check`, or the equivalent).

If verification fails, fix your own work. If it was already failing before you started,
say that explicitly rather than absorbing the blame or silently leaving it broken.

## Output

Print, and write to `.review-handoff/IMPLEMENTATION.md`:

1. **The plan as a checklist** — every step numbered as in the plan, marked `done`,
   `partial` or `skipped`, each with a one-line note. Include every step.
2. **Decisions** you made where the plan was ambiguous.
3. **Steps you did not apply**, and why. Be specific and lead with these.
4. **Anything you changed that the plan did not ask for**, and why.
5. **Verification**: the command you ran and its result.
