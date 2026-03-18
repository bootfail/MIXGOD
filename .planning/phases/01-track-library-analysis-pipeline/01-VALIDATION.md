---
phase: 1
slug: track-library-analysis-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (Frontend)** | Vitest 3.x + @testing-library/react |
| **Framework (Backend)** | xUnit 2.x + NSubstitute |
| **Framework (Python)** | pytest 8.x |
| **Config file (Frontend)** | vitest.config.ts (Wave 0) |
| **Config file (Backend)** | MixGod.Api.Tests.csproj (Wave 0) |
| **Quick run command (FE)** | `npx vitest run --reporter=verbose` |
| **Quick run command (BE)** | `dotnet test MixGod.Api.Tests` |
| **Full suite command** | `npm run test && dotnet test && pytest analysis/tests/` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run relevant quick command (FE/BE/Python depending on task)
- **After every plan wave:** Run `npm run test && dotnet test && pytest analysis/tests/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | (infra) | setup | `npx vitest run` | Wave 0 | ⬜ pending |
| 01-01-02 | 01 | 1 | IMPORT-01 | integration | `npx vitest run src/components/upload/DropZone.test.tsx` | Wave 0 | ⬜ pending |
| 01-01-03 | 01 | 1 | IMPORT-04 | integration | `dotnet test --filter "BatchUpload"` | Wave 0 | ⬜ pending |
| 01-02-01 | 02 | 1 | ANALYSIS-01 | unit | `pytest analysis/tests/test_bpm.py -x` | Wave 0 | ⬜ pending |
| 01-02-02 | 02 | 1 | ANALYSIS-02 | unit | `pytest analysis/tests/test_key.py -x` | Wave 0 | ⬜ pending |
| 01-02-03 | 02 | 1 | ANALYSIS-03 | unit | `pytest analysis/tests/test_energy.py -x` | Wave 0 | ⬜ pending |
| 01-02-04 | 02 | 1 | ANALYSIS-04 | unit | `pytest analysis/tests/test_genre.py -x` | Wave 0 | ⬜ pending |
| 01-03-01 | 03 | 2 | EDIT-01 | integration | `npx vitest run src/components/waveform/WaveformPanel.test.tsx` | Wave 0 | ⬜ pending |
| 01-03-02 | 03 | 2 | EDIT-05 | integration | `npx vitest run src/components/player/PlayerBar.test.tsx` | Wave 0 | ⬜ pending |
| 01-03-03 | 03 | 2 | EXPORT-03 | unit + integration | `npx vitest run src/services/db.test.ts` | Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration for React frontend
- [ ] `src/client/src/test/setup.ts` — Testing library setup (jsdom, cleanup)
- [ ] `MixGod.Api.Tests/MixGod.Api.Tests.csproj` — xUnit test project
- [ ] `analysis/tests/conftest.py` — pytest fixtures (sample audio files, expected results)
- [ ] `analysis/tests/test_bpm.py` — BPM detection + octave correction test stubs
- [ ] `analysis/tests/test_key.py` — Key detection test stubs
- [ ] `analysis/tests/test_energy.py` — Energy score normalization test stubs
- [ ] `analysis/tests/test_genre.py` — Genre classification + taxonomy mapping test stubs
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
- [ ] Framework install: `pip install pytest`
- [ ] Sample audio test fixtures: small MP3/WAV snippets with known BPM/key

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full-page drag overlay appears on drag | IMPORT-01 | Browser drag event simulation limited | 1. Drag a file over the page 2. Verify overlay with "Drop tracks here" appears |
| Waveform energy coloring looks correct | EDIT-01 | Visual quality is subjective | 1. Load a track with clear energy sections 2. Verify blue→orange→red gradient matches energy |
| Neon glow effects on hover/active | (theme) | CSS visual effects hard to assert | 1. Hover over interactive elements 2. Verify glow effects are visible and correct colors |
| DAW panel resize feels natural | (layout) | UX feel cannot be automated | 1. Drag panel borders 2. Verify smooth resize with no jank |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
