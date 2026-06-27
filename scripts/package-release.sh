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
  "$ROOT/outputs/capiton-premiere-cep-plugin/" \
  "$STAGE/capiton-premiere-cep-plugin/"

rsync -a \
  --exclude ".DS_Store" \
  --exclude ".env" \
  --exclude ".env.example.swp" \
  --exclude "work/" \
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
