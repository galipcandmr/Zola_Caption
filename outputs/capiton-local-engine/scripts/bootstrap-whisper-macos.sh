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
  cp "$BUILD_DIR/build/bin/whisper-cli" "$ROOT/bin/whisper-cli"
elif [ -f "$BUILD_DIR/build/bin/main" ]; then
  cp "$BUILD_DIR/build/bin/main" "$ROOT/bin/main"
else
  echo "whisper binary bulunamadı."
  exit 1
fi

if [ ! -f "$ROOT/models/ggml-small.bin" ]; then
  "$BUILD_DIR/models/download-ggml-model.sh" small
  cp "$BUILD_DIR/models/ggml-small.bin" "$ROOT/models/ggml-small.bin"
fi

echo "Zola Caption local whisper hazır."
