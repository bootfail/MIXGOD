import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlayerBar } from './PlayerBar'

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
        togglePlay: vi.fn(),
        setVolume: vi.fn(),
        toggleMute: vi.fn(),
        getCurrentTrack: () => undefined,
      }
      return selector(state)
    }),
    {
      getState: vi.fn(() => ({
        seek: vi.fn(),
        togglePlay: vi.fn(),
        setVolume: vi.fn(),
        toggleMute: vi.fn(),
        getCurrentTrack: () => undefined,
      })),
      subscribe: vi.fn(() => vi.fn()),
    }
  ),
}))

describe('PlayerBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders disabled state when no track selected', () => {
    render(<PlayerBar />)
    expect(screen.getByText('No track selected')).toBeInTheDocument()
  })

  it('shows play button when track is loaded', async () => {
    const { usePlayerStore } = await import('@/stores/playerStore')
    vi.mocked(usePlayerStore).mockImplementation((selector) => {
      const state = {
        currentTrackId: 'track-1',
        isPlaying: false,
        currentTime: 30,
        duration: 180,
        volume: 0.8,
        isMuted: false,
        togglePlay: vi.fn(),
        setVolume: vi.fn(),
        toggleMute: vi.fn(),
        getCurrentTrack: () => ({ title: 'Test Track', artist: 'Test Artist' }),
      }
      return selector(state as never)
    })

    render(<PlayerBar />)
    expect(screen.getByText('Test Track')).toBeInTheDocument()
    expect(screen.getByText('Test Artist')).toBeInTheDocument()
  })

  it('displays time in m:ss format', async () => {
    const { usePlayerStore } = await import('@/stores/playerStore')
    vi.mocked(usePlayerStore).mockImplementation((selector) => {
      const state = {
        currentTrackId: 'track-1',
        isPlaying: true,
        currentTime: 83,
        duration: 240,
        volume: 0.8,
        isMuted: false,
        togglePlay: vi.fn(),
        setVolume: vi.fn(),
        toggleMute: vi.fn(),
        getCurrentTrack: () => ({ title: 'Track', artist: 'Artist' }),
      }
      return selector(state as never)
    })

    render(<PlayerBar />)
    expect(screen.getByText('1:23')).toBeInTheDocument()
    expect(screen.getByText('4:00')).toBeInTheDocument()
  })

  it('renders volume slider', async () => {
    const { usePlayerStore } = await import('@/stores/playerStore')
    vi.mocked(usePlayerStore).mockImplementation((selector) => {
      const state = {
        currentTrackId: 'track-1',
        isPlaying: false,
        currentTime: 0,
        duration: 100,
        volume: 0.8,
        isMuted: false,
        togglePlay: vi.fn(),
        setVolume: vi.fn(),
        toggleMute: vi.fn(),
        getCurrentTrack: () => ({ title: 'Track', artist: 'Artist' }),
      }
      return selector(state as never)
    })

    const { container } = render(<PlayerBar />)
    const sliders = container.querySelectorAll('input[type="range"]')
    expect(sliders.length).toBe(2) // seek + volume
  })
})
