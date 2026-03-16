# Project Research Summary

**Project:** MIXGOD - AI-Powered Mixing Workstation
**Domain:** AI-powered audio mixing workstation / automated DJ mix generator (web-based)
**Researched:** 2026-03-16
**Confidence:** HIGH

## Executive Summary

MIXGOD is a browser-based DJ mix creation tool targeting a genuinely unsolved problem: automated, AI-guided transitions across an extreme BPM range (100-200+ BPM), spanning Dutch party, hardstyle, hardcore, and frenchcore genres. No existing tool — DJ.Studio, RaveDJ, djay Pro, PulseDJ — handles this transition range automatically. The recommended architecture is a polyglot three-tier system: React frontend with Tone.js for real-time browser preview, a .NET 10 backend handling the mix engine and project state, and a Python FastAPI sidecar for all ML/audio analysis (Essentia for BPM/key, Demucs v4 for stem separation). The Python ecosystem is non-negotiable for audio ML — fighting it from C# wastes weeks. Audio files never cross service boundaries over HTTP; services communicate via shared filesystem paths.

The product is governed by a hard deadline: a boat party in early April 2026, approximately 2-4 weeks away. Research confirms the product can be made functional in that window if the critical path is followed ruthlessly — upload, analyze, order, EQ crossfade transitions, server-side render, export. Stem separation, mashups, and the FX engine are post-party enhancements. The energy wave designer ("golven" pattern) is MIXGOD's primary long-term differentiator; a simplified version belongs in the roadmap, but it must not block the basic mix generation loop.

The two highest-risk technical problems must be solved in Phase 1 or everything downstream breaks. First: BPM octave detection errors — hardstyle detected at half-tempo, party tracks at double — corrupt all beatmatching and AI planning. Multi-algorithm consensus (Essentia + TempoCNN + madmom) with genre-aware validation ranges is the fix, and it must be tested against real hardstyle and frenchcore tracks before any AI work begins. Second: browser AudioBuffer memory explosion — decoding full tracks in the browser crashes tabs with 10+ tracks. The prevention (MediaElement streaming + server-generated waveform peaks) must be baked into the initial architecture; retrofitting is a full rewrite.

## Key Findings

### Recommended Stack

The stack divides cleanly by runtime boundary. .NET 10 owns the API, project persistence (EF Core + SQL Server), background job queue (Hangfire), real-time progress push (SignalR), and the server-side audio render pipeline (NAudio + FFMpegCore). React 18/19 with TypeScript 5 owns the frontend, backed by Tone.js for browser audio preview, wavesurfer.js 7 for waveform rendering, and Zustand for state management. Python 3.11+ runs as a separate FastAPI microservice handling Essentia (BPM/key/energy), librosa and madmom (beat tracking consensus), and Demucs v4 htdemucs_ft (stem separation). LLM integration (OpenAI GPT-4o or Claude API) combined with a deterministic rule engine handles mix planning — the LLM provides high-level ordering strategy, the rule engine enforces harmonic and BPM constraints.

**Core technologies:**
- **.NET 10 + ASP.NET Core**: API, background jobs, audio render pipeline — user's primary stack, excellent async/perf
- **React 18 + TypeScript 5**: Frontend SPA — strong user experience, JavaScript-native audio/visualization ecosystem
- **Python 3.11 + FastAPI**: Audio analysis microservice — ML/audio ecosystem is Python-native; C# interop wastes weeks
- **Essentia 2.1 + librosa 0.10 + madmom 0.17**: BPM, key, energy, beat tracking — multi-algorithm consensus required for extreme BPM range accuracy
- **Demucs v4 (htdemucs_ft)**: Stem separation — state-of-the-art (9.20 dB SDR on MUSDB18-HQ), MIT license, significantly better than Spleeter
- **NAudio 2.2.1 + FFMpegCore 5.4.0**: Server-side audio render and encoding — .NET standard audio stack, handles WAV/MP3/FLAC export
- **Tone.js 15**: Browser audio preview — high-level DAW-like transport abstraction over Web Audio API
- **wavesurfer.js 7 + @wavesurfer/react 1**: Waveform visualization — dominant library, official React wrapper, regions + timeline plugins
- **Zustand**: Frontend state management — lower boilerplate than Redux, critical for 60fps playback updates without full re-renders
- **Hangfire**: Background job queue — reliable retry, dashboard for monitoring stem separation and render jobs
- **SignalR**: Real-time progress push — analysis, stem separation, and render jobs push progress to browser

