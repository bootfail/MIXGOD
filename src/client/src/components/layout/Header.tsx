import { useState } from 'react'

export function Header() {
  const [projectName, setProjectName] = useState('Untitled Project')
  const [isEditing, setIsEditing] = useState(false)

  return (
    <header className="flex items-center h-12 px-4 bg-bg-primary border-b border-bg-elevated shrink-0"
      style={{ boxShadow: '0 1px 8px rgba(6, 182, 212, 0.1)' }}>
      <h1 className="text-xl font-bold tracking-tight neon-gradient-text select-none mr-6">
        MIXGOD
      </h1>

      <div className="flex items-center gap-2 flex-1">
        {isEditing ? (
          <input
            className="bg-bg-panel border border-bg-hover rounded px-2 py-0.5 text-sm text-gray-200 outline-none focus:border-neon-cyan"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditing(false)
              if (e.key === 'Escape') setIsEditing(false)
            }}
            autoFocus
          />
        ) : (
          <button
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            {projectName}
          </button>
        )}
      </div>

      <button
        className="text-gray-500 hover:text-neon-cyan transition-colors p-1.5 rounded hover:bg-bg-hover"
        title="Switch project"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="5" height="5" rx="1" />
          <rect x="9" y="2" width="5" height="5" rx="1" />
          <rect x="2" y="9" width="5" height="5" rx="1" />
          <rect x="9" y="9" width="5" height="5" rx="1" />
        </svg>
      </button>
    </header>
  )
}
