export type AnalysisStatus = 'queued' | 'analyzing' | 'done' | 'error'

export interface GenreInfo {
  primary: string
  secondary: string | null
  confidence: number
  hierarchy: string[]
}

export interface Track {
  id?: number
  serverId: string
  title: string
  artist: string
  bpm: number
  bpmRaw: number
  bpmCorrected: boolean
  key: string
  keyConfidence: number
  energy: number
  genrePrimary: string
  genreSecondary: string | null
  genreConfidence: number
  duration: number
  format: string
  bitrate: number
  sampleRate: number
  dateAdded: Date
  filename: string
  peaksUrl: string
  analysisStatus: AnalysisStatus
  analysisConfidence: number
  userOverrides: Record<string, unknown>
}
