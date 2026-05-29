#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PLIST_NAME="com.octopusgarage.telegram-bridge.plist"
TARGET="$HOME/Library/LaunchAgents/$PLIST_NAME"

mkdir -p "$HOME/Library/LaunchAgents"

sed "s|__PROJECT_DIR__|$PROJECT_DIR|g" "$SCRIPT_DIR/telegram-bridge.plist" > "$TARGET"

echo "[install-launchd] Installed to $TARGET"

if launchctl list "com.octopusgarage.telegram-bridge" >/dev/null 2>&1; then
  echo "[install-launchd] Unloading old service..."
  launchctl unload "$TARGET" 2>/dev/null || true
fi

echo "[install-launchd] Loading service..."
launchctl load "$TARGET"

echo "[install-launchd] Starting service..."
launchctl start "com.octopusgarage.telegram-bridge"

echo "[install-launchd] Done. Check status with:"
echo "  launchctl list com.octopusgarage.telegram-bridge"
echo "  tail -f $PROJECT_DIR/logs/launchd.err.log"
