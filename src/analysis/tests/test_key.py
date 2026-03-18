"""Tests for key detection result parsing."""
from analyzer import parse_key_result


class TestKeyResult:
    def test_key_result_format(self):
        """Key result should contain key string and confidence float."""
        result = parse_key_result("A", "minor", 0.85)
        assert result["key"] == "A"
        assert result["scale"] == "minor"
        assert isinstance(result["confidence"], float)

    def test_key_confidence_range(self):
        """Confidence should be between 0.0 and 1.0."""
        result = parse_key_result("C", "major", 0.5)
        assert 0.0 <= result["confidence"] <= 1.0

    def test_key_confidence_clamped_high(self):
        """Confidence above 1.0 should be clamped."""
        result = parse_key_result("D", "minor", 1.5)
        assert result["confidence"] <= 1.0

    def test_key_confidence_clamped_low(self):
        """Confidence below 0.0 should be clamped."""
        result = parse_key_result("E", "major", -0.3)
        assert result["confidence"] >= 0.0
