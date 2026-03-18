import { useState, type ReactNode } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'

interface AppShellProps {
  sidebar?: ReactNode
  main?: ReactNode
  bottom?: ReactNode
}

function ResizeHandle({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' }) {
  const isHorizontal = direction === 'horizontal'
  return (
    <Separator
      className={`group relative flex items-center justify-center ${
        isHorizontal ? 'w-1.5' : 'h-1.5'
      } hover:bg-bg-hover transition-colors`}
    >
      <div
        className={`${
          isHorizontal ? 'w-px h-8' : 'h-px w-8'
        } bg-bg-hover group-hover:bg-neon-cyan transition-colors`}
        style={{ boxShadow: 'var(--glow-sm, 0 0 4px) var(--neon-cyan, #06b6d4)' }}
      />
    </Separator>
  )
}

export function AppShell({ sidebar, main, bottom }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Group orientation="vertical" className="flex-1">
        <Panel defaultSize={75} minSize={40}>
          <Group orientation="horizontal" className="h-full">
            {!sidebarCollapsed && (
              <>
                <Panel defaultSize={15} minSize={10} maxSize={25}>
                  <div className="h-full bg-bg-panel border-r border-bg-elevated overflow-y-auto">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-bg-elevated">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Playlists
                      </span>
                      <button
                        className="text-gray-500 hover:text-neon-cyan transition-colors p-0.5"
                        onClick={() => setSidebarCollapsed(true)}
                        title="Collapse sidebar"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 3L5 7L9 11" />
                        </svg>
                      </button>
                    </div>
                    {sidebar}
                  </div>
                </Panel>
                <ResizeHandle direction="horizontal" />
              </>
            )}

            <Panel defaultSize={sidebarCollapsed ? 100 : 85} minSize={50}>
              <div className="h-full bg-bg-primary overflow-hidden flex flex-col">
                {sidebarCollapsed && (
                  <button
                    className="absolute left-1 top-1 z-10 text-gray-500 hover:text-neon-cyan transition-colors p-1 rounded hover:bg-bg-hover"
                    onClick={() => setSidebarCollapsed(false)}
                    title="Expand sidebar"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 3L9 7L5 11" />
                    </svg>
                  </button>
                )}
                {main}
              </div>
            </Panel>
          </Group>
        </Panel>

        <ResizeHandle direction="vertical" />

        <Panel defaultSize={25} minSize={10} maxSize={50}>
          <div className="h-full bg-bg-panel border-t border-bg-elevated overflow-hidden">
            {bottom || (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                Select a track to view waveform
              </div>
            )}
          </div>
        </Panel>
      </Group>
    </div>
  )
}
