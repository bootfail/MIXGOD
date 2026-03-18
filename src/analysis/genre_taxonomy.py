"""
Genre taxonomy mapping for MIXGOD.

Maps Essentia Discogs genre labels to user-friendly genre hierarchy.
Supports custom subgenre mappings for DJ-specific genre organization.
"""
from typing import Optional


class GenreTaxonomy:
    """Maps Essentia/Discogs genre strings to a user-friendly hierarchy."""

    # Mapping from Discogs genre labels (as returned by Essentia) to user-friendly names.
    # Format: "Parent---Child" -> user label
    DISCOGS_MAPPING: dict[str, str] = {
        # Electronic / Dance
        "Electronic---Hardstyle": "Hardstyle",
        "Electronic---Hardcore": "Hardcore",
        "Electronic---House": "House",
        "Electronic---Techno": "Techno",
        "Electronic---Trance": "Trance",
        "Electronic---Drum n Bass": "Drum & Bass",
        "Electronic---Dubstep": "Dubstep",
        "Electronic---Electro": "Electro",
        "Electronic---Gabber": "Gabber",
        "Electronic---Happy Hardcore": "Happy Hardcore",
        "Electronic---Industrial": "Industrial",
        "Electronic---Minimal": "Minimal",
        "Electronic---Progressive House": "Progressive House",
        "Electronic---Deep House": "Deep House",
        "Electronic---Tech House": "Tech House",
        "Electronic---Acid": "Acid",
        "Electronic---Breakbeat": "Breakbeat",
        "Electronic---Downtempo": "Downtempo",
        "Electronic---Ambient": "Ambient",
        "Electronic---IDM": "IDM",
        # Latin
        "Latin---Reggaeton": "Reggaeton",
        "Latin---Salsa": "Salsa",
        "Latin---Bachata": "Bachata",
        "Latin---Cumbia": "Cumbia",
        "Latin---Merengue": "Merengue",
        # Hip Hop / Urban
        "Hip Hop---": "Hip Hop",
        "Hip Hop---Trap": "Trap",
        "Hip Hop---Grime": "Grime",
        # Pop / Party
        "Pop---": "Pop",
        "Pop---Euro Pop": "Euro Pop",
        "Pop---Schlager": "Schlager",
        "Folk, World, & Country---": "Folk",
    }

    # Genre hierarchy: parent -> [children] for subgenre-aware classification
    GENRE_HIERARCHY: dict[str, list[str]] = {
        "Hardstyle": ["Raw Hardstyle", "Euphoric Hardstyle", "Classic Hardstyle"],
        "Hardcore": ["Frenchcore", "Uptempo", "Mainstream Hardcore", "Gabber"],
        "House": ["Deep House", "Tech House", "Progressive House", "Electro House"],
        "Techno": ["Industrial Techno", "Minimal Techno", "Acid Techno"],
        "Trance": ["Uplifting Trance", "Psytrance", "Progressive Trance"],
        "Party": ["Dutch Feest", "Schlager", "Carnaval"],
        "Latin": ["Reggaeton", "Salsa", "Bachata", "Cumbia", "Merengue"],
        "Urban": ["Hip Hop", "Trap", "Grime", "R&B"],
    }

    # Reverse lookup: genre name -> parent
    _genre_parents: dict[str, str] = {}

    def __init__(self) -> None:
        self._custom_genres: dict[str, list[str]] = {}
        self._build_parent_lookup()

    def _build_parent_lookup(self) -> None:
        """Build reverse lookup from child genre to parent."""
        self._genre_parents = {}
        for parent, children in self.GENRE_HIERARCHY.items():
            for child in children:
                self._genre_parents[child] = parent

    def map_genre(self, discogs_label: str) -> dict:
        """
        Map an Essentia Discogs genre label to user-friendly genre info.

        Args:
            discogs_label: Genre label in format "Parent---Child" from Essentia.

        Returns:
            Dict with primary, secondary, confidence, and hierarchy fields.
        """
        # Try exact match first
        if discogs_label in self.DISCOGS_MAPPING:
            user_genre = self.DISCOGS_MAPPING[discogs_label]
            hierarchy = self._parse_hierarchy(discogs_label)
            return {
                "primary": user_genre,
                "secondary": None,
                "confidence": 1.0,
                "hierarchy": hierarchy,
            }

        # Try partial match on child part
        parts = discogs_label.split("---")
        if len(parts) == 2:
            parent, child = parts
            # Check if child is directly in our mapping values
            for mapped_label in self.DISCOGS_MAPPING.values():
                if child.lower() == mapped_label.lower():
                    return {
                        "primary": mapped_label,
                        "secondary": None,
                        "confidence": 0.8,
                        "hierarchy": [parent, mapped_label],
                    }

        # Unknown genre
        return {
            "primary": "Unknown",
            "secondary": None,
            "confidence": 0.0,
            "hierarchy": parts if len(parts) > 1 else [discogs_label],
        }

    def _parse_hierarchy(self, discogs_label: str) -> list[str]:
        """Parse a Discogs label into a hierarchy list."""
        parts = discogs_label.split("---")
        if len(parts) == 2:
            parent, child = parts
            user_genre = self.DISCOGS_MAPPING.get(discogs_label, child)
            return [parent, user_genre]
        return [discogs_label]

    def add_custom_genre(self, parent: str, children: list[str]) -> None:
        """
        Add custom subgenre mappings.

        Args:
            parent: Parent genre name (e.g., "Hardstyle").
            children: List of subgenre names (e.g., ["Raw Hardstyle", "Euphoric Hardstyle"]).
        """
        if parent in self._custom_genres:
            # Merge, avoiding duplicates
            existing = set(self._custom_genres[parent])
            self._custom_genres[parent] = list(existing | set(children))
        else:
            self._custom_genres[parent] = list(children)

        # Update hierarchy
        if parent in self.GENRE_HIERARCHY:
            existing = set(self.GENRE_HIERARCHY[parent])
            self.GENRE_HIERARCHY[parent] = list(existing | set(children))
        else:
            self.GENRE_HIERARCHY[parent] = list(children)

        self._build_parent_lookup()

    def get_subgenres(self, parent: str) -> list[str]:
        """
        Get all subgenres for a parent genre.

        Args:
            parent: Parent genre name.

        Returns:
            List of subgenre names, or empty list if not found.
        """
        result = list(self.GENRE_HIERARCHY.get(parent, []))
        custom = self._custom_genres.get(parent, [])
        # Merge without duplicates
        seen = set(result)
        for g in custom:
            if g not in seen:
                result.append(g)
                seen.add(g)
        return result

    def get_parent(self, genre: str) -> Optional[str]:
        """Get the parent genre for a given subgenre."""
        return self._genre_parents.get(genre)
