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

          // Handle download status updates (downloading/queued tracks)
          const dlStatus = status.downloadStatus
          if (dlStatus && (dlStatus === 'queued' || dlStatus === 'downloading')) {
            onUpdate(trackId, `download:${dlStatus}`, {
              downloadStatus: dlStatus,
              downloadProgress: status.downloadProgress,
              downloadEta: status.downloadEta,
            })
            continue // Still downloading, keep polling
          }

          if (dlStatus === 'error') {
            onUpdate(trackId, 'download:error', {
              downloadStatus: 'error',
              errorMessage: status.errorMessage,
            })
            get().markError(trackId)
            continue
          }

          // Download done (or was never a download) -- check analysis status
          const analysisStatus = status.analysisStatus ?? status.status
          if (analysisStatus === 'done' || analysisStatus === 'error') {
            onUpdate(trackId, analysisStatus, status.analysisResult ?? status)
            if (analysisStatus === 'done') {
              get().markComplete(trackId)
            } else {
              get().markError(trackId)
            }
          } else if (analysisStatus === 'analyzing' || analysisStatus === 'queued') {
            // Also pass download done state if applicable
            if (dlStatus === 'done') {
              onUpdate(trackId, `download:done`, { downloadStatus: 'done' })
            }
            onUpdate(trackId, analysisStatus, null)
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
