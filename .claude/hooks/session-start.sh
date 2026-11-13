#!/bin/bash
# Installs dependencies when Claude Code runs this repo in a cloud session (claude.ai/code).
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"
[ -d node_modules ] || npm ci
