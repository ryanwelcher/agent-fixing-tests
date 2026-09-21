#!/usr/bin/env bash
# Shared setup for the harness scripts.
set -euo pipefail

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
FIXTURE="$ROOT/fixture/wp-event-manager"
RUNS="$ROOT/runs"

die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }
say() { printf '\033[1m==>\033[0m %s\n' "$*"; }

# Permission posture for the headless agents. They run on a throwaway copy in a
# temp dir, so full autonomy is the default. SAFE=1 falls back to acceptEdits,
# which will block the agents' Bash calls (they cannot self-lint).
perm_flags() {
  if [ "${SAFE:-0}" = "1" ]; then
    echo "--permission-mode acceptEdits"
  else
    echo "--dangerously-skip-permissions"
  fi
}

require_run() {
  [ -n "${1:-}" ] || die "usage: $(basename "$0") <run-name> [model]"
  [ -d "$RUNS/$1" ] || die "no such run: $1 (create it with harness/new.sh $1)"
}
