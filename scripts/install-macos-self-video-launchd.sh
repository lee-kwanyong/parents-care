#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$HOME/parents-care}"
PLIST="$HOME/Library/LaunchAgents/com.parentscare.selfvideo.autoloop.plist"
NODE_PATH="$(command -v node)"

mkdir -p "$HOME/Library/LaunchAgents" "$PROJECT_DIR/logs"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.parentscare.selfvideo.autoloop</string>

    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>

    <key>ProgramArguments</key>
    <array>
      <string>$NODE_PATH</string>
      <string>$PROJECT_DIR/scripts/self-video-worker-loop.mjs</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>$PROJECT_DIR/logs/self-video-autoloop.out.log</string>

    <key>StandardErrorPath</key>
    <string>$PROJECT_DIR/logs/self-video-autoloop.err.log</string>
  </dict>
</plist>
EOF

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo "설치 완료: $PLIST"
echo "로그 확인:"
echo "tail -f $PROJECT_DIR/logs/self-video-autoloop.out.log"
