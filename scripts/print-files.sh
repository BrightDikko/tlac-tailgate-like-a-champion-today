#!/usr/bin/env bash
set -euo pipefail

find . \
  \( -path './node_modules' \
  -o -path './.git' \
  -o -path './.expo' \
  -o -path './.idea' \
  -o -path './.vscode' \
  -o -path './assets' \
  -o -path './starter-backup' \
  -o -path './dist' \
  -o -path './.web-preview' \
  \) -prune \
  -o \( \
    -name '*.tsx' \
    -o -name '*.ts' \
    -o -name '*.js' \
    -o -name '*.json' \
    -o -name '*.md' \
    -o -name '*.config.js' \
  \) \
  ! -name 'package-lock.json' \
  -print \
  -exec sh -c '
    echo ""
    echo ""
    echo "===== FILE: $1 ====="
    sed -n "1,260p" "$1"
  ' sh {} \;
