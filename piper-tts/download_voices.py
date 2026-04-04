"""Pre-download Piper TTS voice models to the local models directory.

Usage:
    pip install piper-tts
    python download_voices.py
"""

import os
from pathlib import Path
from piper.download import get_voices, ensure_voice_exists

VOICES = [
    "en_US-lessac-medium",
    "en_US-ryan-medium",
    "en_GB-cori-medium",
]

MODELS_DIR = os.environ.get("PIPER_MODELS_DIR", str(Path(__file__).parent / "models"))


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)
    voices_info = get_voices()
    for voice in VOICES:
        print(f"Downloading {voice}...")
        ensure_voice_exists(voice, [MODELS_DIR], MODELS_DIR, voices_info)
        print(f"  Done: {voice}")
    print(f"\nAll voices downloaded to {MODELS_DIR}")


if __name__ == "__main__":
    main()
