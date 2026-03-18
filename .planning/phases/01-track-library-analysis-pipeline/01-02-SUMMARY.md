---
phase: 01-track-library-analysis-pipeline
plan: 02
subsystem: api
tags: [dotnet, aspnet, channel, backgroundservice, naudio, audiowaveform, python-subprocess, concurrency, semaphore]

# Dependency graph
requires:
  - phase: 01-01
    provides: .NET scaffold with Track/Project/AnalysisResult models, Python analyzer.py
provides:
  - REST API for track upload (POST multipart), list, detail, status, audio stream, peaks, update, delete
  - REST API for project CRUD
  - Background analysis queue with Channel<T> and SemaphoreSlim(3) bounded concurrency
  - Python analyzer.py subprocess integration with JSON parsing
  - Waveform peak generation (audiowaveform CLI primary, NAudio fallback)
  - In-memory storage via ConcurrentDictionary (no database in Phase 1)
affects: [01-03, 01-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [channel-based-work-queue, semaphore-bounded-concurrency, naudio-peak-extraction, python-subprocess-integration, in-memory-store-pattern]

key-files:
  created:
    - src/server/MixGod.Api/Controllers/TracksController.cs
    - src/server/MixGod.Api/Controllers/ProjectsController.cs
    - src/server/MixGod.Api/Services/AudioStorageService.cs
    - src/server/MixGod.Api/Services/AnalysisService.cs
    - src/server/MixGod.Api/Services/PeakService.cs
    - src/server/MixGod.Api/BackgroundJobs/AnalysisQueueProcessor.cs
    - src/server/MixGod.Api/Services/TrackStore.cs
    - src/server/MixGod.Api/Services/ProjectStore.cs
    - src/server/MixGod.Api/Services/IAudioStorageService.cs
    - src/server/MixGod.Api/Services/IAnalysisService.cs
    - src/server/MixGod.Api/Services/IPeakService.cs
    - src/server/MixGod.Api/Services/ITrackStore.cs
    - src/server/MixGod.Api/Services/IProjectStore.cs
    - src/server/MixGod.Api/Models/AnalysisJob.cs
    - src/server/MixGod.Api.Tests/Controllers/TracksControllerTests.cs
    - src/server/MixGod.Api.Tests/Services/AnalysisServiceTests.cs
  modified:
    - src/server/MixGod.Api/Models/Track.cs
    - src/server/MixGod.Api/Models/Project.cs
    - src/server/MixGod.Api/Program.cs

key-decisions:
  - "Track/Project models changed from record to class with string IDs for mutable status updates"
  - "ConcurrentDictionary in-memory storage for Phase 1 -- no database, persistence via project file export"
  - "Channel.CreateUnbounded for analysis queue -- batch uploads of 30+ tracks should not block"
  - "PeakService uses audiowaveform CLI primary with NAudio fallback for Windows environments"

patterns-established:
  - "Channel<T> work queue: unbounded channel for job dispatch, ChannelReader in BackgroundService"
  - "SemaphoreSlim(3) bounded concurrency: max 3 analysis jobs run in parallel"
  - "Interface-based DI: all services have interfaces for testability with NSubstitute"
  - "Python subprocess pattern: Process.Start with stdout JSON parsing, 120s timeout with process kill"

requirements-completed: [IMPORT-01, IMPORT-04]

# Metrics
duration: 7min
completed: 2026-03-18
---

# Phase 1 Plan 2: Upload API + Analysis Queue Summary

**REST API with multipart upload, ConcurrentDictionary storage, Channel-based background analysis queue (max 3 concurrent), Python subprocess integration, and NAudio waveform peak fallback**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-18T11:52:01Z
- **Completed:** 2026-03-18T11:58:33Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Full track CRUD API: upload (multipart, batch), list, detail, status polling, audio streaming, peaks, update, delete
- Background analysis queue processor with bounded concurrency (SemaphoreSlim 3) using Channel<T>
- AnalysisService calls Python analyzer.py as subprocess, parses JSON stdout, handles timeouts
- PeakService with audiowaveform CLI primary path and NAudio peak extraction fallback
- Project CRUD endpoints for multi-project support
- 11 tests passing (5 controller, 5 analysis/queue, 1 scaffold)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing controller tests** - `18af256` (test)
2. **Task 1 GREEN: Upload API + storage implementation** - `9b53738` (feat)
3. **Task 2 RED: Failing analysis service tests** - `f5bf376` (test)
4. **Task 2 GREEN: Analysis queue + peak generation** - `b7468ec` (feat)

_TDD tasks have separate test and implementation commits._

## Files Created/Modified
- `src/server/MixGod.Api/Controllers/TracksController.cs` - POST upload, GET list/detail/status/audio/peaks, PUT update, DELETE
- `src/server/MixGod.Api/Controllers/ProjectsController.cs` - POST create, GET list/detail with track count
- `src/server/MixGod.Api/Services/AudioStorageService.cs` - Disk storage in audio-storage/{trackId}/, streaming copy, validation
- `src/server/MixGod.Api/Services/AnalysisService.cs` - Python subprocess caller with JSON parsing and 120s timeout
- `src/server/MixGod.Api/Services/PeakService.cs` - audiowaveform CLI or NAudio peak extraction fallback
- `src/server/MixGod.Api/BackgroundJobs/AnalysisQueueProcessor.cs` - BackgroundService reading Channel<AnalysisJob>, SemaphoreSlim(3)
- `src/server/MixGod.Api/Services/TrackStore.cs` - ConcurrentDictionary<string, Track> with project filtering
- `src/server/MixGod.Api/Services/ProjectStore.cs` - ConcurrentDictionary<string, Project>
- `src/server/MixGod.Api/Models/Track.cs` - Updated to class with string Id, mutable properties, FilePath, ErrorMessage
- `src/server/MixGod.Api/Models/Project.cs` - Updated to class with string Id
- `src/server/MixGod.Api/Models/AnalysisJob.cs` - Record for channel dispatch
- `src/server/MixGod.Api/Program.cs` - Full DI registration, Kestrel 500MB limit, hosted service
- `src/server/MixGod.Api.Tests/Controllers/TracksControllerTests.cs` - 5 controller tests with NSubstitute mocks
- `src/server/MixGod.Api.Tests/Services/AnalysisServiceTests.cs` - 5 analysis/queue tests including concurrency verification

## Decisions Made
- Changed Track/Project from immutable records to mutable classes with string GUIDs -- needed for status updates from background queue
- Used ConcurrentDictionary for in-memory storage (no DB in Phase 1) -- persistence handled by .mixgod project file export in Plan 04
- Unbounded channel for analysis queue -- batch uploads of 30+ tracks should enqueue immediately, not block
- PeakService tries audiowaveform CLI first, falls back to NAudio -- audiowaveform likely unavailable on Windows dev machines

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ISampleProvider not IDisposable in PeakService**
- **Found during:** Task 2 (PeakService NAudio implementation)
- **Issue:** `using var reader = CreateAudioReader()` returned ISampleProvider which doesn't implement IDisposable
- **Fix:** Changed to return WaveStream (which is IDisposable) and call ToSampleProvider() separately
- **Files modified:** src/server/MixGod.Api/Services/PeakService.cs
- **Verification:** Build succeeds, all tests pass
- **Committed in:** b7468ec (Task 2 commit)

**2. [Rule 1 - Bug] JsonReaderException vs JsonException in test assertion**
- **Found during:** Task 2 (AnalysisService tests)
- **Issue:** Assert.Throws<JsonException> fails because .NET throws JsonReaderException (a subclass)
- **Fix:** Changed to Assert.ThrowsAny<JsonException> which accepts derived types
- **Files modified:** src/server/MixGod.Api.Tests/Services/AnalysisServiceTests.cs
- **Verification:** Test passes
- **Committed in:** b7468ec (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bugs)
**Impact on plan:** Minor type-system issues, no scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
- **audiowaveform CLI** (optional): Install BBC audiowaveform for optimal waveform peak generation. If unavailable, NAudio fallback is used automatically. See https://github.com/bbc/audiowaveform/releases

## Next Phase Readiness
- Backend API fully operational for frontend integration (Plan 03)
- Upload endpoint accepts multipart files, returns track IDs, queues for analysis
- Status polling endpoint available for frontend progress display
- Audio streaming endpoint ready for browser playback via wavesurfer.js
- Peaks JSON endpoint ready for waveform visualization
- Project CRUD ready for multi-project support
- Python analyzer integration tested -- will process real audio when Essentia is installed

## Self-Check: PASSED

All 11 key files verified present. All 4 commit hashes verified in git log.

---
*Phase: 01-track-library-analysis-pipeline*
*Completed: 2026-03-18*
