#!/usr/bin/env bash
# harness/fix.sh <run-name> [model] - the implementing model applies PLAN.md.
# Pass --plan-only to hand over PLAN.md without REVIEW.md (the interesting test:
# is the plan self-sufficient?).
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"; require_run "$NAME"
MODEL="${2:-sonnet}"
RUN="$RUNS/$NAME"
WITH_REVIEW=1
for a in "$@"; do [ "$a" = "--plan-only" ] && WITH_REVIEW=0; done

[ -f "$RUN/PLAN.md" ] || die "no PLAN.md in $RUN - run harness/review.sh first"

SANDBOX="$( mktemp -d "${TMPDIR:-/tmp}/wpem-fix-XXXXXX" )"
trap 'rm -rf "$SANDBOX"' EXIT
cp -R "$RUN/plugin" "$SANDBOX/plugin"
cp "$RUN/PLAN.md" "$SANDBOX/PLAN.md"
[ "$WITH_REVIEW" = "1" ] && [ -f "$RUN/REVIEW.md" ] && cp "$RUN/REVIEW.md" "$SANDBOX/REVIEW.md"

say "fix: model=$MODEL run=$NAME plan-only=$(( 1 - WITH_REVIEW )) sandbox=$SANDBOX"
START=$( date +%s )

( cd "$SANDBOX" && claude -p "$( cat "$ROOT/prompts/implementer.md" )" \
    --model "$MODEL" $( perm_flags ) --output-format text ) \
  > "$RUN/implementer-stdout.txt" 2>"$RUN/implementer-stderr.txt" || true

ELAPSED=$(( $( date +%s ) - START ))

rm -rf "$RUN/plugin-fixed"
cp -R "$SANDBOX/plugin" "$RUN/plugin-fixed"
diff -ru "$RUN/plugin" "$RUN/plugin-fixed" > "$RUN/fix.diff" || true

cat > "$RUN/fix-meta.json" <<JSON
{ "phase": "fix", "model": "$MODEL", "seconds": $ELAPSED, "with_review": $WITH_REVIEW, "run": "$NAME" }
JSON

say "wrote $RUN/plugin-fixed and $RUN/fix.diff in ${ELAPSED}s"
say "next: harness/score.sh $NAME"
