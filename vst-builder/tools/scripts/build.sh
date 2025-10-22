#!/usr/bin/env bash
set -euo pipefail
STAMP="$1"
EXPORT_PATH="$2"
if [ -z "$EXPORT_PATH" ]; then
  EXPORT_PATH="$(pwd)/../../backend/export/$STAMP"
fi
EXPORT_PATH="$(cd "$EXPORT_PATH" && pwd)"
echo "[vst-builder] build.sh called with stamp=$STAMP, export=$EXPORT_PATH"
GEN_CPP="$(cd "$(dirname "$0")" && pwd)/generate_standalone.cpp"
EXE_DIR="$(cd "$(dirname "$0")" && pwd)"
GEN_BIN="$EXE_DIR/generate_standalone"
if [ -f "$GEN_CPP" ]; then
  echo "Compiling generator with clang++..."
  clang++ -std=c++17 -O2 -o "$GEN_BIN" "$GEN_CPP" || true
fi
if [ -x "$GEN_BIN" ]; then
  echo "Running generator to emit standalone project..."
  "$GEN_BIN" "$EXPORT_PATH"
else
  echo "Generator binary missing or not executable; skipping generation"
fi
# Build generated project
PROJ_DIR="$EXPORT_PATH/project_standalone"
if [ ! -d "$PROJ_DIR" ]; then
  echo "No generated project at $PROJ_DIR"; exit 0
fi
if ! command -v cmake >/dev/null 2>&1; then
  echo "cmake not found; skipping build"; exit 0
fi
BUILD_DIR="$PROJ_DIR/build"
rm -rf "$BUILD_DIR" || true
mkdir -p "$BUILD_DIR"
pushd "$BUILD_DIR"
cmake ..
cmake --build . --config Release || true
popd

# Copy build artifacts to binaries/
BIN_OUT="$EXPORT_PATH/binaries"
mkdir -p "$BIN_OUT"
# find common executable names
find "$BUILD_DIR" -maxdepth 3 -type f -perm -111 -print -o -name "*.app" -print | while read f; do
  cp -R "$f" "$BIN_OUT/"
done

echo "Build step completed. Binaries (if any) placed in $BIN_OUT"
