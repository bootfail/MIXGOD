import { useState } from 'react'
import { useLibraryStore } from '@/stores/libraryStore'
import type { SmartPlaylist, FilterPreset, FilterOperator } from '@/types/project'

const SUGGESTION_PRESETS: { name: string; filters: FilterPreset[] }[] = [
  { name: 'Hardstyle 140-160', filters: [
    { field: 'bpm', operator: 'gte', value: 140 },
    { field: 'bpm', operator: 'lte', value: 160 },
  ]},
  { name: 'High Energy (7+)', filters: [
    { field: 'energy', operator: 'gte', value: 7 },
  ]},
  { name: 'Latin Vibes', filters: [
    { field: 'genrePrimary', operator: 'contains', value: 'Latin' },
  ]},
]

const FILTER_FIELDS = ['bpm', 'energy', 'key', 'genrePrimary', 'format', 'title', 'artist']
const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '!=' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'contains', label: 'contains' },
]

export function SmartPlaylists() {
  const tracks = useLibraryStore((s) => s.tracks)
  const playlists = useLibraryStore((s) => s.playlists)
  const activePlaylistId = useLibraryStore((s) => s.activePlaylistId)
  const setActivePlaylist = useLibraryStore((s) => s.setActivePlaylist)
  const addPlaylist = useLibraryStore((s) => s.addPlaylist)

  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFilters, setNewFilters] = useState<FilterPreset[]>([
    { field: 'bpm', operator: 'gte', value: 0 },
  ])

  const handleCreate = () => {
    if (!newName.trim()) return
    const playlist: SmartPlaylist = {
      id: Date.now(),
      projectId: 0,
      name: newName.trim(),
      filters: newFilters,
    }
    addPlaylist(playlist)
    setNewName('')
    setNewFilters([{ field: 'bpm', operator: 'gte', value: 0 }])
    setIsCreating(false)
  }

  const addSuggestion = (suggestion: { name: string; filters: FilterPreset[] }) => {
    addPlaylist({
      id: Date.now(),
      projectId: 0,
      name: suggestion.name,
      filters: suggestion.filters,
    })
  }

  return (
    <div className="flex flex-col text-xs">
      {/* All Tracks */}
      <button
        className={`flex items-center justify-between px-3 py-2 transition-colors ${
          activePlaylistId === null
            ? 'bg-bg-hover text-neon-cyan border-l-2 border-l-neon-cyan'
            : 'text-gray-400 hover:text-gray-200 hover:bg-bg-hover border-l-2 border-l-transparent'
        }`}
        onClick={() => setActivePlaylist(null)}
      >
        <span>All Tracks</span>
        <span className="text-gray-600">{tracks.length}</span>
      </button>

      {/* Saved playlists */}
      {playlists.map((pl) => (
        <button
          key={pl.id}
          className={`flex items-center justify-between px-3 py-2 transition-colors ${
            activePlaylistId === pl.id
              ? 'bg-bg-hover text-neon-cyan border-l-2 border-l-neon-cyan'
              : 'text-gray-400 hover:text-gray-200 hover:bg-bg-hover border-l-2 border-l-transparent'
          }`}
          onClick={() => setActivePlaylist(pl.id ?? null)}
        >
          <span className="truncate">{pl.name}</span>
          <span className="text-gray-600 ml-1">{pl.filters.length}f</span>
        </button>
      ))}

      {/* Create new */}
      {isCreating ? (
        <div className="p-2 space-y-2 border-t border-bg-elevated">
          <input
            className="w-full bg-bg-elevated border border-bg-hover rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-neon-cyan"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Playlist name"
            autoFocus
          />
          {newFilters.map((f, i) => (
            <div key={i} className="flex gap-1">
              <select
                className="flex-1 bg-bg-elevated border border-bg-hover rounded px-1 py-0.5 text-[10px] text-gray-300 outline-none"
                value={f.field}
                onChange={(e) => {
                  const updated = [...newFilters]
                  updated[i] = { ...f, field: e.target.value }
                  setNewFilters(updated)
                }}
              >
                {FILTER_FIELDS.map((field) => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              <select
                className="bg-bg-elevated border border-bg-hover rounded px-1 py-0.5 text-[10px] text-gray-300 outline-none"
                value={f.operator}
                onChange={(e) => {
                  const updated = [...newFilters]
                  updated[i] = { ...f, operator: e.target.value as FilterOperator }
                  setNewFilters(updated)
                }}
              >
                {FILTER_OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
              <input
                className="w-12 bg-bg-elevated border border-bg-hover rounded px-1 py-0.5 text-[10px] text-gray-300 outline-none"
                value={String(f.value)}
                onChange={(e) => {
                  const updated = [...newFilters]
                  const val = isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)
                  updated[i] = { ...f, value: val }
                  setNewFilters(updated)
                }}
              />
            </div>
          ))}
          <div className="flex gap-1">
            <button
              className="flex-1 px-2 py-1 text-[10px] bg-neon-cyan/20 text-neon-cyan rounded hover:bg-neon-cyan/30 transition-colors"
              onClick={handleCreate}
            >
              Save
            </button>
            <button
              className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-neon-cyan transition-colors border-t border-bg-elevated"
          onClick={() => setIsCreating(true)}
        >
          <span>+</span>
          <span>New Playlist</span>
        </button>
      )}

      {/* Suggestions */}
      {playlists.length === 0 && (
        <div className="px-3 py-2 border-t border-bg-elevated">
          <p className="text-[10px] text-gray-600 mb-1">Suggestions</p>
          {SUGGESTION_PRESETS.map((s) => (
            <button
              key={s.name}
              className="block w-full text-left px-1 py-0.5 text-[10px] text-gray-500 hover:text-neon-purple transition-colors"
              onClick={() => addSuggestion(s)}
            >
              + {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
