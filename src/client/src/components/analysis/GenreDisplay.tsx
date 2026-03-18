import { useState } from 'react'

interface GenreDisplayProps {
  genrePrimary: string
  genreSecondary?: string | null
  genreConfidence: number
  hierarchy?: string[]
  onSave?: (genre: string) => void
}

export function GenreDisplay({ genrePrimary, genreSecondary, genreConfidence, hierarchy, onSave }: GenreDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(genrePrimary)

  const lowConfidence = genreConfidence < 0.7
  const hierarchyText = hierarchy?.length ? hierarchy.join(' > ') : genrePrimary
  const hasSecondary = genreSecondary && genreSecondary !== genrePrimary

  const handleSave = () => {
    if (editValue.trim()) {
      onSave?.(editValue.trim())
    }
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        type="text"
        className="w-28 bg-bg-elevated border border-neon-cyan/50 rounded px-1 py-0.5 text-xs text-gray-200 outline-none"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') setIsEditing(false)
        }}
        autoFocus
        placeholder="Genre"
      />
    )
  }

  return (
    <button
      className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-neon-purple transition-colors cursor-pointer max-w-[120px]"
      onClick={() => {
        setEditValue(genrePrimary)
        setIsEditing(true)
      }}
      title={`${hierarchyText}\nConfidence: ${(genreConfidence * 100).toFixed(0)}%`}
    >
      <span className="truncate">{genrePrimary}</span>
      {hasSecondary && (
        <span
          className="shrink-0 text-[9px] px-1 py-px rounded bg-neon-purple/20 text-neon-purple"
        >
          +1
        </span>
      )}
      {lowConfidence && (
        <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0 text-neon-orange" fill="currentColor"
          style={{ filter: 'drop-shadow(0 0 2px rgba(249, 115, 22, 0.5))' }}>
          <path d="M5 1L9 9H1L5 1Z" />
        </svg>
      )}
    </button>
  )
}
