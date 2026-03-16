# Architecture Research

**Domain:** AI-powered audio mixing workstation (web-based)
**Researched:** 2026-03-16
**Confidence:** MEDIUM-HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Timeline     │  │  Waveform    │  │  Transport   │              │
│  │  Editor       │  │  Renderer    │  │  Controls    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                      │
│  ┌──────┴─────────────────┴──────────────────┴───────┐              │
│  │              Zustand State Store                   │              │
│  │  (project, tracks, mix plan, playback state)       │              │
│  └──────────────────────┬────────────────────────────┘              │
│                         │                                           │
│  ┌──────────────────────┴────────────────────────────┐              │
│  │           Web Audio Engine (Tone.js)               │              │
│  │  Players / Gains / Effects / Crossfades            │              │
│  └───────────────────────────────────────────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│                   REST API + SignalR Hub                             │
├─────────────────────────────────────────────────────────────────────┤
│                     .NET BACKEND (ASP.NET Core)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Project      │  │  Audio       │  │  Mix          │              │
│  │  Service      │  │  Pipeline    │  │  Engine       │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                      │
│  ┌──────┴─────────────────┴──────────────────┴───────┐              │
│  │              Background Job Queue                  │              │
│  │  (analysis, stem separation, final render)         │              │
│  └──────────────────────┬────────────────────────────┘              │
├─────────────────────────┼───────────────────────────────────────────┤
│                         │                                           │
│  ┌──────────────┐  ┌────┴─────────┐  ┌──────────────┐              │
│  │  SQL Server   │  │  File Store  │  │  AI Services │              │
│  │  (metadata)   │  │  (audio)     │  │  (Python)    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Timeline Editor | Visual multi-track arrangement, drag/drop, transition editing | React + custom Canvas/SVG components |
| Waveform Renderer | Waveform visualization per track, zoom, scroll | wavesurfer.js with React wrapper (@wavesurfer/react) |
| Transport Controls | Play/pause/seek, global timeline position | React component controlling Tone.js Transport |
| Zustand State Store | All UI state: project, tracks, mix plan, playback position | Zustand with slices pattern for separation |
| Web Audio Engine | Browser-side audio playback, crossfades, effects preview | Tone.js wrapping Web Audio API |
| Project Service | CRUD for projects, tracks, mix plans, user settings | ASP.NET Core controllers + EF Core |
| Audio Pipeline | File processing: decode, analyze, waveform generation, render | NAudio + FFmpeg (via CLI wrapper) |
| Mix Engine | Combine tracks with transitions, effects, final render | NAudio ISampleProvider chain + FFmpeg export |
| Background Job Queue | Long-running tasks: analysis, stem separation, render | .NET BackgroundService or Hangfire |
| AI Services | Stem separation (Demucs), BPM/key detection (Essentia) | Python sidecar service with REST API |
| File Store | Audio file storage (originals, stems, renders, waveform data) | Local filesystem initially, Azure Blob later |
| SQL Server | Project metadata, track metadata, analysis results, mix plans | EF Core + SQL Server |

## Recommended Project Structure

### Frontend (React)

```
src/
├── components/
│   ├── timeline/          # Timeline editor components
│   │   ├── Timeline.tsx           # Main timeline container
│   │   ├── TrackLane.tsx          # Individual track lane
│   │   ├── TransitionPoint.tsx    # Transition marker/editor
│   │   └── EnergyCurve.tsx        # Energy wave overlay
│   ├── waveform/          # Waveform rendering
│   │   ├── WaveformView.tsx       # wavesurfer.js wrapper
│   │   └── MiniMap.tsx            # Overview waveform
│   ├── transport/         # Playback controls
│   ├── mixer/             # Per-track gain/EQ/FX controls
│   └── upload/            # Track upload + import UI
├── audio/
│   ├── engine.ts          # Tone.js audio engine singleton
│   ├── players.ts         # Multi-track player management
│   ├── effects.ts         # Effect node definitions
│   └── crossfade.ts       # Transition audio logic
├── stores/
│   ├── projectStore.ts    # Project + tracks state
│   ├── mixPlanStore.ts    # Track order, transitions, energy curve
│   ├── playbackStore.ts   # Transport state (position, playing, etc.)
│   └── uiStore.ts         # Zoom, scroll, selected track, panels
├── api/
│   ├── client.ts          # Axios/fetch base client
│   ├── projectApi.ts      # Project CRUD
│   ├── audioApi.ts        # Upload, analysis status, waveform data
│   └── signalr.ts         # SignalR connection for progress updates
├── hooks/
│   ├── useAudioEngine.ts  # Hook wrapping audio engine
│   ├── useWaveformData.ts # Fetch + cache waveform data
│   └── useJobProgress.ts  # SignalR job progress hook
└── types/
    └── index.ts           # Shared TypeScript types
```

