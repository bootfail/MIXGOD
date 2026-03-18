import { describe, it, expect, vi } from 'vitest'

// Mock Dexie to avoid IndexedDB in test environment
vi.mock('dexie', () => {
  class MockTable {
    private items: Record<string, unknown>[] = []
    async add(item: unknown) { this.items.push(item as Record<string, unknown>); return this.items.length }
    async bulkAdd(items: unknown[]) { this.items.push(...(items as Record<string, unknown>[])) }
    async get(id: number) { return this.items[id - 1] }
    async toArray() { return this.items }
    where() { return { equals: () => ({ toArray: async () => this.items, delete: async () => {} }) } }
    async update(_id: number, data: unknown) { Object.assign(this.items[0] ?? {}, data) }
    async delete() {}
  }
  class MockDexie {
    projects = new MockTable()
    tracks = new MockTable()
    playlists = new MockTable()
    version() { return { stores: () => {} } }
  }
  return { default: MockDexie }
})

describe('Database', () => {
  it('creates MixGodDB instance without error', async () => {
    const { db } = await import('./db')
    expect(db).toBeDefined()
    expect(db.projects).toBeDefined()
    expect(db.tracks).toBeDefined()
    expect(db.playlists).toBeDefined()
  })

  it('exportProject returns valid JSON with project, tracks, playlists keys', async () => {
    const { exportProject, db } = await import('./db')
    // Seed a project
    await db.projects.add({ name: 'Test', createdAt: new Date(), updatedAt: new Date() })

    const json = await exportProject(1)
    const parsed = JSON.parse(json)
    expect(parsed).toHaveProperty('version', 1)
    expect(parsed).toHaveProperty('project')
    expect(parsed).toHaveProperty('tracks')
    expect(parsed).toHaveProperty('playlists')
    expect(parsed.project.name).toBe('Test')
  })

  it('exported JSON does not contain audio data', async () => {
    const { exportProject, db } = await import('./db')
    await db.projects.add({ name: 'Test2', createdAt: new Date(), updatedAt: new Date() })

    const json = await exportProject(1)
    // Should not contain base64 audio or large binary
    expect(json.length).toBeLessThan(10000)
    expect(json).not.toContain('data:audio')
  })

  it('trackToRecord and recordToTrack roundtrip preserves data', async () => {
    const { trackToRecord, recordToTrack } = await import('./db')
    const track = {
      serverId: 'abc',
      title: 'Test',
      artist: 'Artist',
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
    }

    const record = trackToRecord(track, 1)
    expect(record.projectId).toBe(1)
    expect(record.serverId).toBe('abc')

    const roundtripped = recordToTrack({ ...record, id: 1 })
    expect(roundtripped.serverId).toBe(track.serverId)
    expect(roundtripped.bpm).toBe(track.bpm)
    expect(roundtripped.bpmCorrected).toBe(true)
  })
})
