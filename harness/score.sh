#!/usr/bin/env bash
# harness/score.sh <run-name> [--arm A] [--reviewer M] [--implementer M] [--notes "..."]
# Lint, score the fix, grade the review, summarise tokens, append to the ledger.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"; require_run "$NAME"; shift
RUN="$RUNS/$NAME"
TARGET="$RUN/plugin-fixed"; [ -d "$TARGET" ] || TARGET="$RUN/plugin"

say "lint: $( basename "$TARGET" )"
if "$ROOT/harness/lint.sh" "$TARGET" > "$RUN/lint.txt" 2>&1; then
  echo '{ "ok": true }' > "$RUN/lint.json"; cat "$RUN/lint.txt"
else
  echo '{ "ok": false }' > "$RUN/lint.json"; warn "lint FAILED"; cat "$RUN/lint.txt"
fi

if [ -f "$RUN/REVIEW.md" ]; then
  node "$ROOT/harness/grade-review.mjs" "$RUN/REVIEW.md" --json > "$RUN/review-grade.json" 2>/dev/null || true
  echo; say "review recall (heuristic - over-counts; judge.sh is the real number)"
  node "$ROOT/harness/grade-review.mjs" "$RUN/REVIEW.md" 2>/dev/null | tail -6 || true
fi

echo; say "fix score"
node "$ROOT/harness/check.mjs" "$TARGET" --json > "$RUN/score.json"
node "$ROOT/harness/check.mjs" "$TARGET" 2>/dev/null | tail -8 || true

node "$ROOT/harness/usage.mjs" report "$RUN" || true
node "$ROOT/harness/record.mjs" "$RUN" "$@"
node "$ROOT/harness/report.mjs"
