import { useAnalysisStore } from '@/stores/analysisStore'

export function UploadProgress() {
  const totalCount = useAnalysisStore((s) => s.totalCount)
  const completedCount = useAnalysisStore((s) => s.completedCount)
  const isPolling = useAnalysisStore((s) => s.isPolling)
  const pendingCount = useAnalysisStore((s) => s.pendingTrackIds.size)

  if (!isPolling || totalCount === 0 || pendingCount === 0) return null

  const percent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="h-7 px-4 flex items-center gap-3 bg-bg-panel border-b border-bg-elevated shrink-0">
      <span className="text-xs text-neon-magenta font-medium whitespace-nowrap">
        Analyzing tracks... {completedCount}/{totalCount}
      </span>
      <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-neon-magenta rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            boxShadow: '0 0 8px rgba(236, 72, 153, 0.5)',
          }}
        />
      </div>
    </div>
  )
}
