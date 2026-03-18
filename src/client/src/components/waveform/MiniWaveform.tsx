import { useEffect, useRef, useState } from 'react'
import { api } from '@/services/api'

interface MiniWaveformProps {
  trackId: string
}

export function MiniWaveform({ trackId }: MiniWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false

    const draw = async () => {
      try {
        const peaks = await api.getTrackPeaks(trackId)
        if (cancelled || !peaks.data) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height
        const data = peaks.data

        // Downsample to canvas width
        const step = Math.max(1, Math.floor(data.length / width))
        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = 'rgba(6, 182, 212, 0.5)'

        for (let i = 0; i < width; i++) {
          const idx = Math.floor(i * step)
          const val = Math.abs(data[idx] ?? 0)
          const barHeight = val * height
          const y = (height - barHeight) / 2
          ctx.fillRect(i, y, 1, barHeight)
        }

        setLoaded(true)
      } catch {
        // Peaks not available yet
      }
    }

    void draw()
    return () => { cancelled = true }
  }, [trackId])

  return (
    <div className="w-[72px] h-5 bg-bg-elevated rounded-sm overflow-hidden">
      {!loaded && (
        <div className="w-full h-full bg-gradient-to-r from-bg-hover to-bg-elevated opacity-50" />
      )}
      <canvas
        ref={canvasRef}
        width={72}
        height={20}
        className={loaded ? 'block' : 'hidden'}
      />
    </div>
  )
}
