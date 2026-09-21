#!/usr/bin/env bash
# harness/judge.sh <run-name> [model] - LLM-graded review recall against the key.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"; require_run "$NAME"
MODEL="${2:-opus}"
RUN="$RUNS/$NAME"
[ -f "$RUN/REVIEW.md" ] || die "no REVIEW.md in $RUN"

SANDBOX="$( mktemp -d "${TMPDIR:-/tmp}/wpem-judge-XXXXXX" )"
trap 'rm -rf "$SANDBOX"' EXIT
cp "$RUN/REVIEW.md" "$SANDBOX/REVIEW.md"
node "$ROOT/harness/export-key.mjs" > "$SANDBOX/key.json"

say "judge: model=$MODEL run=$NAME"
( cd "$SANDBOX" && claude -p "$( cat "$ROOT/prompts/judge.md" )" \
    --model "$MODEL" $( perm_flags ) --output-format text ) \
  > "$RUN/judge-stdout.txt" 2>&1 || true

[ -f "$SANDBOX/GRADE.json" ] && cp "$SANDBOX/GRADE.json" "$RUN/GRADE.json"
say "wrote $RUN/GRADE.json"
tail -20 "$RUN/judge-stdout.txt"
