You are grading a code review against a known answer key.

- `key.json` has two parts:
  - `issues` — defects deliberately seeded into the plugin. The review should find these.
  - `decoys` — code that deliberately **looks** like a defect but is correct, with the
    reason it is fine. Flagging one of these as a defect is a false positive.
- `REVIEW.md` is the review under test.

## Recall

For every entry in `issues`, decide whether `REVIEW.md` reports it. It counts as a match
when the review points at the same file and describes the same underlying problem, even
if the wording, title or severity differ. It does not count when the review only mentions
the file, or names a different problem in the same file.

Some issues carry `also_involves`, naming a second file the defect spans. A review that
describes only one half — the escaping without the decode, the capability check without
the grant — is a **partial** match. Record it as `partial`, not `matched`. Getting only
half of a cross-file defect produces a plan that cannot fix it.

## Precision

For every entry in `decoys`, decide whether the review flagged it **as a defect**.

- Calling it a vulnerability or a bug → `false_positive`.
- Suggesting the code be hardened as hygiene, while saying it is not currently
  exploitable → `acceptable`. That is a reviewer reading carefully, not a mistake.
- Not mentioning it → `clean`.

Then list findings in `REVIEW.md` that are in neither list, and mark each `valid`
(a genuine defect the key missed), `noise` (true but trivial or stylistic) or
`false-positive`.

## Output

Write `GRADE.json`:

```json
{
  "matched":  [ { "id": "H-01", "review_section": "<title>", "severity_in_review": "high" } ],
  "partial":  [ { "id": "H-02", "what_was_missed": "<the half the review did not connect>" } ],
  "missed":   [ { "id": "H-05", "why_it_matters": "<one line>" } ],
  "decoys":   [ { "id": "D-01", "verdict": "clean|acceptable|false_positive", "note": "<one line>" } ],
  "extra":    [ { "title": "<title>", "verdict": "valid|noise|false-positive", "note": "<one line>" } ],
  "recall_by_severity": { "critical": "3/3", "high": "4/6", "medium": "0/1", "low": "-" },
  "notes": "<two or three sentences on the review as a whole>"
}
```

Then print a short summary: recall overall and on critical/high, how many cross-file
defects were only half found, the false-positive count including decoys, and the single
most important missed defect.

Judge what the review actually says. Do not give credit for a finding the reviewer would
have made if it had looked harder.
