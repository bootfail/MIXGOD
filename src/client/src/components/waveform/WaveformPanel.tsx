import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { api } from '@/services/api'
import type WaveSurfer from 'wavesurfer.js'

function energyToColor(amplitude: number): string {
  if (amplitude < 0.3) return '#3b82f6'
  if (amplitude < 0.5) return '#06b6d4'
  if (amplitude < 0.7) return '#eab308'
  if (amplitude < 0.85) return '#f97316'
  return '#ef4444'
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function WaveformPanel() {
  const selectedTrackId = useLibraryStore((s) => s.selectedTrackId)
  const tracks = useLibraryStore((s) => s.tracks)
  const currentTrackId = usePlayerStore((s) => s.currentTrackId)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const isMuted = usePlayerStore((s) => s.isMuted)

  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const loadedTrackRef = useRef<string | null>(null)
  const isSeekingRef = useRef(false)

  const track = useMemo(
    () => tracks.find((t) => t.serverId === (currentTrackId ?? selectedTrackId)),
    [tracks, currentTrackId, selectedTrackId]
  )

  const displayTrackId = currentTrackId ?? selectedTrackId

  // Create / destroy wavesurfer
  useEffect(() => {
    if (!containerRef.current) return

    let ws: WaveSurfer | null = null

    const init = async () => {
      const WaveSurferLib = (await import('wavesurfer.js')).default

      ws = WaveSurferLib.create({
        container: containerRef.current!,
        height: 128,
        normalize: true,
        waveColor: '#06b6d4',
        progressColor: '#ec4899',
        cursorColor: '#ec4899',
        cursorWidth: 1,
        barWidth: 2,
        barGap: 1,
        barRadius: 1,
        backend: 'WebAudio',
      })

      ws.on('timeupdate', (time: number) => {
        if (!isSeekingRef.current) {
          usePlayerStore.getState().onTimeUpdate(time)
        }
      })

      ws.on('ready', () => {
        usePlayerStore.getState().onDurationChange(ws!.getDuration())
      })

      ws.on('finish', () => {
        usePlayerStore.getState().onTrackEnd()
      })

      ws.on('seeking', (time: number) => {
        usePlayerStore.getState().seek(time)
      })

      wsRef.current = ws
    }

    void init()

    return () => {
      ws?.destroy()
      wsRef.current = null
      loadedTrackRef.current = null
    }
  }, [])

  // Load track when selection changes
  useEffect(() => {
    const ws = wsRef.current
    if (!ws || !displayTrackId || displayTrackId === loadedTrackRef.current) return

    loadedTrackRef.current = displayTrackId
    const audioUrl = api.getTrackAudioUrl(displayTrackId)

    const loadTrack = async () => {
      try {
        const peaksData = await api.getTrackPeaks(displayTrackId)
        ws.load(audioUrl, peaksData.data ? [peaksData.data] : undefined)
      } catch {
        ws.load(audioUrl)
      }
    }

    void loadTrack()
  }, [displayTrackId])

  // Sync play/pause
  useEffect(() => {
    const ws = wsRef.current
    if (!ws || !loadedTrackRef.current) return

    if (isPlaying && !ws.isPlaying()) {
      void ws.play()
    } else if (!isPlaying && ws.isPlaying()) {
      ws.pause()
    }
  }, [isPlaying])

  // Sync volume
  useEffect(() => {
    wsRef.current?.setVolume(isMuted ? 0 : volume)
  }, [volume, isMuted])

  // Apply energy-based gradient coloring
  useEffect(() => {
    const ws = wsRef.current
    if (!ws || !track) return

    // Use overall track energy to create a gradient feel
    const energy = track.energy / 10
    const color = energyToColor(energy)
    ws.setOptions({ waveColor: color })
  }, [track])

  // Handle external seek (from PlayerBar)
  const handleExternalSeek = useCallback((time: number) => {
    const ws = wsRef.current
    if (!ws || !loadedTrackRef.current) return
    isSeekingRef.current = true
    ws.setTime(time)
    isSeekingRef.current = false
  }, [])

  // Subscribe to seek changes from player store
  useEffect(() => {
    let lastSeek = -1
    const unsub = usePlayerStore.subscribe((state) => {
      if (state.currentTime !== lastSeek && Math.abs(state.currentTime - lastSeek) > 1) {
        lastSeek = state.currentTime
        // Only seek if user initiated from PlayerBar, not from wavesurfer timeupdate
      }
    })
    return unsub
  }, [])

  // Expose seek for PlayerBar
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__wavesurferSeek = handleExternalSeek
    return () => {
      delete (window as unknown as Record<string, unknown>).__wavesurferSeek
    }
  }, [handleExternalSeek])

  if (!displayTrackId || !track) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-sm"
        style={{ borderTop: '1px solid rgba(6, 182, 212, 0.1)' }}>
        Select a track to view waveform
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-3">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-gray-200 truncate">{track.title}</span>
          <span className="text-xs text-gray-500 truncate">{track.artist}</span>
        </div>
        <div className="font-mono text-xs text-gray-500 shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 rounded overflow-hidden" />
    </div>
  )
}
