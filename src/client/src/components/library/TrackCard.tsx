import type { Track } from '@/types/track'
import { useLibraryStore } from '@/stores/libraryStore'
import { BpmDisplay } from '@/components/analysis/BpmDisplay'
import { KeyDisplay } from '@/components/analysis/KeyDisplay'
import { EnergyBar } from '@/components/analysis/EnergyBar'
import { AnalysisStatus } from '@/components/analysis/AnalysisStatus'

function TrackCardItem({ track }: { track: Track }) {
  const selectedTrackId = useLibraryStore((s) => s.selectedTrackId)
  const selectTrack = useLibraryStore((s) => s.selectTrack)
  const updateTrack = useLibraryStore((s) => s.updateTrack)

  const isSelected = track.serverId === selectedTrackId

  return (
    <div
      className={`relative rounded-lg border overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'border-neon-cyan bg-bg-elevated'
          : 'border-bg-hover bg-bg-panel hover:border-neon-cyan/30'
      }`}
      style={isSelected ? { boxShadow: '0 0 12px rgba(6, 182, 212, 0.2)' } : undefined}
      onClick={() => selectTrack(track.serverId)}
      onDoubleClick={() => selectTrack(track.serverId)}
    >
      {/* Mini waveform background placeholder */}
      <div className="h-16 bg-gradient-to-b from-bg-hover/50 to-transparent" />

      <div className="p-3 space-y-2">
        <div>
          <p className="text-sm font-medium text-gray-200 truncate">{track.title}</p>
          <p className="text-xs text-gray-500 truncate">{track.artist}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <BpmDisplay
            bpm={track.bpm}
            bpmRaw={track.bpmRaw}
            bpmCorrected={track.bpmCorrected}
            onSave={(v) => updateTrack(track.serverId, { bpm: v })}
          />
          <KeyDisplay
            keyValue={track.key}
            keyConfidence={track.keyConfidence}
            onSave={(v) => updateTrack(track.serverId, { key: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <EnergyBar
            energy={track.energy}
            onSave={(v) => updateTrack(track.serverId, { energy: v })}
          />
          <AnalysisStatus status={track.analysisStatus} />
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-600">
          <span className="truncate">{track.genrePrimary}</span>
          <span className="font-mono">{track.format.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

export function TrackCardGrid() {
  const tracks = useLibraryStore((s) => s.getFilteredTracks())

  if (tracks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 text-lg neon-shimmer bg-clip-text">
            Drop audio files here to get started
          </p>
          <p className="text-gray-600 text-sm mt-2">MP3, WAV, FLAC</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-auto h-full">
      {tracks.map((track) => (
        <TrackCardItem key={track.serverId} track={track} />
      ))}
    </div>
  )
}
