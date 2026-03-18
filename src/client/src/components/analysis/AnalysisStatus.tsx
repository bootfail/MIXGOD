import type { AnalysisStatus as Status } from '@/types/track'

interface AnalysisStatusProps {
  status: Status
  onRetry?: () => void
}

export function AnalysisStatus({ status, onRetry }: AnalysisStatusProps) {
  switch (status) {
    case 'queued':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-gray-500" />
          Queued
        </span>
      )

    case 'analyzing':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-neon-magenta">
          <span
            className="w-2 h-2 rounded-full bg-neon-magenta glow-pulse"
            style={{ boxShadow: '0 0 6px rgba(236, 72, 153, 0.6)' }}
          />
          Analyzing...
        </span>
      )

    case 'done':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-neon-green">
          <span
            className="w-2 h-2 rounded-full bg-neon-green"
            style={{ boxShadow: '0 0 4px rgba(16, 185, 129, 0.5)' }}
          />
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 5L4.5 7.5L8 3" />
          </svg>
        </span>
      )

    case 'error':
      return (
        <button
          className="inline-flex items-center gap-1.5 text-xs text-neon-red hover:text-neon-red/80 transition-colors cursor-pointer"
          onClick={onRetry}
          title="Click to retry analysis"
        >
          <span
            className="w-2 h-2 rounded-full bg-neon-red"
            style={{ boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)' }}
          />
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 2L8 8M8 2L2 8" />
          </svg>
          Error
        </button>
      )
  }
}
