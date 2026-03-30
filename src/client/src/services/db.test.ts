import { describe, it, expect, vi } from 'vitest'

// Mock Dexie to prevent IndexedDB initialization
vi.mock('dexie', () => ({
  default: class MockDexie {
    version() { return { stores: () => {} } }
  },
}))

describe('Database', () => {
  it('creates MixGodDB instance without error', async () => {
    const { db } = await import('./db')
    expect(db).toBeDefined()
  })

  it('trackToRecord converts Track to TrackRecord with projectId', async () => {
    const { trackToRecord } = await import('./db')
    const track = {
      serverId: 'abc',
      title: 'Test Track',
      artist: 'Test Artist',
      bpm: 150,
      bpmRaw: 75,
      bpmCorrected: true,
      key: 'Am',
      keyConfidence: 0.9,
      energy: 7,
      genrePrimary: 'Hardstyle',
      genreSecondary: null,
      genreConfidence: 0.85,
      duration: 300,
      format: 'mp3',
      bitrate: 320,
      sampleRate: 44100,
      dateAdded: new Date('2026-01-01'),
      filename: 'test.mp3',
      peaksUrl: '/peaks/abc',
      analysisStatus: 'done' as const,
      analysisConfidence: 0.9,
      userOverrides: {},
      sourceType: 'upload' as const,
      downloadStatus: 'none' as const,
    }

    const record = trackToRecord(track, 42)
    expect(record.projectId).toBe(42)
    expect(record.serverId).toBe('abc')
    expect(record.title).toBe('Test Track')
    expect(record.bpmCorrected).toBe(true)
    // Should NOT include audio binary data
    expect(record).not.toHaveProperty('audioData')
  })

  it('recordToTrack converts TrackRecord back to Track', async () => {
    const { recordToTrack } = await import('./db')
    const record = {
      id: 1,
      projectId: 42,
      serverId: 'abc',
      title: 'Test Track',
      artist: 'Test Artist',
      bpm: 150,
      bpmRaw: 75,
      bpmCorrected: true,
      key: 'Am',
      keyConfidence: 0.9,
      energy: 7,
      genrePrimary: 'Hardstyle',
      genreSecondary: null,
      genreConfidence: 0.85,
      duration: 300,
      format: 'mp3',
      bitrate: 320,
      sampleRate: 44100,
      dateAdded: new Date('2026-01-01'),
      filename: 'test.mp3',
      peaksUrl: '/peaks/abc',
      analysisStatus: 'done',
      analysisConfidence: 0.9,
      userOverrides: {},
    }

    const track = recordToTrack(record)
    expect(track.serverId).toBe('abc')
    expect(track.bpm).toBe(150)
    expect(track.bpmCorrected).toBe(true)
    expect(track.dateAdded).toBeInstanceOf(Date)
    expect(track.analysisStatus).toBe('done')
  })

  it('trackToRecord and recordToTrack roundtrip preserves all fields', async () => {
    const { trackToRecord, recordToTrack } = await import('./db')
    const original = {
      serverId: 'xyz-123',
      title: 'Roundtrip',
      artist: 'Artist',
      bpm: 170,
      bpmRaw: 85,
      bpmCorrected: true,
      key: 'C#m',
      keyConfidence: 0.95,
      energy: 9,
      genrePrimary: 'Frenchcore',
      genreSecondary: 'Hardcore',
      genreConfidence: 0.8,
      duration: 240,
      format: 'wav',
      bitrate: 1411,
      sampleRate: 48000,
      dateAdded: new Date('2026-03-15'),
      filename: 'roundtrip.wav',
      peaksUrl: '/peaks/xyz',
      analysisStatus: 'done' as const,
      analysisConfidence: 0.92,
      userOverrides: { bpm: 171 },
      sourceType: 'youtube' as const,
      downloadStatus: 'done' as const,
      sourceUrl: 'https://youtube.com/watch?v=abc',
      thumbnailUrl: 'http://localhost:5267/api/tracks/xyz/thumbnail',
    }

    const record = trackToRecord(original, 1)
    const roundtripped = recordToTrack({ ...record, id: 99 })

    expect(roundtripped.serverId).toBe(original.serverId)
    expect(roundtripped.bpm).toBe(original.bpm)
    expect(roundtripped.bpmRaw).toBe(original.bpmRaw)
    expect(roundtripped.key).toBe(original.key)
    expect(roundtripped.energy).toBe(original.energy)
    expect(roundtripped.genreSecondary).toBe('Hardcore')
    expect(roundtripped.userOverrides).toEqual({ bpm: 171 })
  })
})
