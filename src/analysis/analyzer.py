"""
MIXGOD Audio Analysis Pipeline.

Analyzes audio tracks for BPM (with octave correction), musical key,
energy level, and genre classification using Essentia.

Usage:
    python analyzer.py <filepath>

Outputs JSON to stdout with analysis results.
"""
import sys
import json
import logging
from typing import Optional

from genre_taxonomy import GenreTaxonomy

logger = logging.getLogger(__name__)

# Genre-specific expected BPM ranges for octave correction
GENRE_BPM_RANGES: dict[str, tuple[float, float]] = {
    "hardstyle": (140, 165),
    "raw_hardstyle": (145, 165),
    "euphoric_hardstyle": (140, 160),
    "hardcore": (160, 200),
    "frenchcore": (170, 210),
    "uptempo": (190, 250),
    "gabber": (160, 200),
    "house": (120, 135),
    "deep_house": (118, 130),
    "tech_house": (122, 132),
    "techno": (125, 150),
    "trance": (130, 150),
    "latin": (95, 115),
    "reggaeton": (88, 100),
    "party": (120, 160),
    "drum_n_bass": (160, 180),
    "dubstep": (138, 142),
}


def correct_bpm_octave(
    raw_bpm: float, genre_hint: Optional[str] = None
) -> tuple[float, bool]:
    """
    Correct BPM octave errors common in electronic music detection.

    Half-tempo detection is a well-known problem where kick-heavy music
    with slow melodic elements causes algorithms to detect half the true BPM.

    Args:
        raw_bpm: Raw BPM value from the detector.
        genre_hint: Optional genre hint for genre-specific correction ranges.

    Returns:
        Tuple of (corrected_bpm, was_corrected).
    """
    corrected = raw_bpm
    was_corrected = False

    if genre_hint and genre_hint.lower() in GENRE_BPM_RANGES:
        lo, hi = GENRE_BPM_RANGES[genre_hint.lower()]
        if raw_bpm < lo and lo <= raw_bpm * 2 <= hi:
            corrected = raw_bpm * 2
            was_corrected = True
    elif raw_bpm < 100:
        # General heuristic: if BPM < 100, try doubling
        doubled = raw_bpm * 2
        if 120 <= doubled <= 250:
            corrected = doubled
            was_corrected = True

    return corrected, was_corrected


def normalize_energy(
    danceability: float, loudness: float, dynamic_complexity: float
) -> int:
    """
    Normalize combined audio features into a 1-10 energy score.

    Combines danceability (0-1), loudness (dB, typically -40 to 0),
    and dynamic complexity (0-~20) into a single integer score.

    Args:
        danceability: Danceability score from Essentia (0.0 to 1.0).
        loudness: Loudness in dB (typically -40 to 0, higher = louder).
        dynamic_complexity: Dynamic complexity score (0 to ~20).

    Returns:
        Integer energy score from 1 to 10.
    """
    # Normalize each component to 0-1 range
    dance_norm = max(0.0, min(1.0, danceability))

    # Loudness: map -40..0 dB to 0..1 (louder = more energy)
    loud_norm = max(0.0, min(1.0, (loudness + 40) / 40))

    # Dynamic complexity: map 0..15 to 0..1
    dc_norm = max(0.0, min(1.0, dynamic_complexity / 15))

    # Weighted combination
    combined = (dance_norm * 0.35) + (loud_norm * 0.35) + (dc_norm * 0.30)

    # Scale to 1-10
    score = round(combined * 9) + 1
    return max(1, min(10, score))


def parse_key_result(key: str, scale: str, confidence: float) -> dict:
    """
    Parse and validate a key detection result.

    Args:
        key: Musical key (e.g., "A", "C#").
        scale: Scale type (e.g., "minor", "major").
        confidence: Detection confidence (0.0 to 1.0).

    Returns:
        Dict with key, scale, and clamped confidence.
    """
    return {
        "key": key,
        "scale": scale,
        "confidence": max(0.0, min(1.0, confidence)),
    }


