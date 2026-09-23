#!/usr/bin/env bash
# harness/fix.sh <run-name> [model] [--with-review] - implementer arm.
# Default is plan-only, which is how the skill ships.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"; require_run "$NAME"
MODEL="${2:-sonnet}"
RUN="$RUNS/$NAME"
WITH_REVIEW=0
for a in "$@"; do [ "$a" = "--with-review" ] && WITH_REVIEW=1; done

[ -f "$RUN/PLAN.md" ] || die "no PLAN.md in $RUN - run harness/review.sh first"

SANDBOX="$( mktemp -d "${TMPDIR:-/tmp}/wpem-fix-XXXXXX" )"
trap 'rm -rf "$SANDBOX"' EXIT
cp -R "$RUN/plugin" "$SANDBOX/plugin"
write_context "$SANDBOX"
cp "$RUN/PLAN.md" "$SANDBOX/.review-handoff/PLAN.md"
[ "$WITH_REVIEW" = "1" ] && [ -f "$RUN/REVIEW.md" ] && cp "$RUN/REVIEW.md" "$SANDBOX/.review-handoff/REVIEW.md"

PROMPT="$SANDBOX/.prompt.md"
{
  cat "$SKILL/reference/plan-contract.md"; echo
  cat "$SANDBOX/.review-handoff/context.md"; echo
  [ "$WITH_REVIEW" = "1" ] && echo "The review that produced this plan is in \`.review-handoff/REVIEW.md\`."
  echo "## The plan"; echo
  cat "$RUN/PLAN.md"
} > "$PROMPT"

say "fix: model=$MODEL run=$NAME with-review=$WITH_REVIEW"
run_agent fix "$MODEL" "$PROMPT" "$SANDBOX" "$RUN"

rm -rf "$RUN/plugin-fixed"
cp -R "$SANDBOX/plugin" "$RUN/plugin-fixed"
[ -f "$SANDBOX/.review-handoff/IMPLEMENTATION.md" ] && cp "$SANDBOX/.review-handoff/IMPLEMENTATION.md" "$RUN/IMPLEMENTATION.md"
# Generate the diff from inside the run directory so the headers carry
# relative paths. Absolute paths would put the run name - and therefore the
# arm and the implementer model - into every hunk header, which the fix
# verifier reads. The verifier is supposed to be blind to that.
( cd "$RUN" && diff -ru plugin plugin-fixed > fix.diff 2>/dev/null ) || true

echo "{ \"phase\": \"fix\", \"model\": \"$MODEL\", \"seconds\": $WALL, \"with_review\": $WITH_REVIEW }" > "$RUN/fix-meta.json"
say "wrote plugin-fixed + fix.diff in ${WALL}s"
