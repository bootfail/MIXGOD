import { useMemo, useRef } from 'react'
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
import { BpmDisplay } from '@/components/analysis/BpmDisplay'
import { KeyDisplay } from '@/components/analysis/KeyDisplay'
import { EnergyBar } from '@/components/analysis/EnergyBar'
import { GenreDisplay } from '@/components/analysis/GenreDisplay'
import { AnalysisStatus } from '@/components/analysis/AnalysisStatus'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
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
      id: 'waveform',
      header: '',
      size: 80,
      cell: () => (
        <div className="w-[72px] h-5 bg-bg-elevated rounded-sm overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-bg-hover to-bg-elevated opacity-50" />
        </div>
      ),
    }),
    columnHelper.accessor('title', {
      header: 'Title',
      size: 200,
      cell: (info) => (
        <span className="text-gray-200 font-medium truncate block">{info.getValue()}</span>
      ),
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
    columnHelper.accessor('analysisStatus', {
      header: 'Status',
      size: 90,
      cell: (info) => <AnalysisStatus status={info.getValue()} />,
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
    estimateSize: () => 36,
    overscan: 10,
  })

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
    <div ref={parentRef} className="h-full overflow-auto">
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
                  <tr
                    key={row.id}
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
                      // Will connect to player in Plan 04
                      selectTrack(row.original.serverId)
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-2 py-1 flex items-center overflow-hidden"
                        style={{ width: cell.column.getSize(), minWidth: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
