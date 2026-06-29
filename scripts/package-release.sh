#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-0.5.35}"
DIST="$ROOT/dist"
STAGE="$DIST/Zola-Caption-v$VERSION"
ZIP="$DIST/Zola-Caption-v$VERSION.zip"

rm -rf "$STAGE" "$ZIP"
mkdir -p "$STAGE"

rsync -a \
  --exclude ".DS_Store" \
  --exclude "assets/mogrts/" \
  "$ROOT/outputs/capiton-premiere-cep-plugin/" \
  "$STAGE/capiton-premiere-cep-plugin/"

# tools/ (whisper.cpp build icin cmake, sadece gelistirme makinesinde gerekli) ve
# vendor/ (kullanilmayan imageio_ffmpeg python paketi) calisma zamaninda gerekmiyor;
# pakete dahil etmek sadece boyutu sisiriyor (~300MB).
rsync -a \
  --exclude ".DS_Store" \
  --exclude ".env" \
  --exclude ".env.example.swp" \
  --exclude "work/" \
  --exclude "tools/" \
  --exclude "vendor/" \
  "$ROOT/outputs/capiton-local-engine/" \
  "$STAGE/capiton-local-engine/"

cp "$ROOT/README.md" "$STAGE/README.md"
cp "$ROOT/scripts/install-macos.sh" "$STAGE/Zola Caption Installer.command"
chmod +x "$STAGE/Zola Caption Installer.command"

(
  cd "$DIST"
    zip -qr "Zola-Caption-v$VERSION.zip" "Zola-Caption-v$VERSION"
)

echo "$ZIP"
