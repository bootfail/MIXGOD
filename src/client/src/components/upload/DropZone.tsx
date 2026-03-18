import { useCallback, type ReactNode } from 'react'
import { useDropzone } from 'react-dropzone'
import { api } from '@/services/api'
import { useAnalysisStore } from '@/stores/analysisStore'

const ACCEPTED_TYPES: Record<string, string[]> = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/flac': ['.flac'],
  'audio/x-flac': ['.flac'],
}

interface DropZoneProps {
  children: ReactNode
  onTracksUploaded?: (tracks: { serverId: string; title: string }[]) => void
}

export function DropZone({ children, onTracksUploaded }: DropZoneProps) {
  const startPolling = useAnalysisStore((s) => s.startPolling)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    try {
      const tracks = await api.uploadTracks(acceptedFiles)

      onTracksUploaded?.(tracks.map((t) => ({ serverId: t.serverId, title: t.title })))

      const trackIds = tracks.map((t) => t.serverId)
      startPolling(trackIds, (_trackId, _status, _result) => {
        // Updates will be handled by the library store subscriber
      })
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }, [onTracksUploaded, startPolling])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    noClick: true,
    noKeyboard: true,
  })

  return (
    <div {...getRootProps()} className="relative flex-1 flex flex-col min-h-0">
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-primary/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-dashed border-neon-cyan"
            style={{ boxShadow: '0 0 24px rgba(6, 182, 212, 0.3), inset 0 0 24px rgba(6, 182, 212, 0.1)' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-neon-cyan glow-pulse">
              <path d="M24 6v28M14 24l10 10 10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 36v4a4 4 0 004 4h24a4 4 0 004-4v-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="text-xl font-semibold text-neon-cyan">Drop tracks here</p>
            <p className="text-sm text-gray-400">MP3, WAV, FLAC</p>
          </div>
        </div>
      )}

      {children}

      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={open}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-bg-elevated text-gray-300 hover:text-neon-cyan border border-bg-hover hover:border-neon-cyan/50 transition-all"
          style={{ boxShadow: '0 0 8px rgba(6, 182, 212, 0)' }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 8px rgba(6, 182, 212, 0.3)' }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 8px rgba(6, 182, 212, 0)' }}
        >
          Browse files
        </button>
      </div>
    </div>
  )
}