### Backend (.NET)

```
src/
├── MixGod.Api/                    # ASP.NET Core Web API
│   ├── Controllers/
│   │   ├── ProjectController.cs
│   │   ├── TrackController.cs
│   │   ├── MixController.cs
│   │   └── RenderController.cs
│   ├── Hubs/
│   │   └── JobProgressHub.cs      # SignalR hub for progress
│   ├── Program.cs
│   └── appsettings.json
├── MixGod.Core/                   # Domain models + interfaces
│   ├── Models/
│   │   ├── Project.cs
│   │   ├── Track.cs
│   │   ├── MixPlan.cs
│   │   ├── Transition.cs
│   │   └── AnalysisResult.cs
│   └── Interfaces/
│       ├── IAudioPipeline.cs
│       ├── IMixEngine.cs
│       └── IAiService.cs
├── MixGod.Audio/                  # Audio processing library
│   ├── Pipeline/
│   │   ├── AudioDecoder.cs        # Decode any format to PCM
│   │   ├── WaveformGenerator.cs   # Generate waveform peaks data
│   │   └── AudioAnalyzer.cs       # Wrapper for AI analysis calls
│   ├── Mixing/
│   │   ├── MixRenderer.cs         # Combine tracks into final mix
│   │   ├── CrossfadeProvider.cs   # ISampleProvider for crossfades
│   │   ├── EffectChain.cs         # FX processing chain
│   │   └── TimeStretch.cs         # BPM matching via SoundTouch
│   └── Export/
│       └── FfmpegExporter.cs      # Final render via FFmpeg CLI
├── MixGod.Jobs/                   # Background job definitions
│   ├── AnalyzeTrackJob.cs
│   ├── SeparateStemsJob.cs
│   ├── GenerateMixPlanJob.cs
│   └── RenderMixJob.cs
├── MixGod.Data/                   # EF Core data layer
│   ├── MixGodDbContext.cs
│   └── Migrations/
└── MixGod.AiClient/              # HTTP client for Python AI service
    ├── DemucsClient.cs
    ├── EssentiaClient.cs
    └── LlmClient.cs
```

### Python AI Sidecar

```
ai-service/
├── app.py                         # FastAPI application
├── routes/
│   ├── stems.py                   # Demucs stem separation endpoint
│   ├── analysis.py                # BPM, key, energy, waveform peaks
│   └── health.py
├── services/
│   ├── demucs_service.py          # Demucs model wrapper
│   ├── essentia_service.py        # Essentia analysis wrapper
│   └── model_cache.py             # Keep models loaded in memory
├── requirements.txt
└── Dockerfile
```

### Structure Rationale

- **MixGod.Audio/ separate from API:** Audio processing is CPU-intensive with its own dependency tree (NAudio, FFmpeg). Keeping it in a dedicated library allows independent testing and potential extraction to a worker service later.
- **MixGod.Jobs/ separate:** Background jobs are the backbone -- analysis takes seconds, stem separation takes minutes, rendering takes minutes. Clean separation lets you swap job infrastructure (BackgroundService to Hangfire) without touching business logic.
- **Python AI sidecar:** Demucs and Essentia are Python-native. Running them in a separate FastAPI service avoids Python-.NET interop pain. Communicates via HTTP. Can run on GPU if available.
- **Zustand slices on frontend:** A DAW-like editor has deeply interconnected but logically separable state. Zustand's slice pattern keeps stores focused without Redux boilerplate.

## Architectural Patterns

### Pattern 1: Hybrid Audio Architecture (Browser Preview + Server Render)

