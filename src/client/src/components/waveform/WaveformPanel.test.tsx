import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WaveformPanel } from './WaveformPanel'

// Mock wavesurfer.js dynamic import
vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn(() => ({
      on: vi.fn(),
      destroy: vi.fn(),
      load: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      isPlaying: vi.fn(() => false),
      setVolume: vi.fn(),
      setTime: vi.fn(),
      getDuration: vi.fn(() => 0),
      setOptions: vi.fn(),
    })),
  },
}))

// Mock stores
vi.mock('@/stores/libraryStore', () => ({
  useLibraryStore: vi.fn((selector) => {
    const state = {
      selectedTrackId: null,
      tracks: [],
    }
    return selector(state)
  }),
}))

vi.mock('@/stores/playerStore', () => ({
  usePlayerStore: Object.assign(
    vi.fn((selector) => {
      const state = {
        currentTrackId: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 0.8,
        isMuted: false,
      }
      return selector(state)
    }),
    {
      getState: vi.fn(() => ({
        onTimeUpdate: vi.fn(),
        onDurationChange: vi.fn(),
        onTrackEnd: vi.fn(),
        seek: vi.fn(),
      })),
      subscribe: vi.fn(() => vi.fn()),
    }
  ),
}))

vi.mock('@/services/api', () => ({
  api: {
    getTrackAudioUrl: vi.fn(() => 'http://localhost/audio'),
    getTrackPeaks: vi.fn(() => Promise.resolve({ data: [] })),
  },
}))

describe('WaveformPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no track selected', () => {
    render(<WaveformPanel />)
    expect(screen.getByText('Select a track to view waveform')).toBeInTheDocument()
  })

  it('renders track info when track is selected', async () => {
    const { useLibraryStore } = await import('@/stores/libraryStore')
    vi.mocked(useLibraryStore).mockImplementation((selector) => {
      const state = {
        selectedTrackId: 'track-1',
        tracks: [{
          serverId: 'track-1',
          title: 'Test Track',
          artist: 'Test Artist',
          energy: 5,
          bpm: 150,
          bpmRaw: 75,
          bpmCorrected: true,
          key: 'Am',
          keyConfidence: 0.9,
          genrePrimary: 'Hardstyle',
          genreSecondary: null,
          genreConfidence: 0.8,
          duration: 300,
          format: 'mp3',
          bitrate: 320,
          sampleRate: 44100,
          dateAdded: new Date(),
          filename: 'test.mp3',
          peaksUrl: '',
          analysisStatus: 'done' as const,
          analysisConfidence: 0.9,
          userOverrides: {},
        }],
      }
      return selector(state as never)
    })

    render(<WaveformPanel />)
    expect(screen.getByText('Test Track')).toBeInTheDocument()
    expect(screen.getByText('Test Artist')).toBeInTheDocument()
  })

  it('shows time display in monospace format', async () => {
    const { useLibraryStore } = await import('@/stores/libraryStore')
    vi.mocked(useLibraryStore).mockImplementation((selector) => {
      const state = {
        selectedTrackId: 'track-1',
        tracks: [{
          serverId: 'track-1',
          title: 'Track',
          artist: 'Artist',
          energy: 5,
          bpm: 120, bpmRaw: 120, bpmCorrected: false, key: 'C',
          keyConfidence: 0.9, genrePrimary: 'House', genreSecondary: null,
          genreConfidence: 0.8, duration: 180, format: 'mp3', bitrate: 320,
          sampleRate: 44100, dateAdded: new Date(), filename: 'test.mp3',
          peaksUrl: '', analysisStatus: 'done' as const, analysisConfidence: 0.9,
          userOverrides: {},
        }],
      }
      return selector(state as never)
    })

    render(<WaveformPanel />)
    expect(screen.getByText('0:00 / 0:00')).toBeInTheDocument()
  })
})
