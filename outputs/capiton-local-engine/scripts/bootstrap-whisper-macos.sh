#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT/work/whisper.cpp"

mkdir -p "$ROOT/bin" "$ROOT/models" "$ROOT/work"

if ! command -v git >/dev/null 2>&1; then
  echo "git yok. Xcode Command Line Tools kurulu olmalı."
  exit 1
fi

if ! command -v cmake >/dev/null 2>&1; then
  echo "cmake yok. Homebrew ile kur: brew install cmake"
  exit 1
fi

if [ ! -d "$BUILD_DIR/.git" ]; then
  git clone https://github.com/ggml-org/whisper.cpp "$BUILD_DIR"
fi

cmake -S "$BUILD_DIR" -B "$BUILD_DIR/build" -DWHISPER_METAL=ON
cmake --build "$BUILD_DIR/build" --config Release -j

if [ -f "$BUILD_DIR/build/bin/whisper-cli" ]; then
  BIN_NAME="whisper-cli"
elif [ -f "$BUILD_DIR/build/bin/main" ]; then
  BIN_NAME="main"
else
  echo "whisper binary bulunamadı."
  exit 1
fi

cp "$BUILD_DIR/build/bin/$BIN_NAME" "$ROOT/bin/$BIN_NAME"

# cmake build, whisper-cli'yi @rpath ile build/bin altındaki mutlak dev yoluna bağımlı
# bırakıyor. Bu yol release paketine girmediği için (work/ paketlenmiyor) müşteride
# "Library not loaded" dyld hatasıyla çöküyordu. Gerekli dylib'leri bin/ klasörüne
# kopyalayıp rpath'i @executable_path'e çevirerek binary'yi taşınabilir hale getiriyoruz.
cp "$BUILD_DIR"/build/bin/*.dylib "$ROOT/bin/" 2>/dev/null || true

OLD_RPATH="$BUILD_DIR/build/bin"
install_name_tool -rpath "$OLD_RPATH" "@executable_path" "$ROOT/bin/$BIN_NAME"
codesign --force --sign - "$ROOT/bin/$BIN_NAME"
for dylib in "$ROOT"/bin/*.dylib; do
  codesign --force --sign - "$dylib" 2>/dev/null || true
done

if [ ! -f "$ROOT/models/ggml-small.bin" ]; then
  "$BUILD_DIR/models/download-ggml-model.sh" small
  cp "$BUILD_DIR/models/ggml-small.bin" "$ROOT/models/ggml-small.bin"
fi

echo "Zola Caption local whisper hazır."