**What:** Browser uses Web Audio API (via Tone.js) for real-time preview playback. Server uses NAudio + FFmpeg for high-quality final renders. Both work from the same MixPlan data structure.

**When to use:** Always -- this is the core architectural decision.

**Trade-offs:**
- PRO: Instant preview feedback without server round-trips
- PRO: Server render can use higher quality algorithms (better time-stretching, no browser memory limits)
- CON: Two audio engines means potential audible differences between preview and final render
- CON: Must maintain two implementations of effects/crossfades

**Mitigation for consistency:** Keep the browser preview "good enough" -- focus accuracy effort on the server render. Users accept that preview is approximate (like video editing software). The MixPlan JSON is the single source of truth, not the audio output.

```
MixPlan (JSON) ──> Browser: Tone.js interprets -> instant playback
                └─> Server: NAudio/FFmpeg interprets -> WAV/MP3 file
```

### Pattern 2: Background Job Pipeline with SignalR Progress

**What:** Long-running audio tasks (analysis, stem separation, rendering) run as background jobs. SignalR pushes progress updates to the browser in real-time.

**When to use:** Any operation taking > 2 seconds.

**Trade-offs:**
- PRO: Non-blocking UI, user can continue editing while jobs run
- PRO: Jobs can be queued, retried, parallelized
- CON: Added complexity of job state management

**Example:**
```csharp
// Backend: Job reports progress via SignalR
public class AnalyzeTrackJob
{
    private readonly IHubContext<JobProgressHub> _hub;

    public async Task ExecuteAsync(Guid trackId, CancellationToken ct)
    {
        await _hub.Clients.Group($"project:{projectId}")
            .SendAsync("JobProgress", new { trackId, step = "bpm", progress = 0.3 });

        var bpm = await _analyzer.DetectBpm(audioPath, ct);

        await _hub.Clients.Group($"project:{projectId}")
            .SendAsync("JobProgress", new { trackId, step = "key", progress = 0.6 });

        var key = await _analyzer.DetectKey(audioPath, ct);
    }
}
```

```typescript
// Frontend: Hook consumes SignalR progress
function useJobProgress(projectId: string) {
  const connection = useSignalR();
  const updateTrack = useProjectStore(s => s.updateTrackAnalysis);

  useEffect(() => {
    connection.on("JobProgress", (data) => {
      updateTrack(data.trackId, data.step, data.progress);
    });
  }, [connection]);
}
```

### Pattern 3: Waveform Data Pre-computation

**What:** When a track is uploaded, the server generates a compact waveform peaks array (e.g., ~20 peaks per second of audio) and stores it alongside the audio file. The frontend fetches this lightweight JSON to render waveforms instantly via wavesurfer.js, without decoding audio in the browser.

**When to use:** Always -- decoding full audio files in the browser for waveform display is too slow for a multi-track editor.

**Trade-offs:**
- PRO: Instant waveform display, tiny data transfer (~few KB per track)
- PRO: Consistent waveform appearance regardless of browser
- CON: Extra processing step on upload (but trivial compared to analysis)

**Example:**
```csharp
// Server generates peaks data during upload processing
public float[] GeneratePeaks(string audioPath, int peaksPerSecond = 20)
{
    using var reader = new AudioFileReader(audioPath);
    var samplesPerPeak = reader.WaveFormat.SampleRate / peaksPerSecond;
    var peaks = new List<float>();
    var buffer = new float[samplesPerPeak];
    int read;
    while ((read = reader.Read(buffer, 0, buffer.Length)) > 0)
    {
        peaks.Add(buffer.Take(read).Max(Math.Abs));
    }
    return peaks.ToArray();
}
```

### Pattern 4: MixPlan as Single Source of Truth

**What:** The entire mix is described by a `MixPlan` JSON document -- track order, start times, transition types, effect parameters, energy curve. Both frontend preview and backend render consume this same document. No audio state lives outside the mix plan.

**When to use:** Always -- this is what makes the hybrid architecture work.

**Trade-offs:**
- PRO: Undo/redo is trivial (snapshot MixPlan history)
- PRO: Save/load is trivial (serialize/deserialize JSON)
- PRO: AI can generate or modify the MixPlan directly
- CON: MixPlan schema must be carefully designed upfront -- changes ripple to both renderers

