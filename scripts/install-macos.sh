#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Zola Caption"
LABEL="com.zoladijital.capiton.engine"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

find_payload_root() {
  if [[ -d "$SCRIPT_DIR/capiton-premiere-cep-plugin" && -d "$SCRIPT_DIR/capiton-local-engine" ]]; then
    printf '%s\n' "$SCRIPT_DIR"
    return
  fi

  if [[ -d "$SCRIPT_DIR/payload" ]]; then
    local found
    found="$(find "$SCRIPT_DIR/payload" -maxdepth 2 -type d -name capiton-premiere-cep-plugin -print -quit || true)"
    if [[ -n "$found" ]]; then
      dirname "$found"
      return
    fi
  fi

  echo "Zola Caption paket klasörü bulunamadı." >&2
  exit 1
}

install_node_if_needed() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return
  fi

  local arch node_arch node_version runtime_dir archive url
  arch="$(uname -m)"
  case "$arch" in
    arm64) node_arch="arm64" ;;
    x86_64) node_arch="x64" ;;
    *) echo "Bu macOS mimarisi desteklenmiyor: $arch" >&2; exit 1 ;;
  esac

  node_version="v20.18.1"
  runtime_dir="$HOME/Library/Application Support/Zola Caption/runtime/node-$node_version-darwin-$node_arch"
  if [[ -x "$runtime_dir/bin/node" ]]; then
    printf '%s\n' "$runtime_dir/bin/node"
    return
  fi

  mkdir -p "$(dirname "$runtime_dir")"
  archive="/tmp/zola-caption-node-$node_version-$node_arch.tar.gz"
  url="https://nodejs.org/dist/$node_version/node-$node_version-darwin-$node_arch.tar.gz"
  echo "Node runtime indiriliyor..." >&2
  curl -L --fail "$url" -o "$archive"
  tar -xzf "$archive" -C "$(dirname "$runtime_dir")"
  printf '%s\n' "$runtime_dir/bin/node"
}

write_launch_agent() {
  local node_path="$1"
  local engine_dir="$2"
  local launch_agents="$HOME/Library/LaunchAgents"
  local plist="$launch_agents/$LABEL.plist"

  mkdir -p "$launch_agents"
  cat > "$plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$node_path</string>
    <string>$engine_dir/server.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$engine_dir</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/zola-caption-engine.out.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/zola-caption-engine.err.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>CAPITON_ENGINE_PORT</key>
    <string>17771</string>
  </dict>
</dict>
</plist>
PLIST

  launchctl bootout "gui/$(id -u)" "$plist" >/dev/null 2>&1 || true
  launchctl bootstrap "gui/$(id -u)" "$plist" >/dev/null 2>&1 || true
}

payload_root="$(find_payload_root)"
cep_source="$payload_root/capiton-premiere-cep-plugin"
engine_source="$payload_root/capiton-local-engine"
cep_target="$HOME/Library/Application Support/Adobe/CEP/extensions/com.zoladijital.capiton.panel"
engine_target="$HOME/Library/Application Support/Zola Caption/engine"

echo "$APP_NAME kuruluyor..."
mkdir -p "$(dirname "$cep_target")" "$engine_target"
rm -rf "$cep_target"
/usr/bin/rsync -a --delete --exclude ".DS_Store" "$cep_source/" "$cep_target/"
/usr/bin/rsync -a --exclude ".DS_Store" --exclude ".env" --exclude "work/" "$engine_source/" "$engine_target/"

# Indirilen DMG/zip Gatekeeper tarafindan quarantine ile isaretlenmis olabilir;
# bu bayrak kopyalanan dosyalara da gecerse whisper-cli/ffmpeg/dylib'ler
# "tanimlanamayan gelistirici" diye calismayi reddedebilir. Quarantine'i temizle
# ve adhoc imzayi tazele.
/usr/bin/xattr -dr com.apple.quarantine "$engine_target" >/dev/null 2>&1 || true
if [ -d "$engine_target/bin" ]; then
  for bin_file in "$engine_target/bin"/*.dylib "$engine_target/bin/whisper-cli" "$engine_target/bin/ffmpeg"; do
    [ -f "$bin_file" ] || continue
    /usr/bin/codesign --force --sign - "$bin_file" >/dev/null 2>&1 || true
  done
fi

for version in 11 12 13 14 15; do
  defaults write "com.adobe.CSXS.$version" PlayerDebugMode 1 >/dev/null 2>&1 || true
done

node_path="$(install_node_if_needed)"
write_launch_agent "$node_path" "$engine_target"

echo
echo "$APP_NAME kuruldu."
echo "Premiere Pro açıksa kapatıp tekrar aç."
echo "Panel: Window > Extensions > Zola Caption"
