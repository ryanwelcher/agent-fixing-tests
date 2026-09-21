#!/usr/bin/env bash
# harness/verify-fixes.sh <run-name> [model]
# Semantic check: are the detector PASSes real fixes, or pattern-satisfying ones?
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"; require_run "$NAME"
MODEL="${2:-opus}"
RUN="$RUNS/$NAME"
[ -f "$RUN/score.json" ] || die "no score.json - run harness/score.sh first"
[ -d "$RUN/plugin-fixed" ] || die "no plugin-fixed - nothing to verify"

SANDBOX="$( mktemp -d "${TMPDIR:-/tmp}/wpem-verify-XXXXXX" )"
trap 'rm -rf "$SANDBOX"' EXIT
cp -R "$RUN/plugin-fixed" "$SANDBOX/plugin"
cp "$RUN/fix.diff" "$SANDBOX/fix.diff" 2>/dev/null || touch "$SANDBOX/fix.diff"
node "$ROOT/harness/claims.mjs" "$RUN" > "$SANDBOX/claims.json"

CLAIMS=$( node -e "console.log(JSON.parse(require('fs').readFileSync('$SANDBOX/claims.json','utf8')).length)" )
if [ "$CLAIMS" = "0" ]; then
  echo '{ "verdicts": [], "regressions": [], "summary": { "correct": 0, "superficial": 0, "removed": 0, "uncertain": 0 } }' > "$RUN/VERIFY.json"
  say "no detector passes to verify"; exit 0
fi

say "verify: $CLAIMS claimed fixes, model=$MODEL run=$NAME"
run_agent verify "$MODEL" "$ROOT/prompts/fix-judge.md" "$SANDBOX" "$RUN"

if [ -f "$SANDBOX/VERIFY.json" ]; then
  cp "$SANDBOX/VERIFY.json" "$RUN/VERIFY.json"
  node -e "
    const v=JSON.parse(require('fs').readFileSync('$RUN/VERIFY.json','utf8'));
    const s=v.summary||{};
    console.log('  correct:'+(s.correct??0)+'  superficial:'+(s.superficial??0)+'  removed:'+(s.removed??0)+'  uncertain:'+(s.uncertain??0)+'  regressions:'+(v.regressions||[]).length);
  " || true
else
  warn "verifier produced no VERIFY.json"
fi
