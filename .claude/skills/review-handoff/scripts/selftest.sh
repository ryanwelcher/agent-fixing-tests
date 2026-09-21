#!/usr/bin/env bash
# Self-test for the review-handoff skill.
#
#   selftest.sh quick                     one cheap arm, proves the wiring (~5 min)
#   selftest.sh full                      the whole matrix (~45-90 min, tens of dollars)
#   selftest.sh handoff oneshot           named arms
#
#   --reviewer M              reviewer model (default opus)
#   --implementers "M1 M2"    run the handoff arm once per implementer (default "sonnet haiku")
#   --judge M | --no-judge    LLM review-recall grading (default opus)
#   --verify M | --no-verify  semantic fix verification (default opus; off in quick)
#   --tag NAME                run-name prefix
#
# Every arm scores against ground-truth/issues.mjs and appends to results/runs.jsonl.
set -euo pipefail

HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$( cd "$HERE/../../../.." && pwd )"
H="$ROOT/harness"

say() { printf '\n\033[1m### %s\033[0m\n' "$*"; }
die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }

REVIEWER=""; IMPLEMENTERS=""; JUDGE="opus"; VERIFY="opus"; TAG="$( date +%m%d-%H%M )"; ARMS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --reviewer) REVIEWER="$2"; shift 2 ;;
    --implementers) IMPLEMENTERS="$2"; shift 2 ;;
    --implementer) IMPLEMENTERS="$2"; shift 2 ;;
    --judge) JUDGE="$2"; shift 2 ;;
    --no-judge) JUDGE=""; shift ;;
    --verify) VERIFY="$2"; shift 2 ;;
    --no-verify) VERIFY=""; shift ;;
    --tag) TAG="$2"; shift 2 ;;
    quick)
      ARMS=( handoff ); REVIEWER="${REVIEWER:-haiku}"; IMPLEMENTERS="${IMPLEMENTERS:-haiku}"
      JUDGE=""; VERIFY=""; shift ;;
    full)
      ARMS=( handoff handoff-review oneshot skill )
      IMPLEMENTERS="${IMPLEMENTERS:-sonnet haiku}"; shift ;;
    handoff|handoff-review|oneshot|skill) ARMS+=( "$1" ); shift ;;
    *) die "unknown argument: $1" ;;
  esac
done

[ ${#ARMS[@]} -gt 0 ] || ARMS=( handoff )
REVIEWER="${REVIEWER:-opus}"
IMPLEMENTERS="${IMPLEMENTERS:-sonnet}"
read -r -a IMPL_LIST <<< "$IMPLEMENTERS"
PRIMARY="${IMPL_LIST[0]}"

command -v claude >/dev/null || die "claude CLI not found"
command -v node   >/dev/null || die "node not found"
command -v php    >/dev/null || die "php not found (needed to lint the fixture)"

say "detector baseline"
node "$H/check.mjs" "$ROOT/fixture/wp-event-manager" --baseline \
  || die "the answer key no longer matches the fixture - fix that before measuring anything"

printf '\narms:         %s\nreviewer:     %s\nimplementers: %s\njudge:        %s\nverify:       %s\ntag:          %s\n' \
  "${ARMS[*]}" "$REVIEWER" "${IMPL_LIST[*]}" "${JUDGE:-off}" "${VERIFY:-off}" "$TAG"

# score <run> <arm> <implementer>
score_run() {
  local run="$1" arm="$2" impl="$3"
  local extra=()
  [ -n "$VERIFY" ] && extra+=( --verify "$VERIFY" )
  "$H/score.sh" "$run" "${extra[@]}" --arm "$arm" --reviewer "$REVIEWER" --implementer "$impl"
}

maybe_judge() {
  local run="$1"
  if [ -n "$JUDGE" ] && [ -f "$ROOT/runs/$run/REVIEW.md" ]; then
    "$H/judge.sh" "$run" "$JUDGE" >/dev/null 2>&1 || printf '\033[33mwarn:\033[0m judge failed for %s\n' "$run" >&2
  fi
}

for ARM in "${ARMS[@]}"; do
  case "$ARM" in
    handoff|handoff-review)
      # One run per implementer: same review, different model applying it.
      for IMPL in "${IMPL_LIST[@]}"; do
        RUN="${TAG}-${ARM}-${IMPL}"
        say "arm: $ARM  implementer: $IMPL  ->  runs/$RUN"
        "$H/new.sh" "$RUN" --force >/dev/null
        "$H/review.sh" "$RUN" "$REVIEWER"
        if [ "$ARM" = "handoff-review" ]; then
          "$H/fix.sh" "$RUN" "$IMPL" --with-review
        else
          "$H/fix.sh" "$RUN" "$IMPL"
        fi
        maybe_judge "$RUN"
        score_run "$RUN" "$ARM" "$IMPL"
      done
      ;;
    oneshot)
      RUN="${TAG}-oneshot-${REVIEWER}"
      say "arm: oneshot  model: $REVIEWER  ->  runs/$RUN"
      "$H/new.sh" "$RUN" --force >/dev/null
      "$H/oneshot.sh" "$RUN" "$REVIEWER"
      maybe_judge "$RUN"
      score_run "$RUN" oneshot "$REVIEWER"
      ;;
    skill)
      RUN="${TAG}-skill"
      say "arm: skill  ->  runs/$RUN"
      "$H/new.sh" "$RUN" --force >/dev/null
      "$H/skillrun.sh" "$RUN" "$REVIEWER" "$PRIMARY"
      maybe_judge "$RUN"
      score_run "$RUN" skill "$PRIMARY"
      ;;
  esac
done

say "results"
node "$H/report.mjs"
printf '\n  results/report.md    tables for the write-up\n  results/results.csv  one row per run\n  results/phases.csv   token + context detail per phase\n  results/runs.jsonl   raw ledger\n\n'
sed -n '/^## Headline/,/^## Fix quality/p' "$ROOT/results/report.md" | sed '$d'
