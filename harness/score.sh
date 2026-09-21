#!/usr/bin/env bash
# harness/score.sh <run-name> [--arm A] [--reviewer M] [--implementer M] [--verify [model]] [--notes "..."]
# Lint, surface check, fix score, review recall, optional semantic verification,
# token summary, then append to the ledger.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"; require_run "$NAME"; shift
RUN="$RUNS/$NAME"
TARGET="$RUN/plugin-fixed"; [ -d "$TARGET" ] || TARGET="$RUN/plugin"

VERIFY_MODEL=""
ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --verify) VERIFY_MODEL="${2:-opus}"; case "$VERIFY_MODEL" in --*) VERIFY_MODEL="opus"; shift ;; *) shift 2 ;; esac ;;
    *) ARGS+=( "$1" ); shift ;;
  esac
done

say "lint"
if "$ROOT/harness/lint.sh" "$TARGET" > "$RUN/lint.txt" 2>&1; then
  echo '{ "ok": true }' > "$RUN/lint.json"; cat "$RUN/lint.txt"
else
  echo '{ "ok": false }' > "$RUN/lint.json"; warn "lint FAILED"; cat "$RUN/lint.txt"
fi

echo; say "public surface"
node "$ROOT/harness/surface.mjs" "$TARGET" --json > "$RUN/surface.json" 2>/dev/null || true
node "$ROOT/harness/surface.mjs" "$TARGET" || true

if [ -f "$RUN/REVIEW.md" ]; then
  node "$ROOT/harness/grade-review.mjs" "$RUN/REVIEW.md" --json > "$RUN/review-grade.json" 2>/dev/null || true
  echo; say "review recall (heuristic - over-counts; judge.sh is the real number)"
  node "$ROOT/harness/grade-review.mjs" "$RUN/REVIEW.md" 2>/dev/null | tail -6 || true
fi

echo; say "fix score (detectors)"
node "$ROOT/harness/check.mjs" "$TARGET" --json > "$RUN/score.json"
node "$ROOT/harness/check.mjs" "$TARGET" 2>/dev/null | tail -8 || true

if [ -n "$VERIFY_MODEL" ]; then
  echo; "$ROOT/harness/verify-fixes.sh" "$NAME" "$VERIFY_MODEL" || warn "verification failed"
fi

node "$ROOT/harness/usage.mjs" report "$RUN" || true
node "$ROOT/harness/record.mjs" "$RUN" "${ARGS[@]}"
node "$ROOT/harness/report.mjs"
