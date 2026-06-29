#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-0.5.35}"
# --slim ayrica bin/ (whisper-cli, ffmpeg) ve models/ (ggml-small.bin) haric
# tutar: bu binary'ler surumler arasi neredeyse hic degismiyor, her seferinde
# ~450MB'lik bu dosyalari yeniden paketlemek otomatik guncellemeleri
# gereksiz yere buyuk ve yavas yapiyordu. --slim ciktisini panel ici otomatik
# guncelleyicinin indirdigi release asset'i olarak kullan; DMG/ilk kurulum
# icin normal (slim olmayan) paketi kullan, o binary'lere ihtiyac duyar.
MODE="${2:-full}"
DIST="$ROOT/dist"
SUFFIX=""
if [[ "$MODE" == "--slim" ]]; then
  SUFFIX="-update"
fi
STAGE="$DIST/Zola-Caption-v$VERSION$SUFFIX"
ZIP="$DIST/Zola-Caption-v$VERSION$SUFFIX.zip"

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
ENGINE_EXCLUDES=(
  --exclude ".DS_Store"
  --exclude ".env"
  --exclude ".env.example.swp"
  --exclude "work/"
  --exclude "tools/"
  --exclude "vendor/"
)
if [[ "$MODE" == "--slim" ]]; then
  ENGINE_EXCLUDES+=(--exclude "bin/" --exclude "models/")
fi

rsync -a \
  "${ENGINE_EXCLUDES[@]}" \
  "$ROOT/outputs/capiton-local-engine/" \
  "$STAGE/capiton-local-engine/"

cp "$ROOT/README.md" "$STAGE/README.md"
cp "$ROOT/scripts/install-macos.sh" "$STAGE/Zola Caption Installer.command"
chmod +x "$STAGE/Zola Caption Installer.command"

# Guvenlik kontrolu: rsync ara sira (disk/Spotlight kilidi vb. nedenlerle) sessizce
# dosya atlayabiliyor. Kritik dosyalarin gercekten kopyalandigini dogrula, yoksa
# bozuk bir paket sessizce yayinlanmasin.
REQUIRED_FILES=(
  "$STAGE/capiton-premiere-cep-plugin/assets/brand/zolalogo.png"
)
if [[ "$MODE" != "--slim" ]]; then
  REQUIRED_FILES+=(
    "$STAGE/capiton-local-engine/bin/whisper-cli"
    "$STAGE/capiton-local-engine/bin/ffmpeg"
    "$STAGE/capiton-local-engine/models/ggml-small.bin"
  )
fi
for required_file in "${REQUIRED_FILES[@]}"; do
  if [ ! -s "$required_file" ]; then
    echo "HATA: paket eksik/bos dosya icindeki cikti: $required_file" >&2
    echo "rsync sessizce basarisiz olmus olabilir, scripti tekrar calistir." >&2
    exit 1
  fi
done

(
  cd "$DIST"
    zip -qr "Zola-Caption-v$VERSION$SUFFIX.zip" "Zola-Caption-v$VERSION$SUFFIX"
)

echo "$ZIP"
