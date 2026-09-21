A set of defects in the WordPress plugin under `./plugin` were supposed to be fixed. An
automated detector says each one now passes. Detectors match patterns, so they can be
satisfied by a fix that does not actually work.

Your job is to check the code and say which fixes are real.

- `claims.json` — the defects the detector believes are fixed.
- `./plugin` — the code as it stands now.
- `fix.diff` — what changed.

## For each claim

Read the actual code at that location. Do not trust the diff summary and do not trust
the detector. Decide:

- `correct` — the defect is genuinely gone and the code still does its job.
- `superficial` — the pattern the detector looks for is present, but the defect survives.
  This is the case you are here to catch. Examples of what that looks like:
  - `$wpdb->prepare()` called but the variable is still concatenated into the SQL string,
    or the placeholder is wrong (`%s` for an integer column used in an `IN` clause, a
    placeholder count that does not match the arguments).
  - An escaping function applied to a different variable than the one that is output, or
    applied where it does nothing (`esc_html()` on a value that is then passed through
    `html_entity_decode`, escaping the safe half of a concatenation).
  - A capability or nonce check that is present but unreachable, checked after the side
    effect has already happened, or whose result is ignored.
  - Sanitizing a copy while the original is still used.
  - A guard that always evaluates true.
- `removed` — the feature was deleted rather than fixed. The defect is gone because the
  code is gone.
- `uncertain` — you genuinely cannot tell. Use this sparingly and say what you would need.

## Also report

**Regressions.** Anything the fix broke or newly introduced: a new injection, a fatal
error, a changed function signature its callers do not match, a behaviour change users
would notice. Read `fix.diff` for this. Be specific and quote the line.

## Output

Write `VERIFY.json`:

```json
{
  "verdicts": [
    { "id": "SEC-09", "verdict": "correct|superficial|removed|uncertain", "note": "<one line, quote the code if superficial>" }
  ],
  "regressions": [
    { "file": "<path>:<line>", "severity": "critical|high|medium|low", "what": "<one line>" }
  ],
  "summary": { "correct": 0, "superficial": 0, "removed": 0, "uncertain": 0 }
}
```

Then print one line: how many claimed fixes are real, how many are superficial or
removed, and the count of regressions.

Judge the code, not the effort. A superficial fix reported as correct makes this whole
measurement worthless.
