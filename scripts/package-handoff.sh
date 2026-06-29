#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M)"
DIST="$ROOT/dist"
STAGE="$DIST/Zola-Caption-Handoff-$STAMP"
ZIP="$DIST/Zola-Caption-Handoff-$STAMP.zip"

rm -rf "$STAGE" "$ZIP"
mkdir -p "$STAGE/source" "$STAGE/release-artifacts"

rsync -a "$ROOT/" "$STAGE/source/" \
  --exclude ".git/" \
  --exclude ".DS_Store" \
  --exclude "Support/" \
  --exclude "dist/" \
  --exclude "outputs/capiton-local-engine/.env" \
  --exclude "outputs/capiton-local-engine/.env.example.swp" \
  --exclude "outputs/capiton-local-engine/work/" \
  --exclude "outputs/capiton-local-engine/tools/" \
  --exclude "outputs/capiton-premiere-plugin/" \
  --exclude "*.log"

if compgen -G "$DIST/Zola-Caption-v*.zip" >/dev/null; then
  cp "$DIST"/Zola-Caption-v*.zip "$STAGE/release-artifacts/"
fi

if compgen -G "$DIST/Zola-Caption-v*.dmg" >/dev/null; then
  cp "$DIST"/Zola-Caption-v*.dmg "$STAGE/release-artifacts/"
fi

cat > "$STAGE/READ_ME_FIRST.txt" <<README
Zola Caption devir paketi

Ilk okunacak dosya:
source/CLAUDE.md

Sonra:
source/docs/HANDOFF.md
source/docs/ARCHITECTURE.md
source/docs/DEVELOPMENT_GUIDE.md
source/docs/RELEASE_AND_UPDATE.md
source/docs/TROUBLESHOOTING.md

Release artifactleri:
release-artifacts/

Bu pakete .env, git history, runtime work dosyalari ve gecici dosyalar dahil edilmedi.
README

(
  cd "$DIST"
  zip -qr "$(basename "$ZIP")" "$(basename "$STAGE")"
)

echo "$ZIP"
