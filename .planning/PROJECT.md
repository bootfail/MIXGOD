# MIXGOD

## What This Is

An AI-powered mixing workstation that takes a collection of audio tracks and generates a professional-quality DJ mix — complete with beatmatching, harmonic mixing, creative transitions, mashups, and FX. Built as a web application with a visual editor so the user can review, tweak, and refine the AI's mix proposal before exporting a final master.

First use case: a 30-45 minute boat party megamix spanning Dutch party music, house, latin, urban, hardstyle, raw hardstyle, hardcore, and frenchcore.

## Core Value

AI generates a complete, professional-sounding mix from raw tracks — the user refines rather than builds from scratch.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Upload/import audio tracks (MP3, WAV, FLAC)
- [ ] AI audio analysis: BPM detection, key detection, energy level mapping, genre classification
- [ ] AI mix proposal: optimal track order based on energy flow, harmonic compatibility, and genre transitions
- [ ] AI transition design: per-transition strategy (crossfade, cut, mashup, FX-driven) with beatmatching
- [ ] Harmonic mixing: key-aware transitions that avoid melodic clashes
- [ ] Visual timeline editor: view and adjust the proposed mix on a waveform timeline
- [ ] Transition editor: adjust transition type, duration, and parameters per transition point
- [ ] Loop/sample editor: create and place loops from source tracks into the mix
- [ ] FX engine: risers, buildups, filter sweeps, echo-outs, drops — applied via UI
- [ ] Mashup support: layer vocals from one track over instrumentals of another
- [ ] Energy wave control: define energy curve (golven/waves pattern) that the AI follows
- [ ] Browser preview: real-time playback of the mix in browser (Web Audio API)
- [ ] Server-side render: high-quality final export (WAV/MP3) with all processing applied
- [ ] Export project files: save/load project state for later editing
- [ ] Stem separation: split tracks into vocals/drums/bass/melody for mashup capabilities

### Out of Scope

- Mobile app — web-first, responsive later
- Live DJ performance / real-time mixing for audiences
- Spotify/streaming integration for sourcing tracks — user provides own audio files
- Social features / sharing platform
- Hardware controller support (MIDI/DJ decks)

## Context

- User has strong sound design experience but no DJ decks and limited time
- Music spans extreme BPM ranges: ~100-110 BPM (party/latin) through 128-140 BPM (house/hardstyle) up to 180+ BPM (frenchcore/uptempo)
- Creative genre transitions are critical — the jump from Dutch party music to hardstyle needs to feel intentional, not jarring
- "Golven" (waves) energy pattern: build up → drop → breathe → build higher → drop harder → repeat
- Occasional "adrenaline rush" moments: sudden genre switches or throwbacks that surprise
- Reference playlist: 30 tracks spanning Dutch feest, house, dance, latin, urban
- Hardstyle/hardcore tracks to be added via the tool later
- Deadline: boat party in 2-4 weeks (early April 2026)

## Constraints

- **Frontend**: React.js — user has strong experience
- **Backend**: .NET / C# — user's primary stack
- **Audio preview**: Web Audio API / Tone.js in browser for real-time preview
- **Audio processing**: Server-side for final renders (quality matters for party speaker systems)
- **AI**: LLM for mix strategy/ordering, audio ML models for analysis (BPM, key, stems)
- **Timeline**: Working tool needed within 2-4 weeks for boat party

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid audio architecture | Browser preview for speed, server render for quality | — Pending |
| React + .NET stack | Matches user expertise, fast development | — Pending |
| AI-first workflow | User refines AI output rather than building from scratch | — Pending |
| Stem separation included in v1 | Required for mashup capability, which is core to the mix style | — Pending |

---
*Last updated: 2026-03-16 after initialization*
