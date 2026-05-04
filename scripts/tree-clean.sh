#!/usr/bin/env bash
set -euo pipefail

tree -a \
  -I 'node_modules|.git|.expo|.idea|.vscode|assets|starter-backup|package-lock.json'
