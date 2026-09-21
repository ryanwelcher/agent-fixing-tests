You are grading a code review against a known answer key.

- `key.json` lists the defects that were deliberately seeded into the plugin.
- `REVIEW.md` is the review under test.

For every entry in `key.json`, decide whether `REVIEW.md` reports that defect. A finding
counts as a match when it points at the same file and describes the same underlying
problem, even if the wording, title or severity differ. It does not count when it only
mentions the file, or names a different problem in the same file.

Also list findings in `REVIEW.md` that are not in the key, and mark each as:

- `valid` — a genuine defect the key missed,
- `noise` — true but trivial or stylistic,
- `false-positive` — not actually a defect.

Write `GRADE.json`:

```json
{
  "matched": [ { "id": "SEC-01", "review_section": "<title>", "severity_in_review": "high" } ],
  "missed":  [ { "id": "SEC-02", "why_it_matters": "<one line>" } ],
  "extra":   [ { "title": "<title>", "verdict": "valid|noise|false-positive", "note": "<one line>" } ],
  "recall_by_severity": { "critical": "9/12", "high": "...", "medium": "...", "low": "..." },
  "notes": "<two or three sentences on the quality of the review as a whole>"
}
```

Then print a short human-readable summary: overall recall, recall on critical and high,
the count of false positives, and the single most important missed defect.
