import { useCallback } from 'react'
import { usePlayerStore } from '@/stores/playerStore'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6 4l10 6-10 6z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="5" y="4" width="3" height="12" rx="0.5" />
      <rect x="12" y="4" width="3" height="12" rx="0.5" />
    </svg>
  )
}

function VolumeIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 6h2.5l3.5-3v10l-3.5-3H2z" fill="currentColor" />
        <path d="M12 5l-4 6m0-6l4 6" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 6h2.5l3.5-3v10l-3.5-3H2z" fill="currentColor" />
      <path d="M11 5.5a3 3 0 010 5" />
      <path d="M13 3.5a6 6 0 010 9" />
    </svg>
  )
}

export function PlayerBar() {
  const currentTrackId = usePlayerStore((s) => s.currentTrackId)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const isMuted = usePlayerStore((s) => s.isMuted)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleMute = usePlayerStore((s) => s.toggleMute)
  const track = usePlayerStore((s) => s.getCurrentTrack())

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    usePlayerStore.getState().seek(time)
    const seekFn = (window as unknown as Record<string, unknown>).__wavesurferSeek as ((t: number) => void) | undefined
    seekFn?.(time)
  }, [])

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value))
  }, [setVolume])

  if (!currentTrackId) {
    return (
      <div className="h-16 bg-bg-elevated border-t border-bg-hover flex items-center justify-center shrink-0">
        <span className="text-gray-600 text-sm">No track selected</span>
      </div>
    )
  }

  return (
    <div className="h-16 bg-bg-elevated border-t border-bg-hover flex items-center px-4 gap-4 shrink-0"
      style={{ boxShadow: '0 -1px 8px rgba(6, 182, 212, 0.05)' }}>
      {/* Left: Track info */}
      <div className="w-48 min-w-0 shrink-0">
        <div className="text-sm text-gray-200 font-medium truncate">{track?.title ?? 'Unknown'}</div>
        <div className="text-xs text-gray-500 truncate">{track?.artist ?? ''}</div>
      </div>

      {/* Center: Controls */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-full text-gray-300 hover:text-neon-cyan transition-colors hover:bg-bg-hover"
            onClick={togglePlay}
            style={{ boxShadow: isPlaying ? '0 0 12px rgba(6, 182, 212, 0.3)' : 'none' }}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>
        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="font-mono text-[10px] text-gray-500 w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 accent-neon-magenta cursor-pointer"
          />
          <span className="font-mono text-[10px] text-gray-500 w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="text-gray-400 hover:text-neon-cyan transition-colors"
          onClick={toggleMute}
        >
          <VolumeIcon muted={isMuted} />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={handleVolume}
          className="w-20 h-1 accent-neon-cyan cursor-pointer"
        />
      </div>
    </div>
  )
}
