#!/usr/bin/env bash
set -euo pipefail

# Kullanim:
#   ./scripts/release.sh 0.5.36 "Not 1" "Not 2" ...
#
# Adimlar:
#   1. scripts/bump-version.sh ile surum numarasini her yerde guncelle
#   2. git commit (henuz push YOK)
#   3. package-release.sh ile zip uret
#   4. build-macos-dmg.sh ile dmg uret
#
# Bu script BURADA DURUR ve push/release adimlarini ELLE onaylamani bekler.
# git push ve gh release create komutlari ekrana yazdirilir ama calistirilmaz.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-}"
shift || true
NOTES=("$@")

if [ -z "$VERSION" ]; then
  echo "Kullanim: ./scripts/release.sh 0.5.36 \"Not 1\" \"Not 2\"" >&2
  exit 1
fi

cd "$ROOT"

if [ -n "$(git status --porcelain)" ]; then
  echo "Calisma agacinda commit edilmemis degisiklikler var. Once bunlari ele al." >&2
  git status --short
  exit 1
fi

echo "== 1/4: Surum bump ediliyor =="
"$ROOT/scripts/bump-version.sh" "$VERSION"

if [ ${#NOTES[@]} -gt 0 ]; then
  UPDATE_JSON="$ROOT/outputs/capiton-premiere-cep-plugin/updates/update.json"
  python3 - "$UPDATE_JSON" "${NOTES[@]}" <<'PYEOF'
import json, sys

update_json_path = sys.argv[1]
notes = sys.argv[2:]

with open(update_json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

data["notes"] = notes

with open(update_json_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

print("  notes guncellendi:", update_json_path)
PYEOF
fi

echo ""
echo "== 2/4: Commit olusturuluyor =="
git add -A
git commit -m "Release v$VERSION" >/dev/null
echo "  commit olustu: $(git log -1 --oneline)"

echo ""
echo "== 3/4: Zip paketi uretiliyor =="
ZIP_PATH="$("$ROOT/scripts/package-release.sh" "$VERSION")"
echo "  zip: $ZIP_PATH"

echo ""
echo "== 4/4: DMG paketi uretiliyor =="
DMG_PATH="$("$ROOT/scripts/build-macos-dmg.sh" "$VERSION" | tail -1)"
echo "  dmg: $DMG_PATH"

GH_BIN="$HOME/.local/bin/gh"
if command -v gh >/dev/null 2>&1; then
  GH_CMD="gh"
elif [ -x "$GH_BIN" ]; then
  GH_CMD="$GH_BIN"
else
  GH_CMD="gh"
fi

RELEASE_NOTES=""
for note in "${NOTES[@]:-}"; do
  if [ -n "$note" ]; then
    RELEASE_NOTES="$RELEASE_NOTES- $note"$'\n'
  fi
done
if [ -z "$RELEASE_NOTES" ]; then
  RELEASE_NOTES="v$VERSION"
fi

echo ""
echo "================================================================"
echo "Paketler hazir. Su an HICBIR SEY GitHub'a push/yayinlanmadi."
echo "Devam etmek icin (kontrol edip) su komutlari SIRAYLA calistir:"
echo ""
echo "  git tag v$VERSION"
echo "  git push origin main --tags"
printf '  %s release create v%s "%s" "%s" --title "v%s" --notes "%s"\n' \
  "$GH_CMD" "$VERSION" "$ZIP_PATH" "$DMG_PATH" "$VERSION" "$RELEASE_NOTES"
echo "================================================================"
