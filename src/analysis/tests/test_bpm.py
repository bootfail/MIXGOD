"""Tests for BPM octave correction logic."""
from analyzer import correct_bpm_octave


class TestCorrectBpmOctave:
    def test_hardstyle_half_tempo_corrected(self):
        """Raw 75 BPM with hardstyle genre hint should be doubled to 150."""
        bpm, was_corrected = correct_bpm_octave(75, genre_hint='hardstyle')
        assert bpm == 150
        assert was_corrected is True

    def test_already_correct_bpm(self):
        """Raw 150 BPM with hardstyle hint should remain unchanged."""
        bpm, was_corrected = correct_bpm_octave(150, genre_hint='hardstyle')
        assert bpm == 150
        assert was_corrected is False

    def test_frenchcore_half_tempo(self):
        """Raw 90 BPM with frenchcore hint should be doubled to 180."""
        bpm, was_corrected = correct_bpm_octave(90, genre_hint='frenchcore')
        assert bpm == 180
        assert was_corrected is True

    def test_no_genre_hint_low_bpm(self):
        """Raw 85 BPM without genre hint, doubled 170 is in range, should correct."""
        bpm, was_corrected = correct_bpm_octave(85, genre_hint=None)
        assert bpm == 170
        assert was_corrected is True

    def test_no_genre_hint_normal_bpm(self):
        """Raw 130 BPM without genre hint should remain unchanged."""
        bpm, was_corrected = correct_bpm_octave(130, genre_hint=None)
        assert bpm == 130
        assert was_corrected is False

    def test_house_bpm_correct(self):
        """Raw 128 BPM with house hint is already in range, no correction."""
        bpm, was_corrected = correct_bpm_octave(128, genre_hint='house')
        assert bpm == 128
        assert was_corrected is False

    def test_uptempo_half(self):
        """Raw 110 BPM with uptempo hint should be doubled to 220."""
        bpm, was_corrected = correct_bpm_octave(110, genre_hint='uptempo')
        assert bpm == 220
        assert was_corrected is True
