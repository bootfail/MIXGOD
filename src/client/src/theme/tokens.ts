export const neonTheme = {
  bg: {
    primary: '#0a0a0f',
    panel: '#12121a',
    elevated: '#1a1a2e',
    hover: '#22223a',
  },
  neon: {
    cyan: '#06b6d4',
    magenta: '#ec4899',
    green: '#10b981',
    orange: '#f97316',
    red: '#ef4444',
    purple: '#8b5cf6',
    yellow: '#eab308',
    blue: '#3b82f6',
  },
  glow: {
    sm: '0 0 4px',
    md: '0 0 8px',
    lg: '0 0 16px',
    xl: '0 0 24px',
  },
  font: {
    ui: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  animation: {
    panelSlide: '200ms ease-in-out',
    glowPulse: '1.5s ease-in-out infinite',
    shimmer: '2s linear infinite',
  },
} as const

export type NeonTheme = typeof neonTheme