**Core data model:**
```typescript
interface MixPlan {
  id: string;
  name: string;
  targetDurationMinutes: number;
  energyCurve: EnergyPoint[];     // user-defined energy targets
  entries: MixEntry[];
  transitions: Transition[];
}

interface MixEntry {
  id: string;
  trackId: string;
  startTime: number;              // seconds from mix start
  endTime: number;
  playbackRate: number;           // for BPM matching (e.g., 1.02)
  gainDb: number;
  effects: EffectInstance[];
  stemMask: StemMask;             // which stems to use (all, vocals-only, etc.)
}

interface Transition {
  fromEntryId: string;
  toEntryId: string;
  type: 'crossfade' | 'cut' | 'echo-out' | 'filter-sweep' | 'mashup';
  durationBeats: number;
  parameters: Record<string, number>;  // type-specific params
}

interface EnergyPoint {
  timeSeconds: number;
  energyLevel: number;            // 0-1 scale
  label?: string;                 // "buildup", "drop", "breathe"
}
```

### Pattern 5: Shared File Storage with Path-Based Handoff

**What:** Audio files, stems, and peaks stored on a shared filesystem accessible by both .NET and Python services. Services communicate file locations, not file contents.

**When to use:** For local development and single-server deployment.

**Why:** Avoids transferring multi-MB audio files over HTTP between services. Both services read/write the same directory.

```
/storage/
  /projects/{projectId}/
    /tracks/{trackId}/
      original.mp3
      decoded.wav               # normalized PCM for processing
      peaks.json                # waveform visualization data
      analysis.json             # BPM, key, energy, genre
      /stems/
        vocals.wav
        drums.wav
        bass.wav
        other.wav
    /renders/
      mix-{timestamp}.wav
      mix-{timestamp}.mp3
    project.json                # full project state backup
```

## Data Flow

### Track Upload and Analysis Flow

```
[User drops audio files]
    |
[React Upload Component] --chunked upload--> [TrackController]
    |                                            |
[Show upload progress]                    [Save to File Store]
                                                 |
                                          [Queue AnalyzeTrackJob]
                                                 |
                                    +------------+---------------+
                                    |                            |
                          [WaveformGenerator]          [AI Service call]
                          (NAudio -> peaks JSON)       (Essentia: BPM, key, energy)
                                    |                            |
                          [Store peaks in              [Store analysis in
                           File Store]                  SQL Server]
                                    |                            |
                                    +------------+---------------+
                                                 |
                                    [SignalR -> "track ready"]
                                                 |
                                    [Frontend fetches metadata +
                                     waveform, displays track]
```

### AI Mix Planning Flow

```
[User clicks "Generate Mix"]
    |
[Frontend sends track list + energy curve preference]
    |
[MixController] -> [Queue GenerateMixPlanJob]
    |
[Job collects analysis data for all tracks from DB]
    |
[LLM API call with structured prompt:]
    - Track metadata (BPM, key, energy, genre, duration)
    - Energy curve preference (golven pattern)
    - Transition style preferences
    - Camelot wheel rules for harmonic mixing
    |
[LLM returns structured JSON: track order + transition suggestions]
    |
[Job enriches with computed values:]
    - Exact start/end times based on BPM and beat grids
    - Playback rate adjustments for BPM matching
    - Crossfade durations in beats
    - Validates: no impossible BPM jumps, no key clashes
    |
[Store MixPlan in DB]
    |
[SignalR -> "mix plan ready"]
    |
[Frontend loads MixPlan into Zustand store -> Timeline renders]
```

### Preview Playback Flow

```
[User hits Play]
    |
[playbackStore.play()] -> [Tone.js Transport.start()]
    |
[Transport schedules events from MixPlan:]
    - Track Players start at correct offsets
    - Gain automation for crossfades
    - Effect nodes activated/deactivated
    |
[Audio flows through Web Audio graph:]
    Player(track1) -> Gain -> Effects -+
    Player(track2) -> Gain -> Effects -+-> Master Gain -> Destination
    Player(track3) -> Gain -> Effects -+
    |
[requestAnimationFrame loop updates:]
    - Playback position -> timeline cursor
    - Waveform scroll position
    - Active track highlighting
```

