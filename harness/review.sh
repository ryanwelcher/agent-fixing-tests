#!/usr/bin/env bash
# harness/review.sh <run-name> [model] - reviewer arm. Reads the plugin, writes
# REVIEW.md + PLAN.md. Must not edit the code.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"; require_run "$NAME"
MODEL="${2:-opus}"
RUN="$RUNS/$NAME"

SANDBOX="$( mktemp -d "${TMPDIR:-/tmp}/wpem-review-XXXXXX" )"
trap 'rm -rf "$SANDBOX"' EXIT
cp -R "$RUN/plugin" "$SANDBOX/plugin"
write_context "$SANDBOX"

PROMPT="$SANDBOX/.prompt.md"
{ cat "$SKILL/reference/review-rubric.md"; echo; cat "$SANDBOX/.review-handoff/context.md"; } > "$PROMPT"

say "review: model=$MODEL run=$NAME"
run_agent review "$MODEL" "$PROMPT" "$SANDBOX" "$RUN"

for f in REVIEW.md PLAN.md; do
  if [ -f "$SANDBOX/.review-handoff/$f" ]; then cp "$SANDBOX/.review-handoff/$f" "$RUN/$f"
  else warn "reviewer did not produce $f"; fi
done

if ! diff -rq "$RUN/plugin" "$SANDBOX/plugin" >/dev/null 2>&1; then
  warn "reviewer MODIFIED the plugin - review runs must be read-only"
  diff -rq "$RUN/plugin" "$SANDBOX/plugin" > "$RUN/review-violation.txt" 2>&1 || true
fi

echo "{ \"phase\": \"review\", \"model\": \"$MODEL\", \"seconds\": $WALL }" > "$RUN/review-meta.json"
say "wrote REVIEW.md + PLAN.md in ${WALL}s"
