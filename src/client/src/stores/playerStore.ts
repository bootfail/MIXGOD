import { create } from 'zustand'
import { useLibraryStore } from '@/stores/libraryStore'
import type { Track } from '@/types/track'

interface PlayerState {
  currentTrackId: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
}

interface PlayerActions {
  play: (trackId?: string) => void
  pause: () => void
  togglePlay: () => void
  seek: (time: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  onTimeUpdate: (time: number) => void
  onDurationChange: (duration: number) => void
  onTrackEnd: () => void
  getCurrentTrack: () => Track | undefined
}

type PlayerStore = PlayerState & PlayerActions

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrackId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,

  play(trackId) {
    if (trackId) {
      set({ currentTrackId: trackId, isPlaying: true, currentTime: 0 })
    } else {
      set({ isPlaying: true })
    }
  },

  pause() {
    set({ isPlaying: false })
  },

  togglePlay() {
    const state = get()
    if (!state.currentTrackId) {
      // Play selected track from library
      const selectedId = useLibraryStore.getState().selectedTrackId
      if (selectedId) {
        set({ currentTrackId: selectedId, isPlaying: true, currentTime: 0 })
      }
      return
    }
    set({ isPlaying: !state.isPlaying })
  },

  seek(time) {
    set({ currentTime: time })
  },

  setVolume(v) {
    set({ volume: Math.max(0, Math.min(1, v)), isMuted: false })
  },

  toggleMute() {
    set((s) => ({ isMuted: !s.isMuted }))
  },

  onTimeUpdate(time) {
    set({ currentTime: time })
  },

  onDurationChange(duration) {
    set({ duration })
  },

  onTrackEnd() {
    set({ isPlaying: false, currentTime: 0 })
  },

  getCurrentTrack() {
    const { currentTrackId } = get()
    if (!currentTrackId) return undefined
    return useLibraryStore.getState().tracks.find((t) => t.serverId === currentTrackId)
  },
}))
