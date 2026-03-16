# Technology Stack

**Project:** MIXGOD - AI-Powered Mixing Workstation
**Researched:** 2026-03-16

## Recommended Stack

### Core Application

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| .NET | 10.0 | Backend API, audio render pipeline | User's primary stack, latest LTS, excellent perf | HIGH |
| React | 18.x / 19.x | Frontend SPA | User has strong experience, ecosystem for audio viz | HIGH |
| TypeScript | 5.x | Frontend type safety | Non-negotiable for a complex audio UI with many state interactions | HIGH |
| Python | 3.11+ | Audio analysis microservice (BPM, key, stems) | ML/audio ecosystem is Python-native; fighting it from C# wastes weeks | HIGH |

### Audio Analysis (Python Microservice)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Essentia | 2.1-beta6 | BPM detection, key detection, energy analysis | Industry-standard MIR library. RhythmExtractor2013 for BPM, Key algorithm with HPCP for key detection. Supports EDM-specific key profiles (`edmm`). TempoCNN model for ML-based tempo | HIGH |
| librosa | 0.10.x | Secondary analysis, beat tracking, chroma features | Battle-tested on millions of songs. `beat_track()` for tempo, chroma for harmonic analysis. Complements Essentia | HIGH |
| madmom | 0.17.x | Beat/downbeat tracking for complex genres | Superior beat tracking with RNN models. Critical for hardstyle/frenchcore where Essentia may detect half/double-time | MEDIUM |
| Demucs v4 (htdemucs) | 4.0 | Stem separation (vocals/drums/bass/other) | State-of-the-art, MIT license, 9.20 dB SDR on MUSDB18-HQ. htdemucs_ft for higher quality at 4x processing time | HIGH |
| pydub | 0.25.x | Audio file loading, format conversion, simple manipulation | High-level API, handles MP3/WAV/FLAC transparently | HIGH |
| soundfile | 0.12.x | WAV/FLAC I/O with numpy arrays | Low-overhead file I/O for analysis pipelines | HIGH |

### Audio Processing (Server-Side Render - .NET)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| NAudio | 2.2.1 | Audio stream mixing, effects, WAV manipulation | .NET's standard audio library. MixingSampleProvider for multi-track mixing, ISampleProvider pipeline for effects chain | HIGH |
| FFMpegCore | 5.4.0 | Final audio export (MP3/WAV/FLAC), format conversion | Fluent API, async support, .NET Standard. Wraps FFmpeg for high-quality encoding | HIGH |
| Microsoft.ML.OnnxRuntime | 1.24.3 | ML model inference from .NET (future: stem separation in-process) | Enables running Demucs ONNX models directly in .NET. GSOC 2025 project converting Demucs v4 to ONNX is underway | MEDIUM |

### Browser Audio (Preview Playback)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tone.js | 15.x | Web Audio framework for playback, transport, effects | High-level DAW-like API: global Transport for sync, Players for multi-track, built-in effects (reverb, filter, delay). Official React integration guide | HIGH |
| essentia.js | 0.1.3 | Client-side audio analysis (quick BPM/key preview) | WebAssembly-powered Essentia in browser. Useful for instant feedback before server analysis completes | LOW |

### Waveform Visualization (React)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| wavesurfer.js | 7.12.x | Waveform rendering, regions, timeline | Dominant library. Canvas-based, zoom, regions plugin for transition markers, timeline plugin. Pre-decoded peaks for large files | HIGH |
| @wavesurfer/react | 1.0.12 | Official React hooks wrapper | First-party React integration with event subscriptions via props | HIGH |

**Decision: NOT waveform-playlist.** While naomiaro/waveform-playlist is a full multitrack editor, it imposes its own UI paradigm. MIXGOD needs a custom timeline where AI proposes transitions. Better to compose wavesurfer.js instances into a custom timeline component.

### AI / Mix Intelligence

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| OpenAI GPT-4o / Claude API | Latest | Mix strategy: track ordering, transition type selection, energy flow planning | LLM excels at reasoning about energy curves, genre compatibility, "golven" pattern. Provide structured audio metadata as context | MEDIUM |
| Custom rule engine (.NET) | N/A | Harmonic mixing rules, BPM compatibility, transition constraints | Camelot wheel logic, BPM range constraints, transition duration rules. Deterministic, not ML | HIGH |