def analyze_track(filepath: str) -> dict:
    """
    Perform full analysis on an audio track using Essentia.

    Args:
        filepath: Path to audio file (MP3, WAV, or FLAC).

    Returns:
        Dict with all analysis results.
    """
    try:
        import essentia.standard as es
    except ImportError:
        logger.error("Essentia not installed. Install with: pip install essentia")
        return _empty_result(filepath)

    try:
        # Load audio
        audio = es.MonoLoader(filename=filepath, sampleRate=44100)()

        # BPM detection
        rhythm_extractor = es.RhythmExtractor2013(method="degara")
        bpm, beats, beats_confidence, _, beats_intervals = rhythm_extractor(audio)

        # Key detection with EDM profile
        key_extractor = es.KeyExtractor(profileType="edma")
        key, scale, key_strength = key_extractor(audio)

        # Energy-related features
        energy_val = es.Energy()(audio)
        dynamic_complexity, loudness = es.DynamicComplexity()(audio)
        danceability, dfa = es.Danceability()(audio)

        # Duration
        duration = es.Duration()(audio)

        # Genre classification (with graceful fallback)
        genre_primary = "Unknown"
        genre_secondary = None
        genre_confidence = 0.0

        try:
            genre_result = _classify_genre(filepath)
            if genre_result:
                genre_primary = genre_result.get("primary", "Unknown")
                genre_secondary = genre_result.get("secondary")
                genre_confidence = genre_result.get("confidence", 0.0)
        except Exception as e:
            logger.warning(f"Genre classification failed: {e}")

        # Apply BPM octave correction using genre as hint
        genre_hint = genre_primary.lower().replace(" ", "_") if genre_primary != "Unknown" else None
        bpm_corrected, bpm_was_corrected = correct_bpm_octave(bpm, genre_hint)

        # Normalize energy
        energy_score = normalize_energy(danceability, loudness, dynamic_complexity)

        return {
            "bpm_raw": round(float(bpm), 1),
            "bpm_corrected": round(float(bpm_corrected), 1),
            "bpm_was_corrected": bpm_was_corrected,
            "key": key,
            "scale": scale,
            "key_confidence": round(float(key_strength), 3),
            "energy": energy_score,
            "genre_primary": genre_primary,
            "genre_secondary": genre_secondary,
            "genre_confidence": round(genre_confidence, 3),
            "danceability": round(float(danceability), 3),
            "loudness": round(float(loudness), 2),
            "duration": round(float(duration), 2),
            "beats_confidence": round(float(beats_confidence), 3),
        }

    except Exception as e:
        logger.error(f"Analysis failed for {filepath}: {e}")
        return _empty_result(filepath)


def _classify_genre(filepath: str) -> Optional[dict]:
    """
    Classify genre using Essentia TensorFlow models.

    Returns None if models are not available.
    """
    try:
        from essentia.standard import (
            MonoLoader,
            TensorflowPredictEffnetDiscogs,
            TensorflowPredict2D,
        )
    except ImportError:
        logger.warning("essentia-tensorflow not available, skipping genre classification")
        return None

    try:
        audio = MonoLoader(filename=filepath, sampleRate=16000, resampleQuality=4)()

        embedding_model = TensorflowPredictEffnetDiscogs(
            graphFilename="discogs-effnet-bs64-1.pb",
            output="PartitionedCall:1",
        )
        embeddings = embedding_model(audio)

        genre_model = TensorflowPredict2D(
            graphFilename="genre_discogs400-discogs-effnet-1.pb",
            output="model/Softmax",
        )
        predictions = genre_model(embeddings)

        # Map top prediction through taxonomy
        taxonomy = GenreTaxonomy()
        # Average predictions across frames
        import numpy as np
        avg_predictions = np.mean(predictions, axis=0)
        top_idx = np.argmax(avg_predictions)
        confidence = float(avg_predictions[top_idx])

        # Note: actual label mapping requires the genre label list
        # This is a simplified version
        return {
            "primary": "Unknown",
            "secondary": None,
            "confidence": confidence,
        }

    except Exception as e:
        logger.warning(f"Genre classification failed: {e}")
        return None


def _empty_result(filepath: str = "") -> dict:
    """Return an empty analysis result for error cases."""
    return {
        "bpm_raw": 0.0,
        "bpm_corrected": 0.0,
        "bpm_was_corrected": False,
        "key": "Unknown",
        "scale": "Unknown",
        "key_confidence": 0.0,
        "energy": 1,
        "genre_primary": "Unknown",
        "genre_secondary": None,
        "genre_confidence": 0.0,
        "danceability": 0.0,
        "loudness": 0.0,
        "duration": 0.0,
        "beats_confidence": 0.0,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyzer.py <filepath>", file=sys.stderr)
        sys.exit(1)

    filepath = sys.argv[1]
    result = analyze_track(filepath)
    print(json.dumps(result, indent=2))