See `.planning/research/STACK.md` for full version details, alternatives evaluated, and BPM range handling strategies.

### Expected Features

**Must have (table stakes) — users expect these from any AI mixing tool:**
- BPM detection and beatmatching — foundation of modern mixing; missing = product is unusable
- Key detection with Camelot wheel notation — harmonic mixing is standard since Mixed In Key popularized it
- Track import: MP3, WAV, FLAC — FLAC support is non-negotiable (DJ.Studio received complaints for lacking it)
- Waveform visualization — visual confirmation expected in every DAW and DJ tool
- Basic EQ crossfade transitions — volume crossfades without EQ management sound amateur (muddy bass)
- Phase-aligned beatmatching — listeners notice beat misalignment immediately
- Track ordering suggestions — expected from any tool marketed as "AI"
- Project save/load — losing work is a dealbreaker
- Audio preview/playback in browser — users must hear what they are building
- Volume normalization (LUFS-based) — unbalanced tracks from different sources sound amateurish
- Export to WAV/MP3 — the end product is a playable file

**Should have (differentiators) — what makes MIXGOD worth building:**
- Energy wave designer ("golven" pattern) — drawable bezier energy curve the AI targets; no existing tool does this as a first-class concept
- Extreme BPM range transitions (100-200+) — the primary use case; no AI tool handles Dutch party to frenchcore automatically
- AI transition strategy selection — per-pair intelligence (filter sweep vs. hard cut vs. mashup vs. echo-out) based on genre, BPM delta, energy delta
- Stem separation for mashups (Demucs) — vocals from track A over instrumentals of track B; better quality and control than RaveDJ
- Genre-aware transition intelligence — Dutch party to hardstyle needs a fundamentally different strategy than house to house
- FX engine (risers, sweeps, drops) — professional bridges for transitions where tracks do not blend naturally
- Visual transition editor with per-stem automation lanes — beyond DJ.Studio which only automates full-track parameters

**Defer (post-party / v2+):**
- Genre-aware ML transition intelligence (encode as simple rules first, ML model later)
- Adrenaline rush / intentional surprise moment system
- Advanced intelligent loop extraction and loop-based tempo bridging
- Mobile / responsive layout

**Anti-features — deliberately not building:**
- Live DJ performance mode (out of scope per PROJECT.md)
- Streaming service integration (copyright issues, audio quality problems)
- Social / sharing platform (feature creep — separate product)
- Hardware / MIDI controller support (live performance feature)
- Beat grid manual editor (a rabbit hole; provide BPM override instead)
- Video mixing, AI music generation, vinyl emulation

See `.planning/research/FEATURES.md` for full feature dependency tree and competitive gap analysis.

### Architecture Approach

The architecture is a three-tier polyglot system with a hybrid audio model at its core. The React frontend communicates with the .NET backend via REST for CRUD operations and SignalR for async job progress. The .NET backend delegates all ML/audio analysis to the Python FastAPI sidecar via HTTP, passing file paths over a shared filesystem (no multi-MB audio bytes over the wire). The defining architectural decision is the dual audio engine: Tone.js in the browser provides instant preview playback while NAudio + FFmpeg on the server produces the high-quality final render. Both consume the same `MixPlan` JSON document as the single source of truth. Long-running jobs (analysis: seconds; stem separation: minutes; render: minutes) are queued via Hangfire with SignalR progress push to the UI. Zustand state on the frontend uses a slice pattern — playback cursor position must live in refs, not the store, to avoid 60fps re-renders of the entire timeline.

