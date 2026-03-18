import { useState } from 'react'

interface EnergyBarProps {
  energy: number // 1-10
  onSave?: (newEnergy: number) => void
}

function energyColor(energy: number): string {
  if (energy <= 3) return '#3b82f6' // neon blue
  if (energy <= 6) return '#eab308' // neon yellow
  if (energy <= 8) return '#f97316' // neon orange
  return '#ef4444' // neon red
}

export function EnergyBar({ energy, onSave }: EnergyBarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(energy))

  const color = energyColor(energy)
  const fillPercent = (energy / 10) * 100

  const handleSave = () => {
    const parsed = parseInt(editValue, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
      onSave?.(parsed)
    }
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        type="number"
        className="w-10 bg-bg-elevated border border-neon-cyan/50 rounded px-1 py-0.5 text-xs font-mono text-gray-200 outline-none"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') setIsEditing(false)
        }}
        autoFocus
        min={1}
        max={10}
        step={1}
      />
    )
  }

  return (
    <button
      className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => {
        setEditValue(String(energy))
        setIsEditing(true)
      }}
      title={`Energy: ${energy}/10`}
    >
      <div className="w-10 h-2 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${fillPercent}%`,
            backgroundColor: color,
            boxShadow: `0 0 4px ${color}`,
          }}
        />
      </div>
      <span className="font-mono text-[10px] text-gray-400 w-3 text-right">{energy}</span>
    </button>
  )
}
