#!/usr/bin/env bash
# harness/oneshot.sh <run-name> [model] - control arm: ONE agent reviews and fixes
# in a single context. The comparison that says whether the handoff earns its cost.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"; require_run "$NAME"
MODEL="${2:-opus}"
RUN="$RUNS/$NAME"

SANDBOX="$( mktemp -d "${TMPDIR:-/tmp}/wpem-oneshot-XXXXXX" )"
trap 'rm -rf "$SANDBOX"' EXIT
cp -R "$RUN/plugin" "$SANDBOX/plugin"
write_context "$SANDBOX"

PROMPT="$SANDBOX/.prompt.md"
{
  sed 's/^- \*\*Do not modify any file.\*\*.*/- You WILL fix what you find, in this same session./' \
    "$SKILL/reference/review-rubric.md" | sed '/A later agent does the work\./d'
  echo
  cat <<'EXTRA'
## Then fix everything you found

You are both the reviewer and the implementer. After writing `REVIEW.md`, apply every
fix yourself in this same session. Keep the existing code style. Do not refactor beyond
the defects. Confirm every file still parses.

Write `.review-handoff/IMPLEMENTATION.md` listing each finding as done or skipped, with
a one-line note. You do not need to write `PLAN.md`.
EXTRA
  echo
  cat "$SANDBOX/.review-handoff/context.md"
} > "$PROMPT"

say "oneshot: model=$MODEL run=$NAME"
run_agent oneshot "$MODEL" "$PROMPT" "$SANDBOX" "$RUN"

rm -rf "$RUN/plugin-fixed"
cp -R "$SANDBOX/plugin" "$RUN/plugin-fixed"
for f in REVIEW.md IMPLEMENTATION.md; do
  [ -f "$SANDBOX/.review-handoff/$f" ] && cp "$SANDBOX/.review-handoff/$f" "$RUN/$f"
done
diff -ru "$RUN/plugin" "$RUN/plugin-fixed" > "$RUN/fix.diff" 2>/dev/null || true

echo "{ \"phase\": \"oneshot\", \"model\": \"$MODEL\", \"seconds\": $WALL }" > "$RUN/oneshot-meta.json"
say "wrote plugin-fixed + fix.diff in ${WALL}s"