**Major components:**
1. **React Timeline Editor** — visual multi-track arrangement, drag/drop reorder, transition editing, energy curve overlay (Canvas/SVG)
2. **Zustand State Store (sliced)** — projectSlice, mixPlanSlice, playbackSlice, uiSlice; undo/redo on mixPlanSlice only
3. **Tone.js Web Audio Engine** — browser-side multi-track preview, crossfades, effects via AudioWorklet (never ScriptProcessorNode)
4. **ASP.NET Core API + SignalR Hub** — REST endpoints for all CRUD + real-time job progress
5. **Hangfire Background Job Queue** — AnalyzeTrackJob, SeparateStemsJob, GenerateMixPlanJob, RenderMixJob
6. **MixGod.Audio (NAudio + FFMpegCore)** — server-side mix render, ISampleProvider chain, FFmpeg export
7. **Python AI Sidecar (FastAPI)** — Essentia/librosa/madmom analysis, Demucs stem separation, model cache in memory
8. **MixPlan JSON** — canonical mix descriptor consumed by both audio engines; enables undo, save/load, AI generation
9. **Shared File Store** — originals, decoded WAV, waveform peaks, stems, renders; organized by project/track path structure
10. **SQL Server + EF Core** — project metadata, track analysis results, mix plans

See `.planning/research/ARCHITECTURE.md` for full data flow diagrams, build order table, scaling considerations, and anti-patterns.

### Critical Pitfalls

1. **AudioBuffer memory explosion** — Never call `decodeAudioData()` for full tracks in the browser. 30 tracks x 50MB decoded = 1.5GB+ of PCM; tabs crash. Use MediaElement backend for playback and pre-computed peak JSON (server-side) for waveform display. Must be architected from day one; retrofitting is a full rewrite.

2. **BPM detection octave errors** — Hardstyle at 150 BPM detected as 75 BPM; party tracks at 100 BPM detected as 200 BPM. Implement genre-aware BPM validation ranges and multi-algorithm consensus (Essentia RhythmExtractor2013 + TempoCNN + madmom) before AI mix planning can produce anything useful. Test with 5+ genre-representative tracks per genre.

3. **Hybrid architecture sync drift** — Browser preview and server render use different time-stretching and sample-rate conversion. A 1ms timing difference per transition compounds to audible errors over a 30-minute mix. Define a canonical timing model in absolute sample positions at a fixed sample rate (44100 Hz), not floating-point seconds.

4. **Time-stretching artifacts beyond 8-10%** — Phase vocoder smears kick transients. A 128-to-150 BPM transition requires ~17% stretch — well into artifact territory on hardstyle material. The AI mix planner must prefer orderings that minimize required stretch; use EQ-based cuts or FX bridges for large BPM gaps.

5. **LLM hallucination in mix planning** — LLMs confidently suggest physically impossible transitions (crossfade at 100-to-175 BPM, blend longer than available audio). Implement a validation/constraint layer between LLM output and the mix engine; use the LLM only for high-level ordering and strategy, never for timing math.

See `.planning/research/PITFALLS.md` for 14 pitfalls with detection strategies, confidence levels, and phase relevance.

## Implications for Roadmap

Based on combined research — the architecture's explicit build order, the feature dependency tree, pitfall phase relevance, and the hard boat party deadline — the following phase structure is recommended:

### Phase 1: Foundation — Data Model, Upload, Analysis Pipeline
**Rationale:** Everything else has a hard dependency on tracks existing with accurate analysis data. The BPM octave problem must be solved here before any AI work begins. This is the highest-risk phase technically and the one with zero shortcuts.
**Delivers:** Working track library with BPM, key, energy, and genre metadata. Waveform peak data served to the frontend. Project persistence. Real-time analysis progress via SignalR.
**Addresses:** Track import (MP3/WAV/FLAC), BPM/key detection with octave correction, volume normalization, waveform visualization, project save/load
**Avoids:** BPM octave errors (multi-algorithm consensus + genre-aware validation from day one), AudioBuffer memory explosion (server-side peaks, never full browser decode), project serialization fragility (versioned JSON format from day one)
**Stack:** .NET 10 API + EF Core + SQL Server, Python FastAPI sidecar with Essentia + librosa + madmom, Hangfire, SignalR, wavesurfer.js with pre-computed peaks
**Research flag:** NEEDS PHASE RESEARCH — BPM octave correction and genre classification logic require specific algorithm decisions; test against hardstyle/frenchcore tracks during implementation

