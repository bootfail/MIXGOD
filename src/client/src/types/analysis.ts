export interface AnalysisResult {
  bpmRaw: number
  bpmCorrected: number
  bpmWasCorrected: boolean
  key: string
  keyScale: string
  keyConfidence: number
  energy: number
  genrePrimary: string
  genreSecondary: string | null
  genreConfidence: number
  danceability: number
  loudness: number
  duration: number
  beatsConfidence: number
}
