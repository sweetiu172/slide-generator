"""Test fixtures for piper-tts server tests.

Pre-mocks the piper module so server.py can be imported without
installing piper-tts (which requires onnxruntime and model files).
"""
from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Pre-inject mock piper module before importing server
mock_piper = MagicMock()
mock_piper_config = MagicMock()
mock_piper_download = MagicMock()

sys.modules["piper"] = mock_piper
sys.modules["piper.config"] = mock_piper_config
sys.modules["piper.download"] = mock_piper_download

# Make SynthesisConfig accessible as piper.config.SynthesisConfig
mock_piper_config.SynthesisConfig = MagicMock()
mock_piper.PiperVoice = MagicMock()

import server  # noqa: E402


@pytest.fixture
def app():
    """Create Flask test app."""
    server.app.config["TESTING"] = True
    return server.app


@pytest.fixture
def client(app):
    """Create Flask test client."""
    return app.test_client()


@pytest.fixture
def tmp_models_dir(tmp_path, monkeypatch):
    """Create a temporary models directory and patch server.MODELS_DIR."""
    monkeypatch.setattr(server, "MODELS_DIR", str(tmp_path))
    return tmp_path


@pytest.fixture(autouse=True)
def clear_voice_cache():
    """Clear the voice cache between tests."""
    server._voice_cache.clear()
    yield
    server._voice_cache.clear()
