#!/usr/bin/env bash
# Self-test for the review-handoff skill.
#
#   selftest.sh quick                    one cheap arm, proves the wiring (~5 min)
#   selftest.sh full                     the whole matrix (~30-60 min, several dollars)
#   selftest.sh handoff oneshot          named arms
#
#   --reviewer M --implementer M --judge M|--no-judge --tag NAME
#
# Every arm scores against ground-truth/issues.mjs and appends to results/runs.jsonl.
set -euo pipefail

HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$( cd "$HERE/../../../.." && pwd )"
H="$ROOT/harness"

say() { printf '\n\033[1m### %s\033[0m\n' "$*"; }
die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }

REVIEWER=""; IMPLEMENTER=""; JUDGE="opus"; TAG="$( date +%m%d-%H%M )"; ARMS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --reviewer) REVIEWER="$2"; shift 2 ;;
    --implementer) IMPLEMENTER="$2"; shift 2 ;;
    --judge) JUDGE="$2"; shift 2 ;;
    --no-judge) JUDGE=""; shift ;;
    --tag) TAG="$2"; shift 2 ;;
    quick) ARMS=( handoff ); REVIEWER="${REVIEWER:-haiku}"; IMPLEMENTER="${IMPLEMENTER:-haiku}"; JUDGE=""; shift ;;
    full) ARMS=( handoff handoff-review oneshot skill ); shift ;;
    handoff|handoff-review|oneshot|skill) ARMS+=( "$1" ); shift ;;
    *) die "unknown argument: $1" ;;
  esac
done

[ ${#ARMS[@]} -gt 0 ] || ARMS=( handoff )
REVIEWER="${REVIEWER:-opus}"; IMPLEMENTER="${IMPLEMENTER:-sonnet}"

command -v claude >/dev/null || die "claude CLI not found"
command -v node   >/dev/null || die "node not found"
command -v php    >/dev/null || die "php not found (needed to lint the fixture)"

say "detector baseline"
node "$H/check.mjs" "$ROOT/fixture/wp-event-manager" --baseline \
  || die "the answer key no longer matches the fixture - fix that before measuring anything"

printf '\narms:        %s\nreviewer:    %s\nimplementer: %s\njudge:       %s\ntag:         %s\n' \
  "${ARMS[*]}" "$REVIEWER" "$IMPLEMENTER" "${JUDGE:-off}" "$TAG"

for ARM in "${ARMS[@]}"; do
  RUN="${TAG}-${ARM}"
  say "arm: $ARM  ->  runs/$RUN"
  "$H/new.sh" "$RUN" --force >/dev/null

  case "$ARM" in
    handoff)
      "$H/review.sh" "$RUN" "$REVIEWER"
      "$H/fix.sh"    "$RUN" "$IMPLEMENTER"
      ;;
    handoff-review)
      "$H/review.sh" "$RUN" "$REVIEWER"
      "$H/fix.sh"    "$RUN" "$IMPLEMENTER" --with-review
      ;;
    oneshot)
      "$H/oneshot.sh" "$RUN" "$REVIEWER"
      ;;
    skill)
      "$H/skillrun.sh" "$RUN" "$REVIEWER" "$IMPLEMENTER"
      ;;
  esac

  if [ -n "$JUDGE" ] && [ -f "$ROOT/runs/$RUN/REVIEW.md" ]; then
    "$H/judge.sh" "$RUN" "$JUDGE" >/dev/null 2>&1 || printf '\033[33mwarn:\033[0m judge failed for %s\n' "$RUN" >&2
  fi

  "$H/score.sh" "$RUN" --arm "$ARM" --reviewer "$REVIEWER" --implementer "$IMPLEMENTER"
done

say "results"
node "$H/report.mjs"
printf '\n  results/report.md    tables for the write-up\n  results/results.csv  one row per run\n  results/phases.csv   token + context detail per phase\n  results/runs.jsonl   raw ledger\n\n'
sed -n '/^## Headline/,/^## Fix rate by severity/p' "$ROOT/results/report.md" | sed '$d'
