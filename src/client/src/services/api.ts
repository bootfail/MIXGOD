import type { Track } from '@/types/track'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

interface TrackStatusResponse {
  analysisStatus: string
  analysisResult: {
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
    duration: number
  } | null
}

interface ApiTrack {
  id: string
  title: string
  artist: string
  filename: string
  format: string
  bitrate: number
  sampleRate: number
  duration: number
  analysisStatus: string
  bpm: number
  bpmRaw: number
  bpmCorrected: boolean
  key: string
  keyConfidence: number
  energy: number
  genrePrimary: string
  genreSecondary: string | null
  genreConfidence: number
  analysisConfidence: number
  dateAdded: string
}

function mapApiTrack(t: ApiTrack): Track {
  return {
    serverId: t.id,
    title: t.title,
    artist: t.artist,
    bpm: t.bpm,
    bpmRaw: t.bpmRaw,
    bpmCorrected: t.bpmCorrected,
    key: t.key,
    keyConfidence: t.keyConfidence,
    energy: t.energy,
    genrePrimary: t.genrePrimary,
    genreSecondary: t.genreSecondary,
    genreConfidence: t.genreConfidence,
    duration: t.duration,
    format: t.format,
    bitrate: t.bitrate,
    sampleRate: t.sampleRate,
    dateAdded: new Date(t.dateAdded),
    filename: t.filename,
    peaksUrl: `${BASE_URL}/api/tracks/${t.id}/peaks`,
    analysisStatus: t.analysisStatus as Track['analysisStatus'],
    analysisConfidence: t.analysisConfidence,
    userOverrides: {},
  }
}

export const api = {
  async uploadTracks(files: File[]): Promise<Track[]> {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }

    const response = await fetch(`${BASE_URL}/api/tracks/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const tracks: ApiTrack[] = await response.json()
    return tracks.map(mapApiTrack)
  },

  async getTracks(projectId?: string): Promise<Track[]> {
    const url = projectId
      ? `${BASE_URL}/api/tracks?projectId=${encodeURIComponent(projectId)}`
      : `${BASE_URL}/api/tracks`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch tracks: ${response.status}`)
    }

    const tracks: ApiTrack[] = await response.json()
    return tracks.map(mapApiTrack)
  },

  async getTrackStatus(trackId: string): Promise<TrackStatusResponse> {
    const response = await fetch(`${BASE_URL}/api/tracks/${trackId}/status`)
    if (!response.ok) {
      throw new Error(`Failed to fetch track status: ${response.status}`)
    }
    return response.json()
  },

  getTrackAudioUrl(trackId: string): string {
    return `${BASE_URL}/api/tracks/${trackId}/audio`
  },

  async getTrackPeaks(trackId: string): Promise<{ data: number[] }> {
    const response = await fetch(`${BASE_URL}/api/tracks/${trackId}/peaks`)
    if (!response.ok) {
      throw new Error(`Failed to fetch peaks: ${response.status}`)
    }
    return response.json()
  },

  async updateTrack(trackId: string, updates: Partial<Track>): Promise<Track> {
    const response = await fetch(`${BASE_URL}/api/tracks/${trackId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error(`Failed to update track: ${response.status}`)
    }
    const track: ApiTrack = await response.json()
    return mapApiTrack(track)
  },

  async deleteTrack(trackId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/tracks/${trackId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`Failed to delete track: ${response.status}`)
    }
  },
}