### Final Render Flow

```
[User clicks "Export Mix"]
    |
[RenderController] -> [Queue RenderMixJob]
    |
[MixRenderer reads MixPlan from DB]
    |
[For each MixEntry:]
    - Load audio file (original or specific stems)
    - Apply time-stretch if playbackRate != 1.0 (SoundTouch via NAudio)
    - Build ISampleProvider chain: source -> effects -> gain
    |
[Combine all entries with MixingSampleProvider]
    - Offset each entry to its startTime
    - Crossfade overlapping regions via custom CrossfadeProvider
    |
[Write to intermediate WAV via NAudio]
    |
[FFmpeg: WAV -> final format (MP3 320kbps / WAV / FLAC)]
    - Apply loudness normalization (-14 LUFS for party playback)
    - Add metadata tags
    |
[Store rendered file in File Store]
    |
[SignalR -> "render complete" with download URL]
```

### State Management Architecture

```
+------------------------------------------------+
|              Zustand Store (sliced)             |
|                                                |
|  projectSlice: { tracks, metadata }            |
|  mixPlanSlice: { entries, transitions, curve } |
|  playbackSlice: { position, playing, loop }    |
|  uiSlice: { zoom, scroll, selection, panels }  |
|                                                |
|  +------------------------------------------+  |
|  |          Undo/Redo Middleware             |  |
|  |  (snapshots of mixPlanSlice only)        |  |
|  +------------------------------------------+  |
+------------------------------------------------+
         | subscribe              ^ dispatch
    +----+----+              +----+----+
    | React   |              | User    |
    | Comps   |              | Actions |
    +---------+              +---------+
```

**Key state management decisions:**

- **Zustand over Redux:** Less boilerplate, native async support, selector-based re-render control. Critical for a DAW where playback position updates 60 times/sec but should not re-render the whole timeline.
- **Playback state uses refs, not store:** The playback cursor position updates via `requestAnimationFrame`. Storing this in Zustand would trigger 60 re-renders/sec. Instead, use `useRef` for the cursor position and only update Zustand when the user seeks or playback stops.
- **Undo/redo on mixPlanSlice only:** Track data and UI state do not need undo. Only mix arrangement changes (track order, transition edits, effect changes) get snapshots.

### Key Data Flows Summary

1. **Upload flow:** File -> chunked upload -> server stores -> background analysis -> SignalR notifies -> frontend displays track
2. **Edit flow:** User action -> Zustand mutation (with undo snapshot) -> React re-renders timeline -> Web Audio engine reads updated plan
3. **Preview flow:** Play command -> Tone.js Transport reads mix plan -> schedules audio nodes -> audio output + position updates
4. **Render flow:** Export command -> background job reads mix plan -> NAudio builds ISampleProvider chain -> FFmpeg encodes -> download ready
5. **AI flow:** Generate command -> collect analysis data -> LLM structured output -> validate + enrich -> store as MixPlan

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single user (MVP) | Everything on one machine. SQL Server LocalDB or SQLite. Files on local disk. Python sidecar via Docker or direct process. |
| Small team / 5 users | SQL Server proper. Shared file store (network drive). Hangfire for reliable job queue with dashboard. |
| SaaS / 100+ users | Azure Blob Storage for files with SAS tokens. Azure Service Bus for job queue. Python AI service scaled independently. CDN for waveform data. |

### Scaling Priorities

1. **First bottleneck: Stem separation compute.** Demucs is GPU-hungry and takes 2-5 minutes per track on CPU. For MVP: accept the wait. Next step: run Python service on a GPU machine or use a cloud API (Replicate has a hosted Demucs endpoint).
2. **Second bottleneck: Concurrent renders.** Each render holds significant memory (full decoded audio of all tracks in the mix). For MVP: one render at a time with a queue. Next step: render queue with max concurrency of 1, additional renders wait.
3. **Third bottleneck: File storage.** A 30-track project with stems generates ~5-10GB of audio files. For MVP: local disk is fine. Next step: Azure Blob Storage with SAS tokens for direct browser download.

