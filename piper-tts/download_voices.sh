#!/bin/bash
# Download Piper TTS voice models from HuggingFace
# Usage: bash download_voices.sh [output_dir]

set -e

MODELS_DIR="${1:-$(dirname "$0")/models}"
BASE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0"

mkdir -p "$MODELS_DIR"

# voice_id -> path_in_repo
declare -A VOICES=(
    ["en_US-lessac-medium"]="en/en_US/lessac/medium"
    ["en_US-ryan-medium"]="en/en_US/ryan/medium"
    ["en_GB-cori-medium"]="en/en_GB/cori/medium"
)

for voice_id in "${!VOICES[@]}"; do
    path="${VOICES[$voice_id]}"
    onnx="$MODELS_DIR/${voice_id}.onnx"
    json="$MODELS_DIR/${voice_id}.onnx.json"

    if [ -f "$onnx" ] && [ -f "$json" ]; then
        echo "Already exists: $voice_id"
        continue
    fi

    echo "Downloading $voice_id..."
    curl -L -o "$onnx" "$BASE_URL/$path/$voice_id.onnx"
    curl -L -o "$json" "$BASE_URL/$path/$voice_id.onnx.json"
    echo "  Done: $voice_id"
done

echo ""
echo "All voices downloaded to $MODELS_DIR"
ls -lh "$MODELS_DIR"
