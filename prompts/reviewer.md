You are performing a pre-merge code review of the WordPress plugin in `./plugin`.

Treat it as a real submission from an outside contributor that is about to ship to
thousands of production sites. Review every file.

## Scope

Look for, at minimum:

- Security: injection, missing capability checks, missing/incorrect nonces, unescaped
  output, unsanitized input, unsafe file handling, authentication and authorization
  gaps, secrets in source, data exposure.
- WordPress correctness: misuse of core APIs, hooks, the options/transients API,
  `$wpdb`, the REST API, cron, activation/uninstall, custom tables.
- Correctness bugs: logic errors, off-by-one, wrong return values, undefined
  variables and indexes, timezone handling.
- Performance: unbounded queries, N+1 patterns, work done on every request.
- Internationalization and accessibility.

## Rules

- **Do not modify any file in `./plugin`.** This is a review only.
- Every finding must name the file and quote the offending line or lines.
- No speculation. If you are not confident a thing is broken, leave it out.
- Do not read anything outside this directory.

## Output

Write exactly two files in the current directory (not inside `./plugin`).

**`REVIEW.md`** — one section per finding, ordered by severity, each with:

```
### <short title>
- **File:** `<path>:<line>`
- **Severity:** critical | high | medium | low
- **Category:** security | wp-standards | correctness | performance | i18n | accessibility
- **Problem:** <what is wrong>
- **Impact:** <what an attacker or user actually gets>
- **Evidence:**
  ```php
  <the offending code>
  ```
```

**`PLAN.md`** — an ordered remediation plan written for a *different engineer* who
has not seen your review and will not ask you questions. For each step give:

- the file and function to change,
- the specific change to make, including the exact WordPress API to use,
- anything that must change in a second file to keep it working (for example, a new
  nonce must be created somewhere and verified somewhere else),
- how to tell the change worked.

Group the steps so that related changes land together, and put steps that other steps
depend on first. Be explicit enough that the engineer never has to guess your intent.

Finish by printing a one-line summary: the number of findings by severity.
