#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NEW_VERSION="${1:-}"

if [ -z "$NEW_VERSION" ]; then
  echo "Kullanim: ./scripts/bump-version.sh 0.5.36" >&2
  exit 1
fi

OLD_VERSION="$(grep -m1 'var CURRENT_VERSION' "$ROOT/outputs/capiton-premiere-cep-plugin/src/cep-app.js" | sed -E 's/.*"v([0-9.]+)".*/\1/')"

if [ -z "$OLD_VERSION" ]; then
  echo "Mevcut surum okunamadi (cep-app.js icindeki CURRENT_VERSION)." >&2
  exit 1
fi

if [ "$OLD_VERSION" = "$NEW_VERSION" ]; then
  echo "Yeni surum mevcut surumle ayni: $NEW_VERSION" >&2
  exit 1
fi

echo "Surum guncelleniyor: $OLD_VERSION -> $NEW_VERSION"

replace_in_file() {
  local file="$1"
  python3 - "$file" "$OLD_VERSION" "$NEW_VERSION" <<'PYEOF'
from pathlib import Path
import sys

file_path, old_version, new_version = sys.argv[1:4]
path = Path(file_path)
content = path.read_text(encoding="utf-8")
if old_version not in content:
    raise SystemExit(f"Eski surum dosyada bulunamadi: {file_path}")
path.write_text(content.replace(old_version, new_version), encoding="utf-8")
PYEOF
  echo "  guncellendi: $file"
}

replace_in_file "$ROOT/outputs/capiton-premiere-cep-plugin/CSXS/manifest.xml"
replace_in_file "$ROOT/outputs/capiton-premiere-cep-plugin/index.html"
replace_in_file "$ROOT/outputs/capiton-premiere-cep-plugin/src/cep-app.js"
replace_in_file "$ROOT/package.json"

DOWNLOAD_URL="https://github.com/galipcandmr/Zola_Caption/releases/download/v$NEW_VERSION/Zola-Caption-v$NEW_VERSION-update.zip"
UPDATE_JSON="$ROOT/outputs/capiton-premiere-cep-plugin/updates/update.json"

# minSupported kasitli olarak degistirilmiyor: hangi eski surumlerin "zorunlu guncelleme"
# sayilacagina release.sh --mandatory bayragiyla ayrica karar verilir.
python3 - "$UPDATE_JSON" "$NEW_VERSION" "$DOWNLOAD_URL" <<'PYEOF'
import json, sys

update_json_path, new_version, download_url = sys.argv[1:4]

with open(update_json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

data["latest"] = new_version
data["downloadUrl"] = download_url

with open(update_json_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

print("  guncellendi:", update_json_path)
PYEOF

echo ""
echo "Surum bump tamamlandi: v$NEW_VERSION"
echo "Not: updates/update.json icindeki 'notes' alani henuz elle/release.sh ile guncellenmedi."
