import { useLibraryStore } from '@/stores/libraryStore'

export function ViewToggle() {
  const viewMode = useLibraryStore((s) => s.viewMode)
  const setViewMode = useLibraryStore((s) => s.setViewMode)

  return (
    <div className="inline-flex rounded-md overflow-hidden border border-bg-hover">
      <button
        className={`p-1.5 transition-all ${
          viewMode === 'table'
            ? 'bg-neon-cyan/20 text-neon-cyan'
            : 'bg-bg-elevated text-gray-500 hover:text-gray-300'
        }`}
        onClick={() => setViewMode('table')}
        title="Table view"
        style={viewMode === 'table' ? { boxShadow: '0 0 8px rgba(6, 182, 212, 0.3)' } : undefined}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 3h10M2 7h10M2 11h10" />
        </svg>
      </button>
      <button
        className={`p-1.5 transition-all ${
          viewMode === 'card'
            ? 'bg-neon-cyan/20 text-neon-cyan'
            : 'bg-bg-elevated text-gray-500 hover:text-gray-300'
        }`}
        onClick={() => setViewMode('card')}
        title="Card view"
        style={viewMode === 'card' ? { boxShadow: '0 0 8px rgba(6, 182, 212, 0.3)' } : undefined}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="5" height="5" rx="1" />
          <rect x="8" y="1" width="5" height="5" rx="1" />
          <rect x="1" y="8" width="5" height="5" rx="1" />
          <rect x="8" y="8" width="5" height="5" rx="1" />
        </svg>
      </button>
    </div>
  )
}