### Phase 2: Timeline Editor and Browser Preview
**Rationale:** Users need visual feedback and audio preview before AI mix planning has value. The MixPlan schema must be defined here — it is the single source of truth for both audio engines and must exist before AI can populate it. Timeline editor enables manual track ordering and transition editing to validate the UX before AI is built.
**Delivers:** Interactive timeline with waveform display, drag-to-reorder tracks, basic crossfade transitions, Tone.js multi-track preview playback, transport controls
**Addresses:** Waveform visualization (interactive), audio preview/playback, basic transitions, MixPlan schema definition
**Avoids:** ScriptProcessorNode (AudioWorklet exclusively from day one), monolithic Zustand store (slices + refs for 60fps cursor), CORS and AudioContext autoplay restrictions
**Stack:** React + TypeScript + Zustand, Tone.js, wavesurfer.js + @wavesurfer/react, MixPlan JSON schema
**Research flag:** STANDARD PATTERNS — wavesurfer.js and Tone.js have thorough documentation; well-established React SPA patterns apply

### Phase 3: AI Mix Planning and Track Ordering
**Rationale:** With analysis data from Phase 1 and a stable MixPlan schema from Phase 2, AI planning can generate a full mix structure. This delivers the first end-to-end "AI generates, user refines" workflow — the core value proposition of MIXGOD.
**Delivers:** LLM-driven track ordering, transition type suggestions, energy curve awareness (initial implementation), harmonic compatibility scoring (Camelot wheel), feasibility validation layer
**Addresses:** Track ordering suggestions, AI transition strategy selection, energy wave designer (basic version)
**Avoids:** LLM hallucination (constraint validation layer, deterministic timing math, narrow LLM scope for strategy not timing), key detection overconfidence (soft preference not hard filter for harmonic compatibility)
**Stack:** OpenAI/Claude API called from .NET, custom rule engine (Camelot wheel, BPM stretch limits, BPM range constraints)
**Research flag:** NEEDS PHASE RESEARCH — LLM prompt engineering for structured music metadata output and validation layer design require experimentation; no existing reference for DJ mix planning via LLM

### Phase 4: Transition Engine — EQ Crossfades, FX, Tempo Handling
**Rationale:** Basic crossfades from Phase 2 create muddy bass buildup from simultaneous kick drums at different phases. Professional transitions require EQ management. This phase makes the mix sound like a real DJ mix rather than an automated playlist. Required before server-side render is useful.
**Delivers:** EQ-based transitions (bass swap, filter sweep, echo-out), crossfade templates, per-transition parameter editing, FX engine basics (risers, sweeps), tempo ramping for moderate BPM gaps
**Addresses:** EQ crossfade transitions (upgraded from basic volume crossfade), FX engine, genre-aware transition strategy implementation
**Avoids:** Crossfade phase cancellation (EQ-based transitions as default, automatic gain staging to prevent clipping), time-stretch artifacts (stretch limit enforcement: max 8% per track; creative cuts for larger BPM gaps), sync drift (sample-accurate timing model in MixPlan)
**Stack:** NAudio ISampleProvider chain, SoundTouch time-stretching (or Rubber Band via FFmpeg — evaluate during this phase), Tone.js AudioWorklet effects for preview, automation lanes in MixPlan
**Research flag:** STANDARD PATTERNS — DJ EQ transition techniques are well-documented; NAudio ISampleProvider is well-established. Validate time-stretching library choice early in this phase.

### Phase 5: Server-Side Render and Export
**Rationale:** Browser preview is directionally accurate but party speakers demand server-side render quality. This phase closes the loop from mix planning to an exportable file. Required for the boat party.
**Delivers:** High-quality WAV/MP3/FLAC export, loudness normalization (-14 LUFS streaming or -8 LUFS club standard), light mastering chain (limiter + high-pass at 30 Hz), spot-check render feature for transition verification, download flow
**Addresses:** Export to audio file, final loudness normalization
**Avoids:** Export quality mismatch with PA systems (mastering chain, correct LUFS target), hybrid sync drift accumulation (spot-check render for comparison against preview)
**Stack:** NAudio MixRenderer + ISampleProvider chain, FFMpegCore with loudness normalization, Hangfire RenderMixJob, SignalR download notification
**Research flag:** STANDARD PATTERNS — NAudio mixing and FFMpegCore export are thoroughly documented; loudness normalization is standard audio engineering

