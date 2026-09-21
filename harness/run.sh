#!/usr/bin/env bash
# harness/run.sh <run-name> <reviewer-model> <implementer-model> [--plan-only]
# Full pipeline: fresh copy -> review -> fix -> score.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"; REVIEWER="${2:-opus}"; IMPLEMENTER="${3:-sonnet}"
[ -n "$NAME" ] || die "usage: harness/run.sh <run-name> <reviewer-model> <implementer-model> [--plan-only]"
shift 3 || true

"$ROOT/harness/new.sh" "$NAME" --force >/dev/null
say "run '$NAME': reviewer=$REVIEWER implementer=$IMPLEMENTER"
"$ROOT/harness/review.sh" "$NAME" "$REVIEWER"
"$ROOT/harness/fix.sh" "$NAME" "$IMPLEMENTER" "$@"
"$ROOT/harness/score.sh" "$NAME"
