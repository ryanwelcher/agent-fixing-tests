#!/usr/bin/env bash
# harness/new.sh <run-name> - start a fresh run from the pristine fixture.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

NAME="${1:-}"
[ -n "$NAME" ] || die "usage: harness/new.sh <run-name>"

DEST="$RUNS/$NAME"
if [ -d "$DEST" ]; then
  read -r -p "run '$NAME' already exists. Delete and recreate? [y/N] " a
  [ "$a" = "y" ] || die "aborted"
  rm -rf "$DEST"
fi

mkdir -p "$DEST"
cp -R "$FIXTURE" "$DEST/plugin"

say "created $DEST/plugin from the fixture"
node "$ROOT/harness/check.mjs" "$DEST/plugin" --baseline
say "next: harness/review.sh $NAME <model>"
