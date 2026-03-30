import { useMemo, useRef, useCallback } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Track } from '@/types/track'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { BpmDisplay } from '@/components/analysis/BpmDisplay'
import { KeyDisplay } from '@/components/analysis/KeyDisplay'
import { EnergyBar } from '@/components/analysis/EnergyBar'
import { GenreDisplay } from '@/components/analysis/GenreDisplay'
import { AnalysisStatus } from '@/components/analysis/AnalysisStatus'
import { MiniWaveform } from '@/components/waveform/MiniWaveform'
import { api } from '@/services/api'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function ThumbnailCell({ track }: { track: Track }) {
  if (track.thumbnailUrl) {
    return (
      <img
        src={track.thumbnailUrl}
        alt=""
        className="w-9 h-9 rounded object-cover bg-bg-elevated"
        loading="lazy"
        onError={(e) => {
          // Fallback to music note on error
          e.currentTarget.style.display = 'none'
          e.currentTarget.nextElementSibling?.classList.remove('hidden')
        }}
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded bg-bg-elevated flex items-center justify-center text-gray-600">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M14 2v8.5a2.5 2.5 0 11-1-2V4L6 5.5v6a2.5 2.5 0 11-1-2V3l9-1z" />
      </svg>
    </div>
  )
}

function SourceIcon({ track }: { track: Track }) {
  if (track.sourceType === 'youtube' && track.sourceUrl) {
    return (
      <a
        href={track.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-red-400 hover:text-red-300 transition-colors"
        title="Open on YouTube"
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.9 31.9 0 000 12a31.9 31.9 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.9 31.9 0 0024 12a31.9 31.9 0 00-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
        </svg>
      </a>
    )
  }
  if (track.sourceType === 'soundcloud' && track.sourceUrl) {
    return (
      <a
        href={track.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-400 hover:text-orange-300 transition-colors"
        title="Open on SoundCloud"
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.5-.8 1-1.4 1.1-3.1.6-6.2.6-6.2.6s-3.1 0-6.2-.6c-.6-.1-1.2-.6-1.4-1.1-.5-1.3-.5-4-.5-4s0-2.7.5-4c.2-.5.8-1 1.4-1.1C6.8 7.6 9.9 7.6 9.9 7.6s3.1 0 6.2.6c.6.1 1.2.6 1.4 1.1.5 1.3.5 4 .5 4s0 2.7-.5 4z" />
        </svg>
      </a>
    )
  }
  return null
}

function DownloadProgressCell({ track }: { track: Track }) {
  const addTracks = useLibraryStore((s) => s.addTracks)
  const startPolling = useAnalysisStore((s) => s.startPolling)
  const updateTrack = useLibraryStore((s) => s.updateTrack)

  const handleRetry = useCallback(async () => {
    if (!track.sourceUrl) return
    try {
      const result = await api.importTracks([track.sourceUrl])
      addTracks(result.tracks)
      const ids = result.tracks.map((t) => t.serverId)
      startPolling(ids, (trackId, status, r) => {
        if (status.startsWith('download:') && r) {
          const dlR = r as Record<string, unknown>
          updateTrack(trackId, {
            downloadStatus: dlR.downloadStatus as string as import('@/types/track').DownloadStatus,
            downloadProgress: dlR.downloadProgress as number | undefined,
            downloadEta: dlR.downloadEta as string | undefined,
          })
        }
      })
    } catch {
      // retry failed silently
    }
  }, [track.sourceUrl, addTracks, startPolling, updateTrack])

  switch (track.downloadStatus) {
    case 'queued':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
          Queued
        </span>
      )
    case 'downloading':
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-neon-cyan">
            Downloading... {track.downloadProgress != null ? `${Math.round(track.downloadProgress)}%` : ''}
            {track.downloadEta ? ` - ~${track.downloadEta}` : ''}
          </span>
          <div className="w-full h-1 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-neon-cyan rounded-full transition-all duration-300"
              style={{
                width: `${track.downloadProgress ?? 0}%`,
                boxShadow: '0 0 4px rgba(6, 182, 212, 0.5)',
              }}
            />
          </div>
        </div>
      )
    case 'error':
      return (
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 text-xs text-neon-red"
            title={track.errorMessage || 'Download failed'}
          >
            <span className="w-2 h-2 rounded-full bg-neon-red" style={{ boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)' }} />
            Error
          </span>
          {track.sourceUrl && (
            <button
              onClick={(e) => { e.stopPropagation(); void handleRetry() }}
              className="text-xs text-gray-500 hover:text-neon-cyan transition-colors"
              title="Retry download"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 6a5 5 0 019-3M11 6a5 5 0 01-9 3" />
                <path d="M10 1v2h-2M2 11V9h2" />
              </svg>
            </button>
          )}
        </div>
      )
    default:
      return null
  }
}

function StatusCell({ track }: { track: Track }) {
  // Show download progress for downloading tracks instead of analysis status
  if (track.downloadStatus && track.downloadStatus !== 'none' && track.downloadStatus !== 'done') {
    return <DownloadProgressCell track={track} />
  }
  return <AnalysisStatus status={track.analysisStatus} />
}

function DownloadProgressBar() {
  const tracks = useLibraryStore((s) => s.tracks)
  const downloading = tracks.filter((t) => t.downloadStatus === 'queued' || t.downloadStatus === 'downloading')
  const downloadingOrDone = tracks.filter((t) => t.downloadStatus && t.downloadStatus !== 'none')

  if (downloading.length === 0) return null

  const doneCount = downloadingOrDone.filter((t) => t.downloadStatus === 'done' || t.downloadStatus === 'error').length
  const totalCount = downloadingOrDone.length
  const percent = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

  return (
    <div className="h-7 px-4 flex items-center gap-3 bg-bg-panel border-b border-bg-elevated shrink-0">
      <span className="text-xs text-neon-cyan font-medium whitespace-nowrap">
        Downloading tracks... {doneCount}/{totalCount}
      </span>
      <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-neon-cyan rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            boxShadow: '0 0 8px rgba(6, 182, 212, 0.5)',
          }}
        />
      </div>
    </div>
  )
}

