#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-0.5.35}"
DIST="$ROOT/dist"
PACKAGE_DIR="$DIST/Zola-Caption-v$VERSION"
DMG_ROOT="$DIST/Zola-Caption-DMG-v$VERSION"
DMG_PATH="$DIST/Zola-Caption-v$VERSION.dmg"
INSTALLER_NAME="Zola Caption Installer.command"

if [[ ! -d "$PACKAGE_DIR" ]]; then
  "$ROOT/scripts/package-release.sh" "$VERSION" >/dev/null
fi

rm -rf "$DMG_ROOT" "$DMG_PATH"
mkdir -p "$DMG_ROOT/payload"
cp -R "$PACKAGE_DIR" "$DMG_ROOT/payload/"
cp "$ROOT/scripts/install-macos.sh" "$DMG_ROOT/$INSTALLER_NAME"
chmod +x "$DMG_ROOT/$INSTALLER_NAME"

if [[ -f "$ROOT/outputs/capiton-premiere-cep-plugin/assets/brand/zolalogo.png" ]]; then
  cp "$ROOT/outputs/capiton-premiere-cep-plugin/assets/brand/zolalogo.png" "$DMG_ROOT/Zola Caption Logo.png"
fi

cat > "$DMG_ROOT/README.txt" <<README
Zola Caption macOS Kurulum

1. Premiere Pro kapalı olsun.
2. "Zola Caption Installer.command" dosyasını çift tıkla.
3. Kurulum bitince Premiere Pro'yu aç.
4. Window > Extensions > Zola Caption menüsünden paneli aç.

Güncellemeler panel içindeki Ayarlar > Güncellemeyi yükle ile otomatik kurulur.
README

hdiutil create \
  -volname "Zola Caption $VERSION" \
  -srcfolder "$DMG_ROOT" \
  -ov \
  -format UDZO \
  "$DMG_PATH"

echo "$DMG_PATH"
