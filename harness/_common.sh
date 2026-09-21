#!/usr/bin/env bash
# Shared setup for the harness scripts.
set -euo pipefail

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
FIXTURE="$ROOT/fixture/wp-event-manager"
RUNS="$ROOT/runs"
SKILL="$ROOT/.claude/skills/review-handoff"
RESULTS="$ROOT/results"

die() { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }
say() { printf '\033[1m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[33mwarn:\033[0m %s\n' "$*" >&2; }

# Agents run on a throwaway copy in a temp dir, so full autonomy is the default.
# SAFE=1 falls back to acceptEdits, which blocks their Bash calls (no self-lint).
perm_flags() {
  if [ "${SAFE:-0}" = "1" ]; then echo "--permission-mode acceptEdits"
  else echo "--dangerously-skip-permissions"; fi
}

require_run() {
  [ -n "${1:-}" ] || die "usage: $(basename "$0") <run-name> [model]"
  [ -d "$RUNS/$1" ] || die "no such run: $1 (create it with harness/new.sh $1)"
}

# Writes the context file both agents read, into the sandbox.
write_context() {
  local sandbox="$1"
  mkdir -p "$sandbox/.review-handoff"
  cat > "$sandbox/.review-handoff/context.md" <<CTX
# Context

- **Target:** \`./plugin\` - a WordPress plugin.
- **Scope:** every file under \`./plugin\` ($( find "$sandbox/plugin" -type f | wc -l | tr -d ' ' ) files).
- **Verify command:** \`php -l\` on every \`.php\` file and \`node --check\` on every \`.js\` file.
  There is no test suite.
- **Artifacts go in:** \`.review-handoff/\`
CTX
}

# run_agent <phase> <model> <prompt-file> <sandbox> <run-dir>
# Captures the full stream-json transcript for token/cost/context telemetry.
# Sets WALL to the elapsed seconds.
run_agent() {
  local phase="$1" model="$2" prompt_file="$3" sandbox="$4" run_dir="$5"
  local start; start=$( date +%s )

  ( cd "$sandbox" && claude -p "$( cat "$prompt_file" )" \
      --model "$model" $( perm_flags ) \
      --output-format stream-json --verbose ) \
    > "$run_dir/$phase.jsonl" 2> "$run_dir/$phase-stderr.txt" || true

  WALL=$(( $( date +%s ) - start ))

  node "$ROOT/harness/usage.mjs" text "$run_dir/$phase.jsonl" > "$run_dir/$phase-stdout.txt" 2>/dev/null || true
  node "$ROOT/harness/usage.mjs" phase "$run_dir/$phase.jsonl" \
    --label "$phase" --model "$model" --wall "$WALL" > "$run_dir/$phase-usage.json" 2>/dev/null || true

  if ! grep -q '"type":"result"' "$run_dir/$phase.jsonl" 2>/dev/null; then
    warn "$phase produced no result envelope - check $run_dir/$phase-stderr.txt"
  fi
}
