from __future__ import annotations

import io
import os
import json
import struct
import subprocess
import logging
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from piper import PiperVoice
from piper.config import SynthesisConfig

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODELS_DIR = os.environ.get("PIPER_MODELS_DIR", "/app/models")

# Cache loaded voice models
_voice_cache: dict[str, PiperVoice] = {}


def get_model_path(voice_id: str) -> Path | None:
    """Find the .onnx model file for a voice."""
    models_path = Path(MODELS_DIR)
    # Try exact filename match
    onnx_file = models_path / f"{voice_id}.onnx"
    if onnx_file.exists():
        return onnx_file
    # Try subdirectory match
    for onnx_file in models_path.rglob(f"{voice_id}.onnx"):
        return onnx_file
    return None


def load_voice(voice_id: str) -> PiperVoice:
    """Load a voice model, using cache if available."""
    if voice_id in _voice_cache:
        return _voice_cache[voice_id]

    model_path = get_model_path(voice_id)
    if model_path is None:
        raise FileNotFoundError(f"Voice model not found: {voice_id}")

    logger.info(f"Loading voice model: {voice_id} from {model_path}")
    voice = PiperVoice.load(str(model_path))
    _voice_cache[voice_id] = voice
    return voice


def list_available_voices() -> list[dict]:
    """Scan models directory for available voice models."""
    models_path = Path(MODELS_DIR)
    voices = []

    for onnx_file in sorted(models_path.rglob("*.onnx")):
        voice_id = onnx_file.stem
        # Parse voice ID: language-speaker-quality
        parts = voice_id.rsplit("-", 1)
        if len(parts) == 2:
            name_part, quality = parts
            lang_parts = name_part.split("-", 1)
            language = lang_parts[0] if lang_parts else name_part
            speaker = lang_parts[1] if len(lang_parts) > 1 else name_part
        else:
            language = voice_id
            speaker = voice_id
            quality = "unknown"

        voices.append({
            "id": voice_id,
            "name": f"{speaker} ({quality})",
            "language": language,
            "quality": quality,
        })

    return voices


def wav_to_mp3(wav_bytes: bytes, bitrate: str = "192k") -> bytes:
    """Convert WAV audio to MP3 using ffmpeg."""
    result = subprocess.run(
        [
            "ffmpeg", "-i", "pipe:0",
            "-codec:a", "libmp3lame",
            "-b:a", bitrate,
            "-f", "mp3",
            "pipe:1",
        ],
        input=wav_bytes,
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg error: {result.stderr.decode()}")
    return result.stdout


@app.route("/api/tts", methods=["POST"])
def synthesize():
    """Generate speech from text."""
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"].strip()
    if not text:
        return jsonify({"error": "Text cannot be empty"}), 400

    voice_id = data.get("voice", "en_US-lessac-medium")
    length_scale = float(data.get("length_scale", 1.0))
    noise_scale = float(data.get("noise_scale", 0.667))
    noise_w = float(data.get("noise_w", 0.8))
    output_format = data.get("format", "wav")

    try:
        voice = load_voice(voice_id)
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 404

    # Synthesize audio
    syn_config = SynthesisConfig(
        length_scale=length_scale,
        noise_scale=noise_scale,
        noise_w_scale=noise_w,
    )
    audio_chunks = list(voice.synthesize(text, syn_config))

    if not audio_chunks:
        return jsonify({"error": "No audio generated"}), 500

    # Build WAV in memory from audio chunks
    sample_rate = voice.config.sample_rate
    all_audio = b"".join(chunk.audio_int16_bytes for chunk in audio_chunks)
    wav_buffer = io.BytesIO()
    wav_buffer.write(b"RIFF")
    data_size = len(all_audio)
    wav_buffer.write(struct.pack("<I", 36 + data_size))
    wav_buffer.write(b"WAVE")
    wav_buffer.write(b"fmt ")
    wav_buffer.write(struct.pack("<IHHIIHH", 16, 1, 1, sample_rate, sample_rate * 2, 2, 16))
    wav_buffer.write(b"data")
    wav_buffer.write(struct.pack("<I", data_size))
    wav_buffer.write(all_audio)

    wav_bytes = wav_buffer.getvalue()

    if output_format == "mp3":
        try:
            mp3_bytes = wav_to_mp3(wav_bytes)
            return send_file(
                io.BytesIO(mp3_bytes),
                mimetype="audio/mpeg",
                download_name="speech.mp3",
            )
        except RuntimeError as e:
            logger.error(f"MP3 conversion failed: {e}")
            return jsonify({"error": "MP3 conversion failed"}), 500

    return send_file(
        io.BytesIO(wav_bytes),
        mimetype="audio/wav",
        download_name="speech.wav",
    )


@app.route("/api/voices", methods=["GET"])
def voices():
    """List available voice models."""
    return jsonify(list_available_voices())


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    # Log available voices on startup
    available = list_available_voices()
    logger.info(f"Available voices: {[v['id'] for v in available]}")

    # Detect GPU availability
    try:
        import onnxruntime
        providers = onnxruntime.get_available_providers()
        if "CUDAExecutionProvider" in providers:
            logger.info("GPU (CUDA) available for inference")
        else:
            logger.info("Running on CPU")
    except ImportError:
        logger.info("Running on CPU (onnxruntime not directly importable)")

    app.run(host="0.0.0.0", port=5000)
