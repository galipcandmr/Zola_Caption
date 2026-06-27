#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-0.5.33}"
DIST="$ROOT/dist"
STAGE="$DIST/Capiton-v$VERSION"
ZIP="$DIST/Capiton-v$VERSION.zip"

rm -rf "$STAGE" "$ZIP"
mkdir -p "$STAGE"

rsync -a \
  --exclude ".DS_Store" \
  "$ROOT/outputs/capiton-premiere-cep-plugin/" \
  "$STAGE/capiton-premiere-cep-plugin/"

rsync -a \
  --exclude ".DS_Store" \
  --exclude ".env" \
  --exclude "work/" \
  "$ROOT/outputs/capiton-local-engine/" \
  "$STAGE/capiton-local-engine/"

cp "$ROOT/README.md" "$STAGE/README.md"

(
  cd "$DIST"
  zip -qr "Capiton-v$VERSION.zip" "Capiton-v$VERSION"
)

echo "$ZIP"
