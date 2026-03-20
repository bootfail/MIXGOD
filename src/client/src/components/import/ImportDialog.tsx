import { useState, useMemo, useCallback } from 'react'
import { validateUrl, type SourcePlatform } from '@/utils/urlValidation'
import { api } from '@/services/api'
import { useLibraryStore } from '@/stores/libraryStore'
import { useAnalysisStore } from '@/stores/analysisStore'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
}

interface ParsedUrl {
  raw: string
  trimmed: string
  platform: SourcePlatform | null
}

function PlatformBadge({ platform }: { platform: SourcePlatform }) {
  if (platform === 'youtube') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.9 31.9 0 000 12a31.9 31.9 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.9 31.9 0 0024 12a31.9 31.9 0 00-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
        </svg>
        YouTube
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.5-.8 1-1.4 1.1-3.1.6-6.2.6-6.2.6s-3.1 0-6.2-.6c-.6-.1-1.2-.6-1.4-1.1-.5-1.3-.5-4-.5-4s0-2.7.5-4c.2-.5.8-1 1.4-1.1C6.8 7.6 9.9 7.6 9.9 7.6s3.1 0 6.2.6c.6.1 1.2.6 1.4 1.1.5 1.3.5 4 .5 4s0 2.7-.5 4z" />
      </svg>
      SoundCloud
    </span>
  )
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const [urlText, setUrlText] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  const addTracks = useLibraryStore((s) => s.addTracks)
  const updateTrack = useLibraryStore((s) => s.updateTrack)
  const startPolling = useAnalysisStore((s) => s.startPolling)

  const parsedUrls: ParsedUrl[] = useMemo(() => {
    if (!urlText.trim()) return []
    return urlText
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => ({
        raw: line,
        trimmed: line.trim(),
        platform: validateUrl(line),
      }))
  }, [urlText])

  const validUrls = useMemo(
    () => parsedUrls.filter((u) => u.platform !== null),
    [parsedUrls]
  )

  const hasValidUrls = validUrls.length > 0

  const handleImport = useCallback(async () => {
    if (!hasValidUrls || isImporting) return

    setIsImporting(true)
    setError(null)
    setWarnings([])

    try {
      const urls = validUrls.map((u) => u.trimmed)
      const result = await api.importTracks(urls)

      if (result.warnings.length > 0) {
        setWarnings(result.warnings)
      }

      addTracks(result.tracks)

      const trackIds = result.tracks.map((t) => t.serverId)
      startPolling(trackIds, (trackId, status, result) => {
        if (status.startsWith('download:')) {
          const dlResult = result as Record<string, unknown> | null
          if (dlResult) {
            updateTrack(trackId, {
              downloadStatus: dlResult.downloadStatus as string as import('@/types/track').DownloadStatus,
              downloadProgress: dlResult.downloadProgress as number | undefined,
              downloadEta: dlResult.downloadEta as string | undefined,
              errorMessage: dlResult.errorMessage as string | undefined,
            })
          }
        } else if (status === 'done' && result) {
          const r = result as Record<string, unknown>
          updateTrack(trackId, {
            downloadStatus: 'done',
            analysisStatus: 'done',
            title: (r.title as string) || undefined,
            artist: (r.artist as string) || undefined,
            bpm: r.bpm as number,
            key: r.key as string,
            energy: r.energy as number,
            genrePrimary: r.genrePrimary as string,
            duration: r.duration as number,
          })
        } else if (status === 'analyzing') {
          updateTrack(trackId, { analysisStatus: 'analyzing' })
        } else if (status === 'error') {
          updateTrack(trackId, { analysisStatus: 'error' })
        }
      })

      setUrlText('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }, [hasValidUrls, isImporting, validUrls, addTracks, startPolling, updateTrack, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-lg mx-4 bg-bg-panel border border-bg-elevated rounded-xl overflow-hidden"
        style={{ boxShadow: '0 0 40px rgba(6, 182, 212, 0.15), 0 0 80px rgba(6, 182, 212, 0.05)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-elevated">
          <h2 className="text-lg font-semibold text-gray-200">Import from URL</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4L14 14M14 4L4 14" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-400">
            Paste YouTube or SoundCloud URLs, one per line.
          </p>

          <textarea
            className="w-full h-32 px-3 py-2 bg-bg-elevated border border-bg-hover rounded-lg text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-neon-cyan/50 resize-none font-mono"
            placeholder={"https://www.youtube.com/watch?v=...\nhttps://soundcloud.com/artist/track\n..."}
            value={urlText}
            onChange={(e) => {
              setUrlText(e.target.value)
              setError(null)
            }}
            disabled={isImporting}
            autoFocus
          />

          {/* URL validation results */}
          {parsedUrls.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {parsedUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {url.platform ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" className="text-neon-green shrink-0">
                        <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4 7L6 9L10 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <PlatformBadge platform={url.platform} />
                      <span className="text-gray-400 truncate">{url.trimmed}</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" className="text-neon-red shrink-0">
                        <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M5 5L9 9M9 5L5 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span className="text-gray-500 truncate">{url.trimmed}</span>
                      <span className="text-neon-red/60 shrink-0">Invalid URL</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-yellow-400">{w}</p>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-2 bg-neon-red/10 border border-neon-red/30 rounded-lg">
              <p className="text-xs text-neon-red">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-bg-elevated bg-bg-elevated/30">
          <span className="text-xs text-gray-500">
            {validUrls.length > 0
              ? `${validUrls.length} valid URL${validUrls.length > 1 ? 's' : ''}`
              : 'No valid URLs'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              disabled={isImporting}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!hasValidUrls || isImporting}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/30 hover:border-neon-cyan/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={hasValidUrls && !isImporting ? { boxShadow: '0 0 12px rgba(6, 182, 212, 0.2)' } : undefined}
            >
              {isImporting ? 'Importing...' : `Import${validUrls.length > 0 ? ` (${validUrls.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
