import { create } from 'zustand'
import { api } from '@/services/api'

interface AnalysisState {
  pendingTrackIds: Set<string>
  totalCount: number
  completedCount: number
  isPolling: boolean
}

interface AnalysisActions {
  startPolling: (trackIds: string[], onUpdate: (trackId: string, status: string, result: unknown) => void) => void
  stopPolling: () => void
  markComplete: (trackId: string) => void
  markError: (trackId: string) => void
}

type AnalysisStore = AnalysisState & AnalysisActions

let pollingTimer: ReturnType<typeof setInterval> | null = null
let pollInterval = 2000
let consecutiveIdle = 0

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  pendingTrackIds: new Set(),
  totalCount: 0,
  completedCount: 0,
  isPolling: false,

  startPolling(trackIds, onUpdate) {
    const state = get()
    const newPending = new Set(state.pendingTrackIds)
    for (const id of trackIds) {
      newPending.add(id)
    }

    set({
      pendingTrackIds: newPending,
      totalCount: state.totalCount + trackIds.length,
      isPolling: true,
    })

    // Reset backoff
    pollInterval = 2000
    consecutiveIdle = 0

    // Clear existing timer if any
    if (pollingTimer) clearInterval(pollingTimer)

    const poll = async () => {
      const current = get()
      if (current.pendingTrackIds.size === 0) {
        consecutiveIdle++
        if (consecutiveIdle >= 3) {
          get().stopPolling()
        }
        return
      }

      consecutiveIdle = 0
      const ids = Array.from(current.pendingTrackIds)

      for (const trackId of ids) {
        try {
          const status = await api.getTrackStatus(trackId)
          if (status.analysisStatus === 'done' || status.analysisStatus === 'error') {
            onUpdate(trackId, status.analysisStatus, status.analysisResult)
            if (status.analysisStatus === 'done') {
              get().markComplete(trackId)
            } else {
              get().markError(trackId)
            }
          } else if (status.analysisStatus === 'analyzing') {
            onUpdate(trackId, status.analysisStatus, null)
          }
        } catch {
          // Network error -- keep polling
        }
      }
    }

    // Start polling immediately, then on interval
    void poll()
    pollingTimer = setInterval(() => {
      void poll()
      // Exponential backoff after initial batch
      const current = get()
      if (current.pendingTrackIds.size === 0) {
        pollInterval = Math.min(pollInterval * 1.5, 10000)
        if (pollingTimer) {
          clearInterval(pollingTimer)
          pollingTimer = setInterval(() => void poll(), pollInterval)
        }
      }
    }, pollInterval)
  },

  stopPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
    set({ isPolling: false })
  },

  markComplete(trackId) {
    const pending = new Set(get().pendingTrackIds)
    pending.delete(trackId)
    set((s) => ({
      pendingTrackIds: pending,
      completedCount: s.completedCount + 1,
    }))
  },

  markError(trackId) {
    const pending = new Set(get().pendingTrackIds)
    pending.delete(trackId)
    set({ pendingTrackIds: pending })
  },
}))
