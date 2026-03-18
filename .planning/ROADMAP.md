# Roadmap: MIXGOD

## Overview

MIXGOD delivers an AI-powered mixing workstation in four phases, with phases 1-3 forming the critical path to a boat party mix by early April 2026. Phase 1 builds the track library with accurate audio analysis (solving the BPM octave problem first). Phase 2 adds AI mix planning, professional transitions, and the visual editor. Phase 3 closes the loop with server-side render and high-quality export. Phase 4 adds integrations (Spotify, SoundCloud, YouTube) and stem separation for mashups post-party.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Track Library + Analysis Pipeline** - Upload audio, analyze BPM/key/energy/genre, waveform display, browser preview, project persistence
- [ ] **Phase 2: AI Mix Engine + Timeline Editor** - AI-generated mix proposals, professional transitions, visual timeline editor with full editing
- [ ] **Phase 3: Server Render + Export** - High-quality WAV/MP3 export via server-side render, party-ready output
- [ ] **Phase 4: Integrations + Stems + Mashups** - Spotify/SoundCloud/YouTube integration, stem separation, mashup capabilities

## Phase Details

### Phase 1: Track Library + Analysis Pipeline
**Goal**: Users can upload their track collection and see accurate BPM, key, energy, and genre analysis with waveform visualization and audio preview
**Depends on**: Nothing (first phase)
**Requirements**: IMPORT-01, IMPORT-04, ANALYSIS-01, ANALYSIS-02, ANALYSIS-03, ANALYSIS-04, EDIT-01, EDIT-05, EXPORT-03
**Success Criteria** (what must be TRUE):
  1. User can drag and drop MP3/WAV/FLAC files into the app and see them appear in a track library
  2. Each uploaded track displays detected BPM (with correct octave -- hardstyle at 150 not 75), musical key, energy level, and genre
  3. User can see waveforms for all tracks and click to preview any track in the browser
  4. User can save a project and reload it later with all tracks and analysis intact
  5. Batch upload of 30+ tracks completes analysis within minutes with visible progress feedback
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md -- Scaffold all projects + Python Essentia analysis pipeline (BPM/key/energy/genre)
- [ ] 01-02-PLAN.md -- .NET backend: upload, storage, analysis queue, peak generation
- [ ] 01-03-PLAN.md -- Frontend: neon-dark theme, app shell, upload, track library table
- [ ] 01-04-PLAN.md -- Frontend: waveform, player, project persistence, keyboard shortcuts

### Phase 2: AI Mix Engine + Timeline Editor
**Goal**: AI generates a complete mix proposal with professional transitions that the user can review, edit, and refine on a visual timeline
**Depends on**: Phase 1
**Requirements**: MIX-01, MIX-02, MIX-03, MIX-04, MIX-05, TRANS-01, TRANS-02, TRANS-03, TRANS-04, TRANS-05, EDIT-02, EDIT-03, EDIT-04
**Success Criteria** (what must be TRUE):
  1. User can click "Generate Mix" and the AI produces a full track ordering based on energy flow, harmonic compatibility, and genre transitions
  2. Each transition between tracks has an AI-selected strategy (EQ crossfade, filter sweep, hard cut, FX drop) that sounds professional in browser preview
  3. User can draw an energy wave curve and the AI reorders/adjusts the mix to follow it
  4. User can drag tracks to reorder, edit transition type/duration/parameters, and create loops -- all reflected in real-time browser preview
  5. Transitions between tracks with large BPM gaps (e.g., 128 to 150 BPM) use tempo ramping or creative cuts that sound intentional, not broken
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Server Render + Export
**Goal**: User can export the finished mix as a high-quality audio file ready for party speaker systems
**Depends on**: Phase 2
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-04
**Success Criteria** (what must be TRUE):
  1. User can export the full mix as WAV (lossless) or MP3 (320kbps) with all transitions and FX applied
  2. Exported audio sounds identical to the browser preview (no timing drift, no missing transitions)
  3. User can export individual transition segments to verify quality before rendering the full mix
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Integrations + Stems + Mashups
**Goal**: User can discover and import tracks from external sources and create mashups using stem separation
**Depends on**: Phase 2
**Requirements**: IMPORT-02, IMPORT-03, ANALYSIS-05, SPOT-01, SPOT-02, SPOT-03, SPOT-04, SC-01, SC-02, STEM-01, STEM-02, STEM-03, STEM-04
**Success Criteria** (what must be TRUE):
  1. User can paste a YouTube or SoundCloud URL and the audio is downloaded and imported into the track library
  2. User can sync a Spotify playlist to load track metadata, match it against uploaded files, and discover bridge tracks between genres
  3. System separates any track into stems (vocals, drums, bass, melody) and the user can mute/solo individual stems on the timeline
  4. User can layer vocals from one track over the instrumentals of another to create a mashup, with AI suggesting compatible combinations
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Track Library + Analysis Pipeline | 2/4 | In Progress|  |
| 2. AI Mix Engine + Timeline Editor | 0/3 | Not started | - |
| 3. Server Render + Export | 0/1 | Not started | - |
| 4. Integrations + Stems + Mashups | 0/2 | Not started | - |
