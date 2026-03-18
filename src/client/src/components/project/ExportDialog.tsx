import { useState, useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const exportProjectFn = useProjectStore((s) => s.exportProject)
  const [status, setStatus] = useState<'exporting' | 'done' | 'error'>('exporting')

  useEffect(() => {
    const doExport = async () => {
      try {
        await exportProjectFn()
        setStatus('done')
        setTimeout(onClose, 1500)
      } catch {
        setStatus('error')
        setTimeout(onClose, 2000)
      }
    }
    void doExport()
  }, [exportProjectFn, onClose])

  return (
    <div className="fixed bottom-20 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm"
      style={{
        background: status === 'done' ? 'rgba(16, 185, 129, 0.15)' : status === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)',
        border: `1px solid ${status === 'done' ? '#10b981' : status === 'error' ? '#ef4444' : '#06b6d4'}`,
        boxShadow: `0 0 12px ${status === 'done' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
      }}>
      {status === 'exporting' && <span className="text-neon-cyan">Exporting project...</span>}
      {status === 'done' && <span className="text-neon-green">Project exported!</span>}
      {status === 'error' && <span className="text-neon-red">Export failed</span>}
    </div>
  )
}