**Architecture decision:** The LLM suggests a mix strategy (track order, transition types, energy arc). The rule engine validates and constrains it (no 100->180 BPM jump without intermediate steps, harmonic compatibility check). The user then refines in the visual editor.

### Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| SQL Server | Latest | Project storage, track metadata, mix state | User's existing stack, EF Core integration | HIGH |
| SignalR | .NET 10 built-in | Real-time progress updates (analysis, render) | Push stem separation progress, render progress to UI. Already in .NET | HIGH |
| Background worker / Hangfire | Latest | Long-running jobs (stem separation, render) | Stem separation takes minutes per track. Needs proper job queue | HIGH |

## Architecture: Python Microservice Communication

The Python analysis service communicates with .NET via one of:

**Recommended: HTTP API (FastAPI)**
- Python runs as a separate FastAPI service
- .NET calls it via HttpClient for analysis jobs
- Simple, debuggable, language-agnostic
- FastAPI 0.100+ with Pydantic v2 for request/response models

**Alternative: Process invocation**
- .NET spawns Python scripts via `Process.Start()`
- Simpler for dev, fragile for production
- Acceptable for MVP if time-constrained

**NOT recommended: gRPC**
- Overhead not justified for batch audio analysis jobs
- Audio files transferred via shared filesystem, not over wire

## Handling Extreme BPM Ranges (100-180+ BPM)

This is a critical technical challenge for MIXGOD. The genre spread demands specific handling:

### The Half-Time / Double-Time Problem

BPM detectors frequently report wrong octaves:
- A 150 BPM hardstyle track might be detected as 75 BPM (half-time)
- A 100 BPM party track might be detected as 200 BPM (double-time)
- Frenchcore at 190 BPM might register as 95 BPM

**Solution: Multi-algorithm consensus with genre hints**

```
1. Run Essentia RhythmExtractor2013 -> BPM candidates
2. Run Essentia TempoCNN -> ML-based BPM
3. Run madmom BeatTrackingProcessor -> RNN-based beats
4. If algorithms disagree, use genre hint (user-tagged or auto-classified)
   to select the correct octave
5. Store both "detected BPM" and "effective BPM" (after octave correction)
```

### Genre-Specific BPM Ranges

| Genre | Expected BPM | Common Detection Errors |
|-------|-------------|----------------------|
| Dutch party / latin | 95-115 | May double to 190-230 |
| House / dance | 120-130 | Generally accurate |
| Urban / pop | 90-110 | May double |
| Hardstyle | 140-155 | May halve to 70-78 |
| Raw hardstyle | 148-160 | May halve |
| Hardcore | 160-180 | May halve to 80-90 |
| Frenchcore / uptempo | 180-220 | Frequently halved to 90-110 |

### Transition BPM Bridging

For large BPM gaps (e.g., 110 party -> 150 hardstyle):
- Gradual tempo ramp over 16-32 bars
- Use a "bridge track" at intermediate BPM
- Mashup technique: vocals from slow track over instrumental buildup at higher BPM
- Energy break: full stop -> rebuild at new BPM (dramatic genre switch)

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Audio analysis | Essentia + librosa (Python) | Essentia.js (browser) | Server-side analysis is more reliable, handles large files, can leverage GPU. Browser analysis useful only for quick preview |
| Stem separation | Demucs v4 (Python) | Spleeter | Demucs significantly outperforms Spleeter. Spleeter is deprecated/unmaintained |
| Stem separation | Demucs v4 (Python) | ONNX in .NET | ONNX conversion is in-progress (GSOC 2025). Not production-ready yet. Start with Python, migrate later |
| Audio render | NAudio + FFMpegCore (.NET) | Python render | Keep render in .NET to share audio graph logic with the API. NAudio's mixing engine is adequate for non-realtime rendering |
| Browser audio | Tone.js | Raw Web Audio API | Tone.js abstracts scheduling, transport sync, effects. Raw API is too low-level for a DAW-like preview |
| Waveform viz | wavesurfer.js | peaks.js | wavesurfer.js has larger community, better plugin ecosystem, official React wrapper. peaks.js (BBC) is good but less active |
| Waveform viz | wavesurfer.js | waveform-playlist | waveform-playlist is opinionated about UI. MIXGOD needs custom AI-driven timeline, not a generic multitrack editor |
| Job queue | Hangfire | Azure Service Bus | Local-first tool, no cloud dependency needed. Hangfire dashboard useful for monitoring |
| Mix AI | LLM + rule engine | Pure ML model | No training data for "golven" pattern or Dutch party -> hardstyle transitions. LLM + rules is pragmatic and fast to build |

