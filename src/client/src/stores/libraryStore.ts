import { create } from 'zustand'
import type { Track } from '@/types/track'
import type { SmartPlaylist, FilterPreset } from '@/types/project'

interface LibraryState {
  tracks: Track[]
  selectedTrackId: string | null
  viewMode: 'table' | 'card'
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  activePlaylistId: number | null
  searchQuery: string
  playlists: SmartPlaylist[]
}

interface LibraryActions {
  addTracks: (tracks: Track[]) => void
  updateTrack: (serverId: string, updates: Partial<Track>) => void
  removeTrack: (serverId: string) => void
  selectTrack: (serverId: string | null) => void
  setViewMode: (mode: 'table' | 'card') => void
  setSorting: (column: string, direction: 'asc' | 'desc') => void
  setSearch: (query: string) => void
  setActivePlaylist: (id: number | null) => void
  updateAnalysisResult: (serverId: string, result: Partial<Track>) => void
  addPlaylist: (playlist: SmartPlaylist) => void
  removePlaylist: (id: number) => void
  getFilteredTracks: () => Track[]
}

type LibraryStore = LibraryState & LibraryActions

function applyFilter(track: Track, filter: FilterPreset): boolean {
  const value = track[filter.field as keyof Track]
  const target = filter.value

  switch (filter.operator) {
    case 'eq': return value === target
    case 'neq': return value !== target
    case 'gt': return typeof value === 'number' && value > (target as number)
    case 'gte': return typeof value === 'number' && value >= (target as number)
    case 'lt': return typeof value === 'number' && value < (target as number)
    case 'lte': return typeof value === 'number' && value <= (target as number)
    case 'contains':
      return typeof value === 'string' && value.toLowerCase().includes((target as string).toLowerCase())
    case 'in':
      return Array.isArray(target) && target.includes(String(value))
    default: return true
  }
}

function matchesSearch(track: Track, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    track.title.toLowerCase().includes(q) ||
    track.artist.toLowerCase().includes(q) ||
    track.genrePrimary.toLowerCase().includes(q) ||
    track.filename.toLowerCase().includes(q)
  )
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  tracks: [],
  selectedTrackId: null,
  viewMode: 'table',
  sortColumn: 'title',
  sortDirection: 'asc',
  activePlaylistId: null,
  searchQuery: '',
  playlists: [],

  addTracks(newTracks) {
    set((s) => ({
      tracks: [
        ...s.tracks,
        ...newTracks.filter((t) => !s.tracks.some((e) => e.serverId === t.serverId)),
      ],
    }))
  },

  updateTrack(serverId, updates) {
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.serverId === serverId ? { ...t, ...updates } : t
      ),
    }))
  },

  removeTrack(serverId) {
    set((s) => ({
      tracks: s.tracks.filter((t) => t.serverId !== serverId),
      selectedTrackId: s.selectedTrackId === serverId ? null : s.selectedTrackId,
    }))
  },

  selectTrack(serverId) {
    set({ selectedTrackId: serverId })
  },

  setViewMode(mode) {
    set({ viewMode: mode })
  },

  setSorting(column, direction) {
    set({ sortColumn: column, sortDirection: direction })
  },

  setSearch(query) {
    set({ searchQuery: query })
  },

  setActivePlaylist(id) {
    set({ activePlaylistId: id })
  },

  updateAnalysisResult(serverId, result) {
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.serverId === serverId ? { ...t, ...result, analysisStatus: 'done' as const } : t
      ),
    }))
  },

  addPlaylist(playlist) {
    set((s) => ({ playlists: [...s.playlists, playlist] }))
  },

  removePlaylist(id) {
    set((s) => ({
      playlists: s.playlists.filter((p) => p.id !== id),
      activePlaylistId: s.activePlaylistId === id ? null : s.activePlaylistId,
    }))
  },

  getFilteredTracks() {
    const state = get()
    let filtered = state.tracks

    // Apply search
    if (state.searchQuery) {
      filtered = filtered.filter((t) => matchesSearch(t, state.searchQuery))
    }

    // Apply active playlist filters
    if (state.activePlaylistId !== null) {
      const playlist = state.playlists.find((p) => p.id === state.activePlaylistId)
      if (playlist) {
        filtered = filtered.filter((t) =>
          playlist.filters.every((f) => applyFilter(t, f))
        )
      }
    }

    // Apply sorting
    const { sortColumn, sortDirection } = state
    filtered.sort((a, b) => {
      const aVal = a[sortColumn as keyof Track]
      const bVal = b[sortColumn as keyof Track]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      let cmp = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal)
      } else if (aVal instanceof Date && bVal instanceof Date) {
        cmp = aVal.getTime() - bVal.getTime()
      } else {
        cmp = Number(aVal) - Number(bVal)
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })

    return filtered
  },
}))