const columnHelper = createColumnHelper<Track>()

export function TrackTable() {
  const tracks = useLibraryStore((s) => s.getFilteredTracks())
  const selectedTrackId = useLibraryStore((s) => s.selectedTrackId)
  const selectTrack = useLibraryStore((s) => s.selectTrack)
  const updateTrack = useLibraryStore((s) => s.updateTrack)
  const sortColumn = useLibraryStore((s) => s.sortColumn)
  const sortDirection = useLibraryStore((s) => s.sortDirection)
  const setSorting = useLibraryStore((s) => s.setSorting)

  const parentRef = useRef<HTMLDivElement>(null)

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'thumbnail',
      header: '',
      size: 44,
      cell: (info) => <ThumbnailCell track={info.row.original} />,
    }),
    columnHelper.display({
      id: 'waveform',
      header: '',
      size: 80,
      cell: (info) => <MiniWaveform trackId={info.row.original.serverId} />,
    }),
    columnHelper.accessor('title', {
      header: 'Title',
      size: 200,
      cell: (info) => {
        const track = info.row.original
        return (
          <div className="flex items-center gap-1.5">
            <SourceIcon track={track} />
            <span className="text-gray-200 font-medium truncate block">{info.getValue()}</span>
          </div>
        )
      },
    }),
    columnHelper.accessor('artist', {
      header: 'Artist',
      size: 150,
      cell: (info) => (
        <span className="text-gray-400 truncate block">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('bpm', {
      header: 'BPM',
      size: 70,
      cell: (info) => {
        const track = info.row.original
        return (
          <BpmDisplay
            bpm={track.bpm}
            bpmRaw={track.bpmRaw}
            bpmCorrected={track.bpmCorrected}
            onSave={(v) => updateTrack(track.serverId, { bpm: v })}
          />
        )
      },
    }),
    columnHelper.accessor('key', {
      header: 'Key',
      size: 60,
      cell: (info) => {
        const track = info.row.original
        return (
          <KeyDisplay
            keyValue={track.key}
            keyConfidence={track.keyConfidence}
            onSave={(v) => updateTrack(track.serverId, { key: v })}
          />
        )
      },
    }),
    columnHelper.accessor('energy', {
      header: 'Energy',
      size: 80,
      cell: (info) => {
        const track = info.row.original
        return (
          <EnergyBar
            energy={track.energy}
            onSave={(v) => updateTrack(track.serverId, { energy: v })}
          />
        )
      },
    }),
    columnHelper.accessor('genrePrimary', {
      header: 'Genre',
      size: 130,
      cell: (info) => {
        const track = info.row.original
        return (
          <GenreDisplay
            genrePrimary={track.genrePrimary}
            genreSecondary={track.genreSecondary}
            genreConfidence={track.genreConfidence}
            onSave={(v) => updateTrack(track.serverId, { genrePrimary: v })}
          />
        )
      },
    }),
    columnHelper.accessor('duration', {
      header: 'Duration',
      size: 70,
      cell: (info) => (
        <span className="font-mono text-xs text-gray-400">{formatDuration(info.getValue())}</span>
      ),
    }),
    columnHelper.accessor('format', {
      header: 'Format',
      size: 55,
      cell: (info) => (
        <span className="text-xs text-gray-500 uppercase">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('bitrate', {
      header: 'Bitrate',
      size: 65,
      cell: (info) => (
        <span className="font-mono text-xs text-gray-500">{info.getValue()} kbps</span>
      ),
    }),
    columnHelper.accessor('sampleRate', {
      header: 'Sample Rate',
      size: 80,
      cell: (info) => (
        <span className="font-mono text-xs text-gray-500">{info.getValue()} Hz</span>
      ),
    }),
    columnHelper.display({
      id: 'status',
      header: 'Status',
      size: 110,
      cell: (info) => <StatusCell track={info.row.original} />,
    }),
  ], [updateTrack])

  const sorting: SortingState = useMemo(() => [
    { id: sortColumn, desc: sortDirection === 'desc' },
  ], [sortColumn, sortDirection])

  const table = useReactTable({
    data: tracks,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      if (next.length > 0) {
        setSorting(next[0].id, next[0].desc ? 'desc' : 'asc')
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.serverId,
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  if (tracks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 text-lg neon-shimmer bg-clip-text">
            Drop audio files or import from URL to get started
          </p>
          <p className="text-gray-600 text-sm mt-2">MP3, WAV, FLAC or YouTube/SoundCloud URLs</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <DownloadProgressBar />
      <div ref={parentRef} className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-bg-panel">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors select-none border-b border-bg-elevated"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M4 1L7 6H1Z" /></svg>
                      )}
                      {header.column.getIsSorted() === 'desc' && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M4 7L1 2H7Z" /></svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            <tr style={{ height: `${virtualizer.getTotalSize()}px` }}>
              <td colSpan={columns.length} className="p-0 relative">
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  const isSelected = row.original.serverId === selectedTrackId
                  return (
                    <div
                      key={row.id}
                      role="row"
                      className={`absolute w-full flex ${
                        isSelected
                          ? 'bg-bg-elevated border-l-2 border-l-neon-cyan'
                          : 'hover:bg-bg-hover border-l-2 border-l-transparent'
                      } transition-colors cursor-pointer`}
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                        ...(isSelected ? { boxShadow: 'inset 3px 0 8px rgba(6, 182, 212, 0.15)' } : {}),
                      }}
                      onClick={() => selectTrack(row.original.serverId)}
                      onDoubleClick={() => {
                        usePlayerStore.getState().play(row.original.serverId)
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <div
                          key={cell.id}
                          role="cell"
                          className="px-2 py-1 flex items-center overflow-hidden"
                          style={{ width: cell.column.getSize(), minWidth: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
