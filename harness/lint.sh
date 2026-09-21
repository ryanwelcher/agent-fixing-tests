#!/usr/bin/env bash
# harness/lint.sh <dir> - every PHP and JS file must still parse.
source "$( dirname "${BASH_SOURCE[0]}" )/_common.sh"

DIR="${1:-}"
[ -d "$DIR" ] || die "usage: harness/lint.sh <plugin-dir>"

FAIL=0
while IFS= read -r f; do
  php -l "$f" >/dev/null 2>&1 || { printf '\033[31mPHP  %s\033[0m\n' "$f"; php -l "$f" 2>&1 | sed 's/^/     /'; FAIL=1; }
done < <( find "$DIR" -name '*.php' )

while IFS= read -r f; do
  node --check "$f" >/dev/null 2>&1 || { printf '\033[31mJS   %s\033[0m\n' "$f"; node --check "$f" 2>&1 | sed 's/^/     /'; FAIL=1; }
done < <( find "$DIR" -name '*.js' )

[ "$FAIL" = "0" ] && printf '\033[32mlint OK\033[0m - all PHP and JS files parse\n'
exit $FAIL