## What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| Spleeter | Outdated, significantly worse quality than Demucs. Abandoned by Deezer |
| Web Audio API directly | Too low-level for DAW-like functionality. Use Tone.js |
| Blazor | Project constraint is React. Blazor would be natural for .NET but user has React experience and the audio/viz ecosystem is JavaScript-native |
| Python for everything | Tempting for ML/audio, but the render pipeline and API belong in .NET for performance and to match user expertise |
| Electron / desktop wrapper | Web-first per requirements. Browser can handle preview playback fine |

## Installation

### Backend (.NET)

```bash
# Core project
dotnet new webapi -n MixGod.Api
cd MixGod.Api

# Audio processing
dotnet add package NAudio --version 2.2.1
dotnet add package FFMpegCore --version 5.4.0

# ML inference (future stem separation)
dotnet add package Microsoft.ML.OnnxRuntime --version 1.24.3

# Database
dotnet add package Microsoft.EntityFrameworkCore.SqlServer

# Job processing
dotnet add package Hangfire
dotnet add package Hangfire.SqlServer

# SignalR (included in ASP.NET Core)
```

### Python Analysis Service

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Core analysis
pip install essentia==2.1b6.dev1  # or latest available
pip install librosa==0.10.2
pip install madmom==0.17.1

# Stem separation
pip install demucs==4.0.1

# Audio I/O
pip install pydub==0.25.1
pip install soundfile==0.12.1

# API
pip install fastapi==0.115.0
pip install uvicorn==0.30.0
pip install python-multipart  # for file uploads
```

### Frontend (React)

```bash
# Create project
npx create-vite@latest mixgod-ui --template react-ts
cd mixgod-ui

# Audio playback & framework
npm install tone@15

# Waveform visualization
npm install wavesurfer.js@7
npm install @wavesurfer/react@1

# State management
npm install zustand  # lightweight, good for complex audio state

# UI components (user preference for rich components)
npm install @mui/material @emotion/react @emotion/styled
```

## Sources

- [Essentia documentation](https://essentia.upf.edu/) - Audio analysis library
- [Essentia key detection](https://essentia.upf.edu/tutorial_tonal_hpcpkeyscale.html) - HPCP and key algorithm
- [essentia.js](https://mtg.github.io/essentia.js/) - WebAssembly audio analysis
- [Demucs GitHub](https://github.com/facebookresearch/demucs) - Stem separation
- [Demucs ONNX conversion (GSOC 2025)](https://mixxx.org/news/2025-10-27-gsoc2025-demucs-to-onnx-dhunstack/) - ONNX export project
- [demucs.onnx C++ implementation](https://github.com/sevagh/demucs.onnx) - ONNX inference reference
- [NAudio GitHub](https://github.com/naudio/NAudio) - .NET audio library
- [NAudio NuGet](https://www.nuget.org/packages/NAudio/) - Version 2.2.1 (note: earlier search showed 2.3.0 also available)
- [FFMpegCore GitHub](https://github.com/rosenbjerg/FFMpegCore) - .NET FFmpeg wrapper
- [FFMpegCore NuGet](https://www.nuget.org/packages/FFMpegCore) - Version 5.4.0
- [Tone.js](https://tonejs.github.io/) - Web Audio framework
- [Tone.js React integration](https://github.com/Tonejs/Tone.js/wiki/Using-Tone.js-with-React) - Official guide
- [wavesurfer.js](https://wavesurfer.xyz/) - Waveform visualization
- [@wavesurfer/react](https://www.npmjs.com/package/@wavesurfer/react) - Official React wrapper
- [waveform-playlist](https://github.com/naomiaro/waveform-playlist) - Multitrack editor (evaluated, not recommended)
- [ONNX Runtime NuGet](https://www.nuget.org/packages/Microsoft.ML.OnnxRuntime) - Version 1.24.3
- [ONNX Runtime C# API](https://onnxruntime.ai/docs/api/csharp-api.html) - .NET bindings
- [madmom GitHub](https://github.com/CPJKU/madmom) - Beat tracking library
- [Spleeter vs Demucs comparison](https://stemsplit.io/blog/spleeter-vs-demucs) - Quality comparison
