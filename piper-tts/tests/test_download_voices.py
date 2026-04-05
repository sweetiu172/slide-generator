"""Tests for download_voices.py."""

import os
from unittest.mock import patch, MagicMock

import pytest


class TestDownloadVoices:
    def test_downloads_all_voices(self, tmp_path, monkeypatch):
        monkeypatch.setenv("PIPER_MODELS_DIR", str(tmp_path))

        # Re-import to pick up the env var
        import importlib
        import download_voices

        monkeypatch.setattr(download_voices, "MODELS_DIR", str(tmp_path))

        mock_get_voices = MagicMock(return_value={})
        mock_ensure = MagicMock()

        with patch.object(download_voices, "get_voices", mock_get_voices), \
             patch.object(download_voices, "ensure_voice_exists", mock_ensure):
            download_voices.main()

            assert mock_ensure.call_count == 3
            called_voices = [call[0][0] for call in mock_ensure.call_args_list]
            assert "en_US-lessac-medium" in called_voices
            assert "en_US-ryan-medium" in called_voices
            assert "en_GB-cori-medium" in called_voices

    def test_creates_models_directory(self, tmp_path, monkeypatch):
        models_dir = tmp_path / "new_models"

        import download_voices
        monkeypatch.setattr(download_voices, "MODELS_DIR", str(models_dir))

        with patch.object(download_voices, "get_voices", return_value={}), \
             patch.object(download_voices, "ensure_voice_exists"):
            download_voices.main()

        assert models_dir.exists()

    def test_voices_list_contains_expected_entries(self):
        import download_voices
        assert len(download_voices.VOICES) == 3
        assert "en_US-lessac-medium" in download_voices.VOICES
