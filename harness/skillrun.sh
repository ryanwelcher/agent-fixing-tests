#!/usr/bin/env bash
# harness/skillrun.sh <run-name> [reviewer] [implementer]
# End-to-end arm: installs the skill into a throwaway git repo and invokes it the
# way a user would. Tests the orchestration, not just the prompts.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"; require_run "$NAME"
REVIEWER="${2:-opus}"; IMPLEMENTER="${3:-sonnet}"
RUN="$RUNS/$NAME"

SANDBOX="$( mktemp -d "${TMPDIR:-/tmp}/wpem-skill-XXXXXX" )"
trap 'rm -rf "$SANDBOX"' EXIT
cp -R "$RUN/plugin" "$SANDBOX/plugin"
mkdir -p "$SANDBOX/.claude/skills"
cp -R "$SKILL" "$SANDBOX/.claude/skills/review-handoff"

( cd "$SANDBOX" && git init -q && git add -A \
  && git -c user.email=selftest@local -c user.name=selftest commit -qm "fixture" )

cat > "$SANDBOX/.prompt.md" <<PROMPT
Use the review-handoff skill on \`./plugin\`.

Reviewer model: $REVIEWER. Implementer model: $IMPLEMENTER.

Follow the skill exactly, including the two separate agents and the plan-only handoff.
Do not review and fix in one agent.
PROMPT

say "skill: reviewer=$REVIEWER implementer=$IMPLEMENTER run=$NAME"
run_agent skill "$REVIEWER" "$SANDBOX/.prompt.md" "$SANDBOX" "$RUN"

rm -rf "$RUN/plugin-fixed"
cp -R "$SANDBOX/plugin" "$RUN/plugin-fixed"
for f in REVIEW.md PLAN.md IMPLEMENTATION.md RESULT.md; do
  [ -f "$SANDBOX/.review-handoff/$f" ] && cp "$SANDBOX/.review-handoff/$f" "$RUN/$f"
done
# Generate the diff from inside the run directory so the headers carry
# relative paths. Absolute paths would put the run name - and therefore the
# arm and the implementer model - into every hunk header, which the fix
# verifier reads. The verifier is supposed to be blind to that.
( cd "$RUN" && diff -ru plugin plugin-fixed > fix.diff 2>/dev/null ) || true
( cd "$SANDBOX" && git log --oneline > "$RUN/skill-git-log.txt" 2>&1 ) || true

echo "{ \"phase\": \"skill\", \"model\": \"$REVIEWER\", \"seconds\": $WALL }" > "$RUN/skill-meta.json"
say "wrote plugin-fixed + fix.diff in ${WALL}s"
