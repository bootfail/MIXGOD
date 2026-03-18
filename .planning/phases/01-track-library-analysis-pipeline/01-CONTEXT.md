# Phase 1: Track Library + Analysis Pipeline - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can upload their track collection and see accurate BPM, key, energy, and genre analysis with waveform visualization and audio preview. Includes project save/load. No mix planning, no transitions, no export — those are Phase 2+.

**Requirements:** IMPORT-01, IMPORT-04, ANALYSIS-01, ANALYSIS-02, ANALYSIS-03, ANALYSIS-04, EDIT-01, EDIT-05, EXPORT-03

</domain>

<decisions>
## Implementation Decisions

### Track Library Layout
- Hybrid view: table (default) and card view with a toggle switch
- Full metadata columns: Title, Artist, BPM, Key, Energy, Genre, Duration, file format, bitrate, sample rate, date added, filename
- Monospace font for data columns (BPM, Key, Duration, bitrate), sans-serif for text (Title, Artist, labels)
- Mini-waveform thumbnails in table rows as a column
- Smart playlists with saved filter presets (e.g., "Hardstyle 140-160 BPM", "Latin high energy") plus column header sorting (asc/desc)

### Upload Experience
- Full-page drag & drop zone: drag files anywhere on the page, overlay appears with "Drop tracks here"
- Also includes a browse button for traditional file picker
- Supports MP3, WAV, FLAC
- Batch upload of multiple files at once
- Analysis starts immediately on upload — tracks appear in library and show progress inline

### Waveform & Preview
- Bottom panel shows detailed waveform for the selected/playing track
- Energy-colored waveforms: cool blues for calm sections, warm oranges/reds for high-energy drops — makes energy flow visible at a glance
- Persistent player bar (always visible): play/pause, seek bar, volume control
- Click waveform to seek to position
- Only one detailed waveform visible at a time (the active track)

### Analysis Pipeline
- Per-track status shown inline in the table: queued -> analyzing -> done
- Global progress bar at top during batch analysis (e.g., "Analyzing tracks... 18/30")
- Tracks become interactive as soon as their analysis completes (don't wait for full batch)
- BPM octave-correction: show corrected BPM with a flag indicator (*). Hover/click reveals raw detected value (e.g., "Raw: 75 -> corrected to 150")
- Energy level: 1-10 numeric score with a colored bar (green -> yellow -> red)
- Low-confidence results get a warning icon; user can click any analysis value to manually edit/override
- Failed analysis shows error icon; track still enters library, user can retry or enter values manually
- All auto-detected values are always user-editable

### Genre Taxonomy
- Subgenre-aware classification with hierarchy (e.g., Hardstyle > Raw Hardstyle, Hardcore > Frenchcore, Party > Dutch Feest)
- Primary genre + optional secondary genre per track (enables bridge-track identification)
- User can override AI genre detection AND create entirely new custom genre labels
- Display: show most specific subgenre in column; hover reveals parent hierarchy (e.g., "Hardstyle > Raw")
- Confidence warnings shown only when AI certainty is low (<70%); high-confidence results display cleanly without noise

### App Shell & Navigation
- DAW-style resizable panels (drag borders to resize)
- Default Phase 1 layout: Smart Playlists panel (collapsible, left), Track Library (main area), Waveform + Player (bottom dock)
- Slim header with project name and project switcher access

### Theme & Visual Style
- Neon-dark theme: near-black background (#0a0a0f), dark charcoal panels (#12121a)
- Multicolor neon accents: different neon colors per function (cyan for playback, magenta for analysis, green for confirmed, orange for warnings, etc.)
- Full glow effects: strong neon glow on hover/focus/active, animated gradients, pulsing elements on interactive states
- Smooth animations with neon flair: panels slide in/out (200ms), analysis completion has glow pulse, loading uses neon shimmer skeletons, waveform draws left-to-right
- Typography: Inter (or similar sans-serif) for UI text, JetBrains Mono (or similar monospace) for data columns

### Project Persistence
- Auto-save to browser storage continuously (no manual save needed for day-to-day use)
- Manual export/import of .mixgod project files for backup or sharing between machines
- Audio files stored server-side (.NET backend); project file stores references (paths/IDs), keeping the file lightweight (~50KB)
- Multi-project support with project switcher on startup (create new, open existing, import)
- Each project is independent with its own track library and smart playlists

### Keyboard Shortcuts
- Full DAW-style keyboard shortcuts from day one (not just basics)
- Press ? to show shortcut cheat sheet overlay (grouped by category, like VS Code/GitHub)
- Core shortcuts include: Space (play/pause), Up/Down (navigate tracks), Enter (load track), Delete (remove track), Ctrl+S (export project), Ctrl+F (search/filter), Left/Right (seek), plus comprehensive shortcuts for zoom, selection, multi-select, playlist management, volume control

### Claude's Discretion
- Auto-resume last project vs. show project list on app open (pick best UX flow)
- Exact panel default sizes and resize constraints
- Loading skeleton and empty state designs
- Specific neon color assignments per function (as long as multicolor neon with full glow is maintained)
- Keyboard shortcut exact assignments beyond the core set listed above

</decisions>

<specifics>
## Specific Ideas

- Player bar inspired by Spotify's persistent bottom bar (always visible, shows current track)
- DAW panel system inspired by Ableton/FL Studio (resizable, dockable)
- Smart playlists like Rekordbox/iTunes (saved filter presets)
- Waveform energy coloring maps to the "golven" (waves) energy pattern concept — users can visually identify energy flow before Phase 2 adds the energy curve editor
- Bridge track identification via primary/secondary genre is critical for the genre-spanning boat party mix (Dutch party -> hardstyle -> hardcore transitions)
- The neon-dark + full glow aesthetic should feel like a nightclub dashboard — vibrant, bold, maximum visual impact

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing codebase

### Established Patterns
- Stack: React.js frontend + .NET/C# backend (per PROJECT.md constraints)
- Audio preview: Web Audio API / Tone.js in browser
- Server-side audio storage with lightweight client references

### Integration Points
- Backend API needed for: audio file upload/storage, analysis pipeline execution, project CRUD
- Frontend-backend connection: audio upload endpoint, analysis status polling/WebSocket, project save/load endpoints
- Waveform generation: server-side peak extraction (not full audio decode in browser) per STATE.md blocker note

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-track-library-analysis-pipeline*
*Context gathered: 2026-03-18*
