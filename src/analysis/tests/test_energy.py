"""Tests for energy normalization logic."""
from analyzer import normalize_energy


class TestNormalizeEnergy:
    def test_energy_min_is_1(self):
        """Very low values should produce minimum energy of 1."""
        result = normalize_energy(danceability=0.0, loudness=-40.0, dynamic_complexity=0.0)
        assert result == 1

    def test_energy_max_is_10(self):
        """Very high values should produce maximum energy of 10."""
        result = normalize_energy(danceability=1.0, loudness=0.0, dynamic_complexity=20.0)
        assert result == 10

    def test_energy_mid_range(self):
        """Moderate values should produce mid-range energy (4-7)."""
        result = normalize_energy(danceability=0.5, loudness=-10.0, dynamic_complexity=5.0)
        assert 4 <= result <= 7

    def test_energy_returns_int(self):
        """Energy should always be an integer."""
        result = normalize_energy(danceability=0.3, loudness=-15.0, dynamic_complexity=3.0)
        assert isinstance(result, int)

    def test_energy_never_zero(self):
        """Energy should never be 0."""
        result = normalize_energy(danceability=0.01, loudness=-50.0, dynamic_complexity=0.1)
        assert result >= 1

    def test_energy_never_above_10(self):
        """Energy should never exceed 10."""
        result = normalize_energy(danceability=1.0, loudness=5.0, dynamic_complexity=50.0)
        assert result <= 10
