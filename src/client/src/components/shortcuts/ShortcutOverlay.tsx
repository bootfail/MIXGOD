interface ShortcutOverlayProps {
  onClose: () => void
}

interface ShortcutGroup {
  title: string
  shortcuts: { keys: string[]; description: string }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Playback',
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause' },
      { keys: ['←'], description: 'Seek back 5s' },
      { keys: ['→'], description: 'Seek forward 5s' },
      { keys: ['Shift', '←'], description: 'Seek back 30s' },
      { keys: ['Shift', '→'], description: 'Seek forward 30s' },
      { keys: ['M'], description: 'Mute / Unmute' },
      { keys: ['['], description: 'Volume down' },
      { keys: [']'], description: 'Volume up' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['↑'], description: 'Previous track' },
      { keys: ['↓'], description: 'Next track' },
      { keys: ['Enter'], description: 'Play selected track' },
      { keys: ['Delete'], description: 'Remove selected track' },
    ],
  },
  {
    title: 'Project',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Export project (.mixgod)' },
      { keys: ['Ctrl', 'F'], description: 'Focus search' },
      { keys: ['?'], description: 'Toggle this overlay' },
    ],
  },
]

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-bg-elevated border border-bg-hover text-[11px] font-mono text-gray-300">
      {children}
    </kbd>
  )
}

export function ShortcutOverlay({ onClose }: ShortcutOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-bg-panel border border-bg-elevated rounded-lg shadow-2xl w-[560px] max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-bg-elevated">
          <h2 className="text-sm font-semibold text-gray-200">Keyboard Shortcuts</h2>
          <button className="text-gray-500 hover:text-gray-300 transition-colors" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 p-5 overflow-y-auto max-h-[70vh]">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.description} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key) => (
                        <Key key={key}>{key}</Key>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-2 border-t border-bg-elevated text-center">
          <span className="text-[10px] text-gray-600">Press <Key>?</Key> or <Key>Esc</Key> to close</span>
        </div>
      </div>
    </div>
  )
}