### Phase 6: Stem Separation and Mashup Capabilities (Post-Party)
**Rationale:** Stem separation enables mashup workflows (vocals over instrumentals) but introduces significant complexity: GPU process management, artifact quality assessment, stem-aware transition automation. This is architecturally independent of the main critical path. Defer if the boat party deadline is at risk.
**Delivers:** Demucs v4 stem separation (vocals/drums/bass/other), mashup editor, stem-aware automation lanes in transition editor, stem quality scoring per track
**Addresses:** Stem separation for mashups, visual transition editor with per-stem automation, extreme BPM transitions via stem layering
**Avoids:** Stem separation artifacts (htdemucs_ft fine-tuned model + post-processing noise gate + quality indicators), Demucs process management failures (dedicated Python microservice with job timeouts, GPU memory monitoring, process isolation per job)
**Stack:** Demucs v4 htdemucs_ft, Python AI sidecar (already exists from Phase 1 extended), MixPlan stemMask field
**Research flag:** NEEDS PHASE RESEARCH — GPU resource management strategy, artifact quality detection metrics, mashup workflow UX design, Demucs artifact levels on dense hardstyle material (unknown)

### Phase Ordering Rationale

- Phase 1 before all others: analysis data is a hard technical dependency for every subsequent phase; BPM correctness gates AI planning
- Phase 2 before Phase 3: MixPlan schema must be defined and stable before AI can populate it; visual feedback needed to evaluate AI output
- Phase 3 before Phase 4: AI ordering and transition strategy selection informs which transition types the engine must support
- Phase 4 before Phase 5: server render must implement the same transition model as the preview engine for meaningful consistency
- Phase 6 last: architecturally independent of the critical path; highest infrastructure complexity; defer to protect the deadline
- Phases 1-5 are the minimum viable product for the boat party; Phase 6 is post-party enhancement

### Research Flags

Phases needing `/gsd:research-phase` during planning:
- **Phase 1:** BPM octave correction implementation (multi-algorithm consensus logic, genre classification from audio features), testing methodology
- **Phase 3:** LLM prompt engineering for structured music metadata output, constraint validation layer architecture, energy curve-to-track-ordering mapping
- **Phase 6:** Demucs GPU process management on target hardware, stem quality scoring metrics, mashup UX design patterns

Phases with standard patterns (skip research-phase):
- **Phase 2:** wavesurfer.js + Tone.js + Zustand are thoroughly documented; standard React SPA DAW patterns apply
- **Phase 4:** DJ EQ transition techniques are extensively documented; NAudio ISampleProvider chain is well-established
- **Phase 5:** NAudio mixing and FFMpegCore export are well-documented; loudness normalization is a solved problem

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All major libraries have official documentation and active communities. Python/Essentia/Demucs choices are industry standard for audio ML. .NET audio stack (NAudio + FFMpegCore) is well-established. Only uncertainty: ONNX-native Demucs for .NET is in-progress (GSOC 2025), not yet production-ready — Python sidecar is the right call for now. |
| Features | HIGH | Thorough competitive analysis against DJ.Studio, djay Pro, Mixed In Key, RaveDJ, PulseDJ. Table stakes and market gaps clearly identified. MIXGOD's differentiators (energy wave as first-class concept, extreme BPM range, stem-level automation) are genuinely unserved by existing tools. |
| Architecture | MEDIUM-HIGH | Core patterns (hybrid audio engines, MixPlan as single source of truth, background jobs + SignalR, Python sidecar via HTTP + shared filesystem) are well-validated for this type of application. Hybrid preview/render sync drift is a known risk with documented mitigations but no empirical validation for this specific use case. |
| Pitfalls | HIGH | Most critical pitfalls are well-documented across audio engineering forums, library issue trackers, and DJ communities. Moderate confidence on LLM hallucination in music planning (general LLM research applies; domain-specific data sparse) and Demucs/.NET process management edge cases. |

**Overall confidence:** HIGH

### Gaps to Address

