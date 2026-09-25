#!/usr/bin/env bash
# Build the launcher and push dist/ to the device over adb.
# Usage: scripts/deploy.sh [remote_dir]   (default: /sdcard/projects/gingerbread-launcher)
set -euo pipefail

cd "$(dirname "$0")/.."

REMOTE_DIR="${1:-/sdcard/projects/gingerbread-launcher}"

command -v adb >/dev/null || { echo "adb not found in PATH" >&2; exit 1; }
adb get-state >/dev/null 2>&1 || { echo "No adb device connected" >&2; exit 1; }

npm run build

adb shell rm -rf "$REMOTE_DIR"
adb shell mkdir -p "$REMOTE_DIR"
adb push dist/. "$REMOTE_DIR/"

echo "Deployed dist/ -> $REMOTE_DIR"