**Important:** MIXGOD is a personal tool for the foreseeable future. Do not over-engineer for multi-tenancy or horizontal scaling. The architecture supports it later (add blob storage, containerize Python service) but do not build it now.

## Anti-Patterns

### Anti-Pattern 1: Decoding Full Audio in the Browser for Waveforms

**What people do:** Use Web Audio API's `decodeAudioData()` to decode each track in the browser, then render waveforms from the raw sample data.
**Why it's wrong:** For a 30-track mix, this means decoding gigabytes of audio in browser memory. Tabs crash. Performance degrades.
**Do this instead:** Pre-compute waveform peaks on the server during upload. Send only the peaks array (a few KB per track) to the frontend. Use wavesurfer.js with pre-computed peaks.

### Anti-Pattern 2: Streaming Full Audio Through the .NET API

**What people do:** Route all audio file downloads through .NET API controller actions.
**Why it's wrong:** Audio files are large (5-50MB each). Streaming them through your API ties up threads and adds latency.
**Do this instead:** Serve audio files as static files (via `UseStaticFiles` middleware or a separate file server). Return direct URLs to the frontend. The API only handles metadata.

### Anti-Pattern 3: Trying to Make Preview Sound Identical to Render

**What people do:** Spend enormous effort ensuring the browser preview sounds exactly like the server render.
**Why it's wrong:** Browser audio (44.1kHz, limited DSP) will never perfectly match server-side processing (arbitrary sample rate, professional-grade time-stretching, loudness normalization). Chasing parity is an infinite time sink.
**Do this instead:** Accept that preview is "directionally accurate." Focus on timing and transitions being correct. Let the server render handle audio quality. Optionally add a "preview render" feature later that renders a short section server-side for spot-checking.

### Anti-Pattern 4: Monolithic State Store

**What people do:** Put all application state in one flat Redux/Zustand store without separation.
**Why it's wrong:** Timeline editors have high-frequency state updates (playback position at 60fps, cursor, scroll). Mixing these with low-frequency state (project metadata, mix plan) causes excessive re-renders and UI jank.
**Do this instead:** Use Zustand's slice pattern. Keep playback animation state in `useRef`. Use selectors to subscribe only to specific state slices per component.

### Anti-Pattern 5: Running Demucs Inside the .NET Process

**What people do:** Try to call Python from C# via IronPython, Python.NET, or subprocess spawning.
**Why it's wrong:** Demucs requires PyTorch with CUDA support. Managing Python environments from .NET is fragile. Memory leaks, version conflicts, deployment nightmares.
**Do this instead:** Run a separate Python FastAPI service. Call it via HTTP from .NET. Containerize with Docker for reproducible environments. This also lets you run the AI service on a GPU machine independently.

### Anti-Pattern 6: Storing Audio Binary Data in the Database

**What people do:** Store WAV/MP3 binary data as BLOBs in SQL Server.
**Why it's wrong:** Bloats database, slow queries, backup nightmare. A 30-track project with stems = 5-10 GB of audio.
**Do this instead:** Store file paths/references in the database. Audio on the filesystem. Database holds metadata only.

### Anti-Pattern 7: Building Custom Audio DSP

**What people do:** Write their own mixing engine, effects, or time-stretching algorithms from scratch.
**Why it's wrong:** Audio DSP is deep expertise. Months of work for worse quality than existing libraries.
**Do this instead:** Use NAudio's `MixingSampleProvider`, `FadeInOutSampleProvider`. Use SoundTouch (via NAudio wrapper) for time-stretching. Use FFmpeg for encoding. Use Tone.js effects for preview.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| LLM API (OpenAI/Claude) | HTTP from .NET, structured JSON output | Use for track ordering, transition strategy, energy curve matching. Prompt includes analysis metadata. |
| Demucs (stem separation) | HTTP to Python sidecar | GPU-accelerated if available. 2-5 min per track on CPU. Max 1 concurrent job. |
| Essentia (audio analysis) | HTTP to Python sidecar | BPM (RhythmExtractor2013), key, energy, genre detection. Fast -- seconds per track. |
| FFmpeg | CLI invocation from .NET | Final render encoding, format conversion, loudness normalization. |
| Replicate API (optional) | HTTP from .NET | Cloud-hosted Demucs as alternative to local Python sidecar. Pay-per-use. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React <-> .NET API | REST (CRUD) + SignalR (progress/events) | REST for commands and queries, SignalR for async job feedback |
| .NET API <-> Background Jobs | In-process queue (Channel<T> or Hangfire) | Jobs must be idempotent for retry safety |
| .NET API <-> Python AI Service | HTTP (REST) | Keep interface simple: input file path, output results JSON. Shared file store. |
| .NET API <-> File Store | Direct filesystem I/O | Abstract behind IFileStore interface for later Azure Blob migration |
| React <-> File Store | Direct HTTP fetch via static file serving | Audio files and waveform peaks fetched directly, not through API controllers |
| React <-> Web Audio | Tone.js wraps Web Audio API | Audio engine is a singleton outside React lifecycle, not React state |