- **BPM octave correction accuracy:** No hard accuracy benchmarks for multi-algorithm consensus on hardstyle/frenchcore test sets. Validate during Phase 1 with genre-representative test tracks before proceeding to AI planning. Target: zero octave errors on 5+ tracks per target genre.
- **Time-stretching library selection:** NAudio does not include time-stretching natively. Two options: SoundTouch .NET wrapper, or Rubber Band Library via FFmpeg. Rubber Band generally produces better quality. Evaluate both during Phase 4 at 10-20% stretch ratios on hardstyle material. This is critical for beatmatching tracks at different BPMs.
- **LLM prompt design for mix planning:** No existing reference for DJ mix planning via LLM. The exact prompt structure (what metadata to include, how to express Camelot wheel constraints, required output format) needs experimentation. Start narrow (track ordering only) before expanding to transition strategy selection.
- **Demucs artifact levels on dense hardstyle:** Dense hardstyle material (distorted kick + screech synth leads) is the hardest input for stem separation. Artifact quality on this specific genre is uncertain. Test with real hardstyle tracks before committing to mashup feature for Phase 6.
- **GPU availability on target hardware:** Demucs with GPU (CUDA) is 10-50x faster than CPU. If the development/hosting machine lacks a capable GPU, stem separation timeline expectations must be adjusted. CPU-only mode (slower but no CUDA requirement) should be implemented as a fallback.
- **Phrase/section detection:** Detecting intro/outro/drop/breakdown boundaries enables intelligent transition placement. Essentia may provide this via energy analysis but needs investigation. Could be approximated from energy curve analysis without dedicated algorithms.

## Sources

### Primary (HIGH confidence)
- [Essentia documentation](https://essentia.upf.edu/) — BPM detection (RhythmExtractor2013, TempoCNN), key detection (HPCP), audio analysis
- [Demucs GitHub - Facebook Research](https://github.com/facebookresearch/demucs) — stem separation model quality, htdemucs_ft selection rationale
- [NAudio GitHub](https://github.com/naudio/NAudio) — .NET audio processing, ISampleProvider architecture
- [wavesurfer.js](https://wavesurfer.xyz/) — waveform visualization, pre-computed peaks, MediaElement backend
- [Tone.js](https://tonejs.github.io/) — browser audio framework, Transport API, official React integration guide
- [Mixed In Key - Camelot Wheel](https://mixedinkey.com/camelot-wheel/) — harmonic mixing rules and compatibility matrix
- [DJ.Studio documentation](https://help.dj.studio/) — competitive feature comparison, transition editor reference
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — AudioWorklet, MediaElement backend, memory best practices
- [FFMpegCore GitHub](https://github.com/rosenbjerg/FFMpegCore) — .NET FFmpeg wrapper, version 5.4.0

### Secondary (MEDIUM confidence)
- [Demucs ONNX conversion - Mixxx GSOC 2025](https://mixxx.org/news/2025-10-27-gsoc2025-demucs-to-onnx-dhunstack/) — future .NET-native stem separation path
- [DJ.Studio blog - tempo change techniques](https://dj.studio/blog/dj-tempo-change-techniques) — BPM transition strategy reference
- [Spleeter vs Demucs comparison](https://stemsplit.io/blog/spleeter-vs-demucs) — quality gap validation; confirms Demucs selection
- [W3C Media Production Workshop - Building Audio Apps](https://www.w3.org/2021/03/media-production-workshop/talks/hongchan-choi-building-audio-apps.html) — browser audio architecture guidance
- [VirtualDJ forums - hardcore BPM detection](https://www.virtualdj.com/forums/29086/Wishes_and_new_features/hardcore_music_bpm_detection___.html) — BPM octave problem validation across DJ community
- [Algoriddim Neural Mix Pro](https://www.algoriddim.com/neural-mix) — stem separation in commercial DJ tools
- [ONNX Runtime NuGet v1.24.3](https://www.nuget.org/packages/Microsoft.ML.OnnxRuntime) — future .NET ML inference path
- [Time Stretching - Sound On Sound](https://www.soundonsound.com/techniques/time-stretching) — artifact characteristics, stretch ratio limits

### Tertiary (LOW confidence)
- [AI-coustics - AI hallucinations and audio](https://ai-coustics.com/2025/04/22/your-guide-to-ai-hallucinations-and-audio/) — LLM hallucination risk in music context
- [Djoid](https://www.djoid.io/) — competitive landscape (limited information available)
- [essentia.js](https://mtg.github.io/essentia.js/) — browser-side audio analysis (evaluated, not recommended for primary analysis path)

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*
