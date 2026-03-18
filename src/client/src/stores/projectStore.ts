import { create } from 'zustand'
import { db, trackToRecord, recordToTrack, recordToPlaylist, exportProject, importProject, type ProjectRecord } from '@/services/db'
import { useLibraryStore } from '@/stores/libraryStore'

interface ProjectState {
  currentProjectId: number | null
  projects: ProjectRecord[]
  isLoading: boolean
  initialized: boolean
}

interface ProjectActions {
  init: () => Promise<void>
  createProject: (name: string) => Promise<number>
  loadProject: (id: number) => Promise<void>
  loadProjects: () => Promise<void>
  deleteProject: (id: number) => Promise<void>
  exportProject: () => Promise<void>
  importProject: (file: File) => Promise<void>
  saveCurrentState: () => Promise<void>
}

type ProjectStore = ProjectState & ProjectActions

let saveTimeout: ReturnType<typeof setTimeout> | null = null

export const useProjectStore = create<ProjectStore>((set, get) => ({
  currentProjectId: null,
  projects: [],
  isLoading: false,
  initialized: false,

  async init() {
    if (get().initialized) return
    set({ isLoading: true })

    const projects = await db.projects.toArray()

    if (projects.length === 0) {
      // Create default project
      const id = await db.projects.add({
        name: 'Untitled Mix',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const project = await db.projects.get(id)
      set({
        projects: project ? [project] : [],
        currentProjectId: id as number,
        isLoading: false,
        initialized: true,
      })
    } else if (projects.length === 1) {
      set({ projects, currentProjectId: projects[0].id!, isLoading: false, initialized: true })
      await get().loadProject(projects[0].id!)
    } else {
      set({ projects, isLoading: false, initialized: true })
      // Load most recently updated
      const sorted = [...projects].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      await get().loadProject(sorted[0].id!)
    }

    // Set up auto-save subscription
    useLibraryStore.subscribe(() => {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        void get().saveCurrentState()
      }, 2000)
    })
  },

  async createProject(name) {
    const id = await db.projects.add({
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await get().loadProjects()
    set({ currentProjectId: id as number })
    useLibraryStore.setState({ tracks: [], playlists: [], selectedTrackId: null })
    return id as number
  },

  async loadProject(id) {
    set({ isLoading: true, currentProjectId: id })
    const tracks = await db.tracks.where('projectId').equals(id).toArray()
    const playlists = await db.playlists.where('projectId').equals(id).toArray()

    useLibraryStore.setState({
      tracks: tracks.map(recordToTrack),
      playlists: playlists.map(recordToPlaylist),
      selectedTrackId: null,
    })
    set({ isLoading: false })
  },

  async loadProjects() {
    const projects = await db.projects.toArray()
    set({ projects })
  },

  async deleteProject(id) {
    await db.tracks.where('projectId').equals(id).delete()
    await db.playlists.where('projectId').equals(id).delete()
    await db.projects.delete(id)
    await get().loadProjects()

    if (get().currentProjectId === id) {
      const remaining = get().projects
      if (remaining.length > 0) {
        await get().loadProject(remaining[0].id!)
      } else {
        await get().createProject('Untitled Mix')
      }
    }
  },

  async exportProject() {
    const projectId = get().currentProjectId
    if (!projectId) return

    // Save current state first
    await get().saveCurrentState()

    const json = await exportProject(projectId)
    const project = get().projects.find((p) => p.id === projectId)
    const filename = `${project?.name ?? 'project'}.mixgod`

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },

  async importProject(file) {
    const json = await file.text()
    const projectId = await importProject(json)
    await get().loadProjects()
    await get().loadProject(projectId)
  },

  async saveCurrentState() {
    const projectId = get().currentProjectId
    if (!projectId) return

    const { tracks, playlists } = useLibraryStore.getState()

    // Update project timestamp
    await db.projects.update(projectId, { updatedAt: new Date() })

    // Clear and re-add tracks for this project
    await db.tracks.where('projectId').equals(projectId).delete()
    if (tracks.length > 0) {
      await db.tracks.bulkAdd(tracks.map((t) => trackToRecord(t, projectId)))
    }

    // Clear and re-add playlists
    await db.playlists.where('projectId').equals(projectId).delete()
    if (playlists.length > 0) {
      await db.playlists.bulkAdd(
        playlists.map((p) => ({
          projectId,
          name: p.name,
          filters: p.filters,
        }))
      )
    }
  },
}))
