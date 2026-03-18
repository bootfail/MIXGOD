import { useState } from 'react'

const MUSICAL_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
]
const SCALES = ['major', 'minor']

const CAMELOT_MAP: Record<string, string> = {
  'C major': '8B', 'C minor': '5A',
  'C# major': '3B', 'C# minor': '12A',
  'D major': '10B', 'D minor': '7A',
  'D# major': '5B', 'D# minor': '2A',
  'E major': '12B', 'E minor': '9A',
  'F major': '7B', 'F minor': '4A',
  'F# major': '2B', 'F# minor': '11A',
  'G major': '9B', 'G minor': '6A',
  'G# major': '4B', 'G# minor': '1A',
  'A major': '11B', 'A minor': '8A',
  'A# major': '6B', 'A# minor': '3A',
  'B major': '1B', 'B minor': '10A',
}

interface KeyDisplayProps {
  keyValue: string
  keyConfidence: number
  showCamelot?: boolean
  onSave?: (newKey: string) => void
}

export function KeyDisplay({ keyValue, keyConfidence, showCamelot = false, onSave }: KeyDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(keyValue)

  const handleSave = () => {
    if (editValue.trim()) {
      onSave?.(editValue.trim())
    }
    setIsEditing(false)
  }

  const camelotCode = CAMELOT_MAP[keyValue]
  const displayValue = showCamelot && camelotCode ? camelotCode : formatKey(keyValue)
  const lowConfidence = keyConfidence < 0.7

  if (isEditing) {
    return (
      <select
        className="bg-bg-elevated border border-neon-cyan/50 rounded px-1 py-0.5 text-xs font-mono text-gray-200 outline-none"
        value={editValue}
        onChange={(e) => {
          setEditValue(e.target.value)
          onSave?.(e.target.value)
          setIsEditing(false)
        }}
        onBlur={handleSave}
        autoFocus
      >
        {MUSICAL_KEYS.flatMap((k) =>
          SCALES.map((s) => {
            const fullKey = `${k} ${s}`
            const label = `${k}${s === 'minor' ? 'm' : ''}`
            return (
              <option key={fullKey} value={fullKey}>
                {label} {CAMELOT_MAP[fullKey] ? `(${CAMELOT_MAP[fullKey]})` : ''}
              </option>
            )
          })
        )}
      </select>
    )
  }

  return (
    <button
      className="inline-flex items-center gap-1 font-mono text-xs text-gray-200 hover:text-neon-cyan transition-colors cursor-pointer"
      onClick={() => {
        setEditValue(keyValue)
        setIsEditing(true)
      }}
      title={`${keyValue}${camelotCode ? ` (${camelotCode})` : ''} - Confidence: ${(keyConfidence * 100).toFixed(0)}%`}
    >
      <span>{displayValue}</span>
      {lowConfidence && (
        <svg width="10" height="10" viewBox="0 0 10 10" className="text-neon-orange" fill="currentColor"
          style={{ filter: 'drop-shadow(0 0 2px rgba(249, 115, 22, 0.5))' }}>
          <path d="M5 1L9 9H1L5 1Z" />
        </svg>
      )}
    </button>
  )
}

function formatKey(key: string): string {
  // "A minor" -> "Am", "C# major" -> "C#"
  const parts = key.split(' ')
  if (parts.length < 2) return key
  const note = parts[0]
  const scale = parts[1]
  return scale === 'minor' ? `${note}m` : note
}
