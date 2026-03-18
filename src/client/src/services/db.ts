import Dexie, { type EntityTable } from 'dexie'
import type { Track } from '@/types/track'
import type { SmartPlaylist, FilterPreset } from '@/types/project'

export interface ProjectRecord {
  id?: number
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface TrackRecord {
  id?: number
  projectId: number
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
  analysisStatus: string
  analysisConfidence: number
  userOverrides: Record<string, unknown>
}

export interface PlaylistRecord {
  id?: number
  projectId: number
  name: string
  filters: FilterPreset[]
}

class MixGodDB extends Dexie {
  projects!: EntityTable<ProjectRecord, 'id'>
  tracks!: EntityTable<TrackRecord, 'id'>
  playlists!: EntityTable<PlaylistRecord, 'id'>

  constructor() {
    super('MixGodDB')
    this.version(1).stores({
      projects: '++id, name',
      tracks: '++id, projectId, serverId',
      playlists: '++id, projectId',
    })
  }
}

export const db = new MixGodDB()

export function trackToRecord(track: Track, projectId: number): Omit<TrackRecord, 'id'> {
  return {
    projectId,
    serverId: track.serverId,
    title: track.title,
    artist: track.artist,
    bpm: track.bpm,
    bpmRaw: track.bpmRaw,
    bpmCorrected: track.bpmCorrected,
    key: track.key,
    keyConfidence: track.keyConfidence,
    energy: track.energy,
    genrePrimary: track.genrePrimary,
    genreSecondary: track.genreSecondary,
    genreConfidence: track.genreConfidence,
    duration: track.duration,
    format: track.format,
    bitrate: track.bitrate,
    sampleRate: track.sampleRate,
    dateAdded: track.dateAdded,
    filename: track.filename,
    peaksUrl: track.peaksUrl,
    analysisStatus: track.analysisStatus,
    analysisConfidence: track.analysisConfidence,
    userOverrides: track.userOverrides,
  }
}

export function recordToTrack(record: TrackRecord): Track {
  return {
    id: record.id,
    serverId: record.serverId,
    title: record.title,
    artist: record.artist,
    bpm: record.bpm,
    bpmRaw: record.bpmRaw,
    bpmCorrected: record.bpmCorrected,
    key: record.key,
    keyConfidence: record.keyConfidence,
    energy: record.energy,
    genrePrimary: record.genrePrimary,
    genreSecondary: record.genreSecondary,
    genreConfidence: record.genreConfidence,
    duration: record.duration,
    format: record.format,
    bitrate: record.bitrate,
    sampleRate: record.sampleRate,
    dateAdded: new Date(record.dateAdded),
    filename: record.filename,
    peaksUrl: record.peaksUrl,
    analysisStatus: record.analysisStatus as Track['analysisStatus'],
    analysisConfidence: record.analysisConfidence,
    userOverrides: record.userOverrides,
  }
}

export function playlistToRecord(playlist: SmartPlaylist, projectId: number): Omit<PlaylistRecord, 'id'> {
  return {
    projectId,
    name: playlist.name,
    filters: playlist.filters,
  }
}

export function recordToPlaylist(record: PlaylistRecord): SmartPlaylist {
  return {
    id: record.id,
    projectId: record.projectId,
    name: record.name,
    filters: record.filters,
  }
}

interface ExportData {
  version: 1
  project: ProjectRecord
  tracks: Omit<TrackRecord, 'id' | 'projectId'>[]
  playlists: Omit<PlaylistRecord, 'id' | 'projectId'>[]
}

export async function exportProject(projectId: number): Promise<string> {
  const project = await db.projects.get(projectId)
  if (!project) throw new Error('Project not found')

  const tracks = await db.tracks.where('projectId').equals(projectId).toArray()
  const playlists = await db.playlists.where('projectId').equals(projectId).toArray()

  const data: ExportData = {
    version: 1,
    project: { name: project.name, createdAt: project.createdAt, updatedAt: project.updatedAt },
    tracks: tracks.map(({ id: _id, projectId: _pid, ...rest }) => rest),
    playlists: playlists.map(({ id: _id, projectId: _pid, ...rest }) => rest),
  }

  return JSON.stringify(data)
}

export async function importProject(json: string): Promise<number> {
  const data: ExportData = JSON.parse(json)

  const projectId = await db.projects.add({
    name: data.project.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as number

  if (data.tracks.length > 0) {
    await db.tracks.bulkAdd(
      data.tracks.map((t) => ({ ...t, projectId, dateAdded: new Date(t.dateAdded) }))
    )
  }

  if (data.playlists.length > 0) {
    await db.playlists.bulkAdd(
      data.playlists.map((p) => ({ ...p, projectId }))
    )
  }

  return projectId
}
