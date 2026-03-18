"""Tests for genre taxonomy mapping."""
from genre_taxonomy import GenreTaxonomy


class TestGenreTaxonomy:
    def setup_method(self):
        self.taxonomy = GenreTaxonomy()

    def test_map_discogs_hardstyle(self):
        """Discogs 'Electronic---Hardstyle' maps to primary='Hardstyle'."""
        result = self.taxonomy.map_genre("Electronic---Hardstyle")
        assert result["primary"] == "Hardstyle"

    def test_map_discogs_hardcore(self):
        """Discogs 'Electronic---Hardcore' maps to primary='Hardcore'."""
        result = self.taxonomy.map_genre("Electronic---Hardcore")
        assert result["primary"] == "Hardcore"

    def test_map_unknown_genre(self):
        """Unknown Discogs label maps to primary='Unknown'."""
        result = self.taxonomy.map_genre("Unknown---Label")
        assert result["primary"] == "Unknown"

    def test_hierarchy_depth(self):
        """Hardstyle hierarchy should include parent and child."""
        result = self.taxonomy.map_genre("Electronic---Hardstyle")
        assert result["hierarchy"] == ["Electronic", "Hardstyle"]

    def test_custom_subgenre_mapping(self):
        """User can add custom subgenre mappings."""
        self.taxonomy.add_custom_genre("Hardstyle", ["Raw Hardstyle", "Euphoric Hardstyle"])
        subgenres = self.taxonomy.get_subgenres("Hardstyle")
        assert "Raw Hardstyle" in subgenres
        assert "Euphoric Hardstyle" in subgenres

    def test_map_house(self):
        """Discogs 'Electronic---House' maps to primary='House'."""
        result = self.taxonomy.map_genre("Electronic---House")
        assert result["primary"] == "House"

    def test_genre_result_has_confidence(self):
        """Genre result should include a confidence field."""
        result = self.taxonomy.map_genre("Electronic---Hardstyle")
        assert "confidence" in result
