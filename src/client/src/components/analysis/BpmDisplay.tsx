import { useState } from 'react'

interface BpmDisplayProps {
  bpm: number
  bpmRaw: number
  bpmCorrected: boolean
  onSave?: (newBpm: number) => void
}

export function BpmDisplay({ bpm, bpmRaw, bpmCorrected, onSave }: BpmDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(bpm))

  const handleSave = () => {
    const parsed = parseFloat(editValue)
    if (!isNaN(parsed) && parsed > 0) {
      onSave?.(parsed)
    }
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        type="number"
        className="w-16 bg-bg-elevated border border-neon-cyan/50 rounded px-1 py-0.5 text-xs font-mono text-gray-200 outline-none"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') setIsEditing(false)
        }}
        autoFocus
        min={1}
        max={300}
        step={0.1}
      />
    )
  }

  return (
    <button
      className="inline-flex items-center gap-0.5 font-mono text-xs text-gray-200 hover:text-neon-cyan transition-colors cursor-pointer"
      onClick={() => {
        setEditValue(String(bpm))
        setIsEditing(true)
      }}
      title={bpmCorrected ? `Raw: ${bpmRaw} -> Corrected: ${bpm}` : `BPM: ${bpm}`}
    >
      <span>{bpm.toFixed(1)}</span>
      {bpmCorrected && (
        <span
          className="text-neon-orange text-[10px] leading-none"
          style={{ textShadow: '0 0 4px rgba(249, 115, 22, 0.6)' }}
        >
          *
        </span>
      )}
    </button>
  )
}
