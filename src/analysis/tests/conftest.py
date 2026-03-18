"""
Pytest fixtures for analysis tests.

Unit tests for pure functions (BPM correction, energy normalization, genre mapping)
do not require audio files.

Integration tests that require real audio files are marked with @pytest.mark.integration
and will be skipped if no test fixtures exist.
"""
import pytest
import os

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


@pytest.fixture
def fixtures_dir():
    """Path to test audio fixtures directory."""
    return FIXTURES_DIR


def has_audio_fixtures():
    """Check if audio test fixtures exist."""
    return os.path.isdir(FIXTURES_DIR) and any(
        f.endswith(('.mp3', '.wav', '.flac'))
        for f in os.listdir(FIXTURES_DIR)
    ) if os.path.isdir(FIXTURES_DIR) else False


skip_without_audio = pytest.mark.skipif(
    not has_audio_fixtures(),
    reason="No audio test fixtures found in tests/fixtures/"
)
