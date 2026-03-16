# Requirements: MIXGOD

**Defined:** 2026-03-16
**Core Value:** AI generates a complete, professional-sounding mix from raw tracks — the user refines rather than builds from scratch.

## v1 Requirements

### Audio Import

- [ ] **IMPORT-01**: User can upload audio files via drag & drop (MP3, WAV, FLAC)
- [ ] **IMPORT-02**: User can download audio from YouTube/SoundCloud URL (via yt-dlp)
- [ ] **IMPORT-03**: User can import a Spotify playlist to load track metadata and order
- [ ] **IMPORT-04**: User can batch-import multiple files at once

### Audio Analysis

- [ ] **ANALYSIS-01**: System detects BPM per track with octave-correction (handles 85 vs 170 BPM for hardstyle)
- [ ] **ANALYSIS-02**: System detects musical key per track for harmonic mixing
- [ ] **ANALYSIS-03**: System maps energy level per track (1-10 scale)
- [ ] **ANALYSIS-04**: System classifies genre per track (house, hardstyle, hardcore, frenchcore, party, latin, urban, etc.)
- [ ] **ANALYSIS-05**: System fetches Spotify audio features (danceability, energy, valence, tempo, key) as cross-reference

### Spotify Integration

- [ ] **SPOT-01**: User can sync a Spotify playlist as starting point for a mix
- [ ] **SPOT-02**: System imports Spotify audio features metadata for uploaded tracks (match by title/artist)
- [ ] **SPOT-03**: User can discover bridge-tracks that fit between two genres/vibes via Spotify search
- [ ] **SPOT-04**: System recommends tracks based on current mix and desired energy curve

### SoundCloud Integration

- [ ] **SC-01**: User can search SoundCloud for tracks (especially hardstyle/hardcore content)
- [ ] **SC-02**: System fetches available metadata from SoundCloud search results

### AI Mix Planning

- [ ] **MIX-01**: AI determines optimal track order based on energy flow, harmonic compatibility, and genre transitions
- [ ] **MIX-02**: AI plans transition strategy per transition point (crossfade, cut, EQ blend, FX drop, mashup)
- [ ] **MIX-03**: User can draw an energy wave curve that the AI follows for track ordering and intensity
- [ ] **MIX-04**: AI applies tempo ramping between tracks with large BPM gaps
- [ ] **MIX-05**: AI generates complete mix proposal that user can accept, modify, or regenerate

### Transition Engine

- [ ] **TRANS-01**: System performs EQ crossfades (bass swap, mid/high blend) between tracks
- [ ] **TRANS-02**: System applies filter sweeps (high-pass/low-pass) for transitions
- [ ] **TRANS-03**: System places FX elements (risers, impacts, sweeps) for dramatic transitions
- [ ] **TRANS-04**: System executes beat-aligned hard cuts for genre switches
- [ ] **TRANS-05**: System beatmatches transitions with correct BPM synchronization

### Stem Separation & Mashups

- [ ] **STEM-01**: System separates tracks into stems (vocals, drums, bass, melody) via Demucs
- [ ] **STEM-02**: User can layer vocals from one track over instrumentals of another
- [ ] **STEM-03**: User can mute/solo individual stems per track in the timeline
- [ ] **STEM-04**: AI suggests mashup combinations based on key/BPM/energy compatibility

### Visual Editor

- [ ] **EDIT-01**: User sees all tracks on a waveform timeline with zoom/scroll
- [ ] **EDIT-02**: User can edit transition type, duration, and parameters per transition point
- [ ] **EDIT-03**: User can create loops from source tracks and place them in the mix
- [ ] **EDIT-04**: User can drag & drop to reorder tracks in the mix
- [ ] **EDIT-05**: User can preview any section of the mix in the browser with real-time playback

### Export

- [ ] **EXPORT-01**: User can export final mix as WAV (lossless) via server-side render
- [ ] **EXPORT-02**: User can export final mix as MP3 (320kbps)
- [ ] **EXPORT-03**: User can save and load mix projects for later editing
- [ ] **EXPORT-04**: User can export individual transition segments separately

## v2 Requirements

### Suno AI Integration

- **SUNO-01**: User can generate custom risers/FX/drops via Suno AI for transitions
- **SUNO-02**: User can generate genre bridge tracks via Suno AI
- **SUNO-03**: AI auto-generates transition FX elements when no suitable preset exists

### Advanced Features

- **ADV-01**: User can record and apply custom FX chains per transition
- **ADV-02**: System provides loudness normalization (LUFS targeting) for final export
- **ADV-03**: User can add cue points and markers for live playback reference
- **ADV-04**: System generates visual music video from the mix (waveform/spectrum animation)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first, responsive later |
| Live DJ performance | This is a studio/preparation tool, not live software |
| Streaming audio sourcing | User provides own audio files (legal/licensing) |
| Social features / sharing | Personal tool, not a platform |
| Hardware controller (MIDI/DJ decks) | No physical hardware integration |
| Real-time collaborative editing | Single-user tool |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMPORT-01 | — | Pending |
| IMPORT-02 | — | Pending |
| IMPORT-03 | — | Pending |
| IMPORT-04 | — | Pending |
| ANALYSIS-01 | — | Pending |
| ANALYSIS-02 | — | Pending |
| ANALYSIS-03 | — | Pending |
| ANALYSIS-04 | — | Pending |
| ANALYSIS-05 | — | Pending |
| SPOT-01 | — | Pending |
| SPOT-02 | — | Pending |
| SPOT-03 | — | Pending |
| SPOT-04 | — | Pending |
| SC-01 | — | Pending |
| SC-02 | — | Pending |
| MIX-01 | — | Pending |
| MIX-02 | — | Pending |
| MIX-03 | — | Pending |
| MIX-04 | — | Pending |
| MIX-05 | — | Pending |
| TRANS-01 | — | Pending |
| TRANS-02 | — | Pending |
| TRANS-03 | — | Pending |
| TRANS-04 | — | Pending |
| TRANS-05 | — | Pending |
| STEM-01 | — | Pending |
| STEM-02 | — | Pending |
| STEM-03 | — | Pending |
| STEM-04 | — | Pending |
| EDIT-01 | — | Pending |
| EDIT-02 | — | Pending |
| EDIT-03 | — | Pending |
| EDIT-04 | — | Pending |
| EDIT-05 | — | Pending |
| EXPORT-01 | — | Pending |
| EXPORT-02 | — | Pending |
| EXPORT-03 | — | Pending |
| EXPORT-04 | — | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 0
- Unmapped: 38 ⚠️

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after initial definition*
