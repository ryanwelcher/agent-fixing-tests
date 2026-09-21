#!/usr/bin/env bash
# harness/new.sh <run-name> [--force] - start a fresh run from the pristine fixture.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"
[ -n "$NAME" ] || die "usage: harness/new.sh <run-name> [--force]"

FORCE=0
for a in "$@"; do [ "$a" = "--force" ] && FORCE=1; done

DEST="$RUNS/$NAME"
if [ -d "$DEST" ]; then
  if [ "$FORCE" = "0" ]; then
    read -r -p "run '$NAME' already exists. Delete and recreate? [y/N] " a
    [ "$a" = "y" ] || die "aborted"
  fi
  rm -rf "$DEST"
fi

[ -d "$FIXTURE" ] || die "no such fixture: $FIXTURE_NAME"

mkdir -p "$DEST"
cp -R "$FIXTURE" "$DEST/plugin"
printf '%s\n' "$FIXTURE_NAME" > "$DEST/fixture.txt"

say "created $DEST/plugin from fixture '$FIXTURE_NAME'"
node "$ROOT/harness/check.mjs" "$DEST/plugin" --key="$( fixture_key )" --baseline
say "next: harness/review.sh $NAME <model>"