## Build Order (Dependencies)

The architecture implies this build sequence. Each step depends on the ones before it.

| Phase | What | Depends On | Enables |
|-------|------|------------|---------|
| 1 | Project data model + API + React shell + file upload | Nothing | Everything |
| 2 | Audio analysis pipeline: Python sidecar + background jobs + SignalR | Phase 1 (tracks exist) | AI mix planning, informed ordering |
| 3 | Waveform display: server-side peak generation + wavesurfer.js | Phase 1 (audio files exist) | Visual timeline editor |
| 4 | Timeline editor: track arrangement, transitions, energy curve | Phase 3 (visual feedback) | MixPlan data structure |
| 5 | Browser preview: Tone.js engine, multi-track playback | Phase 4 (MixPlan to play) | Iterative editing with audio |
| 6 | AI mix planning: LLM integration for generating MixPlans | Phase 2 + Phase 4 (analysis data + MixPlan schema) | Core value proposition |
| 7 | Stem separation: Demucs integration | Phase 2 (Python sidecar), Phase 4 (MixPlan supports stemMask) | Mashup capabilities |
| 8 | Server-side render: NAudio mix engine + FFmpeg export | Phase 4-6 (stable MixPlan schema) | Final exportable mix |

**Critical path for the boat party deadline:** Phases 1-2-3-4-5-6-8. Stem separation (Phase 7) can be deferred if time is tight -- mashups are a "nice to have" for the first mix.

## Sources

- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Tone.js](https://tonejs.github.io/)
- [wavesurfer.js](https://wavesurfer.xyz/)
- [@wavesurfer/react - npm](https://www.npmjs.com/package/@wavesurfer/react)
- [NAudio - GitHub](https://github.com/naudio/NAudio)
- [NAudio Wave Stream Architecture](https://markheath.net/post/naudio-wave-stream-architecture)
- [NAudio Audio Processing - DeepWiki](https://deepwiki.com/naudio/NAudio/6-audio-processing)
- [Demucs - Facebook Research](https://github.com/facebookresearch/demucs)
- [Demucs ONNX Conversion - Mixxx GSOC 2025](https://mixxx.org/news/2025-10-27-gsoc2025-demucs-to-onnx-dhunstack/)
- [Demucs on Replicate](https://replicate.com/cjwbw/demucs)
- [Essentia - Audio Analysis Library](https://essentia.upf.edu/)
- [Essentia.js - Web Audio Analysis](https://transactions.ismir.net/articles/10.5334/tismir.111)
- [SignalR Real-Time with ASP.NET Core + React](https://medium.com/@wmukhtar/how-to-implement-signalr-with-asp-net-core-and-react-js-for-real-time-web-apps-3a4ab8186f76)
- [Zustand - State Management](https://github.com/pmndrs/zustand)
- [GridSound DAW - Browser DAW Reference](https://github.com/gridsound/daw)
- [WAM Studio - Web Audio DAW Research](https://dl.acm.org/doi/fullHtml/10.1145/3543873.3587987)
- [Large File Uploads with Azure Blob Storage](https://reintech.io/blog/handling-large-file-uploads-azure-blob-storage)

---
*Architecture research for: AI-powered audio mixing workstation (MIXGOD)*
*Researched: 2026-03-16*
