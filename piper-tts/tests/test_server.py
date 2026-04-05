"""Tests for piper-tts server."""

import io
import json
import struct
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

import server


class TestGetModelPath:
    def test_exact_match(self, tmp_models_dir):
        onnx = tmp_models_dir / "en_US-lessac-medium.onnx"
        onnx.touch()
        result = server.get_model_path("en_US-lessac-medium")
        assert result == onnx

    def test_subdirectory_match(self, tmp_models_dir):
        subdir = tmp_models_dir / "voices"
        subdir.mkdir()
        onnx = subdir / "en_US-ryan-medium.onnx"
        onnx.touch()
        result = server.get_model_path("en_US-ryan-medium")
        assert result == onnx

    def test_returns_none_for_missing(self, tmp_models_dir):
        result = server.get_model_path("nonexistent-voice")
        assert result is None


class TestLoadVoice:
    def test_loads_and_caches_voice(self, tmp_models_dir):
        onnx = tmp_models_dir / "test-voice.onnx"
        onnx.touch()

        mock_voice = MagicMock()
        with patch.object(server, "PiperVoice") as mock_piper:
            mock_piper.load.return_value = mock_voice
            voice = server.load_voice("test-voice")
            assert voice == mock_voice
            mock_piper.load.assert_called_once()

            # Second call should use cache
            voice2 = server.load_voice("test-voice")
            assert voice2 == mock_voice
            assert mock_piper.load.call_count == 1

    def test_raises_for_missing_model(self, tmp_models_dir):
        with pytest.raises(FileNotFoundError, match="Voice model not found"):
            server.load_voice("nonexistent")


class TestListAvailableVoices:
    def test_empty_directory(self, tmp_models_dir):
        voices = server.list_available_voices()
        assert voices == []

    def test_parses_voice_entries(self, tmp_models_dir):
        (tmp_models_dir / "en_US-lessac-medium.onnx").touch()
        (tmp_models_dir / "en_GB-cori-medium.onnx").touch()
        voices = server.list_available_voices()
        assert len(voices) == 2
        ids = {v["id"] for v in voices}
        assert "en_US-lessac-medium" in ids
        assert "en_GB-cori-medium" in ids

    def test_voice_metadata_parsing(self, tmp_models_dir):
        (tmp_models_dir / "en_US-lessac-medium.onnx").touch()
        voices = server.list_available_voices()
        voice = voices[0]
        assert voice["id"] == "en_US-lessac-medium"
        assert voice["quality"] == "medium"
        assert "language" in voice

    def test_single_part_voice_id(self, tmp_models_dir):
        (tmp_models_dir / "simplevoice.onnx").touch()
        voices = server.list_available_voices()
        assert len(voices) == 1
        assert voices[0]["id"] == "simplevoice"
        assert voices[0]["quality"] == "unknown"


class TestWavToMp3:
    def test_success(self):
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = b"mp3-data"

        with patch.object(server.subprocess, "run", return_value=mock_result) as mock_run:
            result = server.wav_to_mp3(b"wav-data")
            assert result == b"mp3-data"
            mock_run.assert_called_once()
            args = mock_run.call_args[0][0]
            assert "ffmpeg" in args

    def test_failure_raises_runtime_error(self):
        mock_result = MagicMock()
        mock_result.returncode = 1
        mock_result.stderr = b"ffmpeg error message"

        with patch.object(server.subprocess, "run", return_value=mock_result):
            with pytest.raises(RuntimeError, match="ffmpeg error"):
                server.wav_to_mp3(b"wav-data")


class TestSynthesizeEndpoint:
    def _make_mock_voice(self):
        mock_voice = MagicMock()
        mock_voice.config.sample_rate = 22050
        chunk = MagicMock()
        chunk.audio_int16_bytes = struct.pack("<h", 100) * 100
        mock_voice.synthesize.return_value = [chunk]
        return mock_voice

    def test_missing_text(self, client):
        response = client.post("/api/tts", json={})
        assert response.status_code == 400
        assert b"Missing" in response.data

    def test_empty_text(self, client):
        response = client.post("/api/tts", json={"text": "   "})
        assert response.status_code == 400
        assert b"empty" in response.data

    def test_voice_not_found(self, client, tmp_models_dir):
        response = client.post(
            "/api/tts",
            json={"text": "Hello", "voice": "nonexistent"},
        )
        assert response.status_code == 404

    def test_wav_success(self, client, tmp_models_dir):
        mock_voice = self._make_mock_voice()
        (tmp_models_dir / "en_US-lessac-medium.onnx").touch()

        with patch.object(server, "PiperVoice") as mock_piper:
            mock_piper.load.return_value = mock_voice
            response = client.post(
                "/api/tts",
                json={"text": "Hello world"},
            )
            assert response.status_code == 200
            assert response.content_type == "audio/wav"
            # Check WAV header
            assert response.data[:4] == b"RIFF"
            assert response.data[8:12] == b"WAVE"

    def test_mp3_success(self, client, tmp_models_dir):
        mock_voice = self._make_mock_voice()
        (tmp_models_dir / "en_US-lessac-medium.onnx").touch()

        with patch.object(server, "PiperVoice") as mock_piper, \
             patch.object(server, "wav_to_mp3", return_value=b"mp3-data"):
            mock_piper.load.return_value = mock_voice
            response = client.post(
                "/api/tts",
                json={"text": "Hello", "format": "mp3"},
            )
            assert response.status_code == 200
            assert response.content_type == "audio/mpeg"

    def test_mp3_conversion_failure(self, client, tmp_models_dir):
        mock_voice = self._make_mock_voice()
        (tmp_models_dir / "en_US-lessac-medium.onnx").touch()

        with patch.object(server, "PiperVoice") as mock_piper, \
             patch.object(server, "wav_to_mp3", side_effect=RuntimeError("ffmpeg failed")):
            mock_piper.load.return_value = mock_voice
            response = client.post(
                "/api/tts",
                json={"text": "Hello", "format": "mp3"},
            )
            assert response.status_code == 500
            assert b"MP3 conversion failed" in response.data

    def test_synthesis_config_params(self, client, tmp_models_dir):
        mock_voice = self._make_mock_voice()
        (tmp_models_dir / "en_US-lessac-medium.onnx").touch()

        with patch.object(server, "PiperVoice") as mock_piper, \
             patch.object(server, "SynthesisConfig") as mock_config:
            mock_piper.load.return_value = mock_voice
            response = client.post(
                "/api/tts",
                json={
                    "text": "Hello",
                    "length_scale": 1.5,
                    "noise_scale": 0.5,
                    "noise_w": 0.6,
                },
            )
            assert response.status_code == 200
            mock_config.assert_called_once_with(
                length_scale=1.5,
                noise_scale=0.5,
                noise_w_scale=0.6,
            )


class TestVoicesEndpoint:
    def test_returns_voice_list(self, client, tmp_models_dir):
        (tmp_models_dir / "en_US-lessac-medium.onnx").touch()
        response = client.get("/api/voices")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]["id"] == "en_US-lessac-medium"


class TestHealthEndpoint:
    def test_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["status"] == "ok"
