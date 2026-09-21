#!/usr/bin/env bash
# harness/review.sh <run-name> [model] - the reviewing model reads the plugin and
# writes REVIEW.md + PLAN.md. It never edits the plugin.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"; require_run "$NAME"
MODEL="${2:-opus}"
RUN="$RUNS/$NAME"

SANDBOX="$( mktemp -d "${TMPDIR:-/tmp}/wpem-review-XXXXXX" )"
trap 'rm -rf "$SANDBOX"' EXIT
cp -R "$RUN/plugin" "$SANDBOX/plugin"

say "review: model=$MODEL run=$NAME sandbox=$SANDBOX"
START=$( date +%s )

( cd "$SANDBOX" && claude -p "$( cat "$ROOT/prompts/reviewer.md" )" \
    --model "$MODEL" $( perm_flags ) --output-format text ) \
  > "$RUN/reviewer-stdout.txt" 2>"$RUN/reviewer-stderr.txt" || true

ELAPSED=$(( $( date +%s ) - START ))

for f in REVIEW.md PLAN.md; do
  if [ -f "$SANDBOX/$f" ]; then cp "$SANDBOX/$f" "$RUN/$f"; else
    printf '\033[33mwarn:\033[0m reviewer did not produce %s\n' "$f" >&2
  fi
done

# The reviewer was told not to touch the plugin. Verify that.
if ! diff -rq "$RUN/plugin" "$SANDBOX/plugin" >/dev/null 2>&1; then
  printf '\033[33mwarn:\033[0m reviewer modified the plugin - review runs should be read-only\n' >&2
  diff -rq "$RUN/plugin" "$SANDBOX/plugin" || true
fi

cat > "$RUN/review-meta.json" <<JSON
{ "phase": "review", "model": "$MODEL", "seconds": $ELAPSED, "run": "$NAME" }
JSON

say "wrote $RUN/REVIEW.md and $RUN/PLAN.md in ${ELAPSED}s"
say "next: harness/fix.sh $NAME <model>"
