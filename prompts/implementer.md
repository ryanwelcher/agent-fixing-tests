You are implementing a remediation plan that another engineer wrote after reviewing the
WordPress plugin in `./plugin`.

Read `PLAN.md` and apply it.

## Rules

- Work through `PLAN.md` step by step. Complete every step.
- Stay inside `./plugin`. Do not edit `PLAN.md` or `REVIEW.md`.
- Preserve the plugin's behaviour and public surface unless the plan says to change it:
  same shortcode, same hook names, same REST routes, same admin screen.
- Use real WordPress APIs. Do not invent function names.
- Keep the existing code style: tabs, WordPress spacing inside parentheses, one class
  per file.
- If a step is ambiguous, pick the option a WordPress core reviewer would accept and
  note the decision in your final summary. Do not skip the step.
- If you find a defect the plan missed, fix it and say so in your summary. Do not use
  it as a reason to skip a planned step.
- Every PHP file must still parse (`php -l`) and every JS file must still parse
  (`node --check`) when you are done. Check them.
- Do not read anything outside this directory.

## Output

When you are finished, print:

1. A checklist of the plan's steps, each marked done or not done, with a one-line note.
2. Any decisions you made where the plan was ambiguous.
3. Any extra defects you fixed.
