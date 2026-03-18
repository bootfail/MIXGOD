import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'

interface ProjectSwitcherProps {
  onClose: () => void
}

export function ProjectSwitcher({ onClose }: ProjectSwitcherProps) {
  const projects = useProjectStore((s) => s.projects)
  const currentProjectId = useProjectStore((s) => s.currentProjectId)
  const loadProject = useProjectStore((s) => s.loadProject)
  const createProject = useProjectStore((s) => s.createProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const importProjectFn = useProjectStore((s) => s.importProject)

  const [newName, setNewName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const handleCreate = async () => {
    if (!newName.trim()) return
    await createProject(newName.trim())
    setNewName('')
    setShowCreate(false)
    onClose()
  }

  const handleLoad = async (id: number) => {
    await loadProject(id)
    onClose()
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.mixgod'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (file) {
        await importProjectFn(file)
        onClose()
      }
    }
    input.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-bg-panel border border-bg-elevated rounded-lg shadow-2xl w-[420px] max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-bg-elevated">
          <h2 className="text-sm font-semibold text-gray-200">Projects</h2>
          <button className="text-gray-500 hover:text-gray-300 transition-colors" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[50vh] p-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                p.id === currentProjectId ? 'bg-bg-elevated border-l-2 border-l-neon-cyan' : 'hover:bg-bg-hover'
              }`}
              onClick={() => p.id && handleLoad(p.id)}
            >
              <div className="min-w-0">
                <div className="text-sm text-gray-200 truncate">{p.name}</div>
                <div className="text-[10px] text-gray-600">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </div>
              </div>
              {confirmDelete === p.id ? (
                <div className="flex gap-1 shrink-0">
                  <button
                    className="px-2 py-0.5 text-[10px] bg-neon-red/20 text-neon-red rounded hover:bg-neon-red/30"
                    onClick={(e) => { e.stopPropagation(); p.id && deleteProject(p.id) }}
                  >
                    Confirm
                  </button>
                  <button
                    className="px-2 py-0.5 text-[10px] text-gray-500 rounded hover:bg-bg-hover"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(null) }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="text-gray-600 hover:text-neon-red transition-colors p-1 shrink-0"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(p.id ?? null) }}
                  title="Delete project"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 3h8M4.5 3V2h3v1M3 3l.5 7h5l.5-7" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-bg-elevated space-y-2">
          {showCreate ? (
            <div className="flex gap-2">
              <input
                className="flex-1 bg-bg-elevated border border-bg-hover rounded px-2 py-1 text-sm text-gray-200 outline-none focus:border-neon-cyan"
                placeholder="Project name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); if (e.key === 'Escape') setShowCreate(false) }}
                autoFocus
              />
              <button
                className="px-3 py-1 text-xs bg-neon-cyan/20 text-neon-cyan rounded hover:bg-neon-cyan/30"
                onClick={() => void handleCreate()}
              >
                Create
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                className="flex-1 px-3 py-1.5 text-xs bg-bg-elevated text-gray-300 rounded hover:bg-bg-hover transition-colors"
                onClick={() => setShowCreate(true)}
              >
                + New Project
              </button>
              <button
                className="px-3 py-1.5 text-xs bg-bg-elevated text-gray-300 rounded hover:bg-bg-hover transition-colors"
                onClick={handleImport}
              >
                Import .mixgod
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
