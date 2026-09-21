#!/usr/bin/env bash
# harness/score.sh <run-name> - lint, score the fix, grade the review.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"; require_run "$NAME"
RUN="$RUNS/$NAME"
TARGET="$RUN/plugin-fixed"
[ -d "$TARGET" ] || TARGET="$RUN/plugin"

say "lint: $TARGET"
"$ROOT/harness/lint.sh" "$TARGET" || true

if [ -f "$RUN/REVIEW.md" ]; then
  echo
  say "review recall (keyword heuristic - use harness/judge.sh for a real grade)"
  node "$ROOT/harness/grade-review.mjs" "$RUN/REVIEW.md"
fi

echo
say "fix score: $TARGET"
node "$ROOT/harness/check.mjs" "$TARGET" || true

node "$ROOT/harness/check.mjs" "$TARGET" --json > "$RUN/score.json"
say "machine-readable results in $RUN/score.json"
