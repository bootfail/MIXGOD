import { useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { AppShell } from '@/components/layout/AppShell'
import { DropZone } from '@/components/upload/DropZone'
import { UploadProgress } from '@/components/upload/UploadProgress'
import { TrackTable } from '@/components/library/TrackTable'
import { TrackCardGrid } from '@/components/library/TrackCard'
import { ViewToggle } from '@/components/library/ViewToggle'
import { SmartPlaylists } from '@/components/library/SmartPlaylists'
import { useLibraryStore } from '@/stores/libraryStore'
import { api } from '@/services/api'
import type { Track } from '@/types/track'

function LibraryPanel() {
  const viewMode = useLibraryStore((s) => s.viewMode)
  const searchQuery = useLibraryStore((s) => s.searchQuery)
  const setSearch = useLibraryStore((s) => s.setSearch)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-bg-elevated shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Library</span>
          <ViewToggle />
        </div>
        <input
          type="text"
          className="w-48 bg-bg-elevated border border-bg-hover rounded px-2 py-1 text-xs text-gray-300 outline-none focus:border-neon-cyan placeholder-gray-600"
          placeholder="Search tracks..."
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex-1 min-h-0">
        {viewMode === 'table' ? <TrackTable /> : <TrackCardGrid />}
      </div>
    </div>
  )
}

function App() {
  const addTracks = useLibraryStore((s) => s.addTracks)

  const handleTracksUploaded = useCallback(async (uploadedInfo: { serverId: string; title: string }[]) => {
    // Fetch full track data after upload
    try {
      const allTracks = await api.getTracks()
      const newTracks: Track[] = allTracks.filter((t) =>
        uploadedInfo.some((u) => u.serverId === t.serverId)
      )
      addTracks(newTracks)
    } catch {
      // If fetch fails, add minimal track data
      const minimalTracks: Track[] = uploadedInfo.map((u) => ({
        serverId: u.serverId,
        title: u.title,
        artist: '',
        bpm: 0,
        bpmRaw: 0,
        bpmCorrected: false,
        key: '',
        keyConfidence: 0,
        energy: 0,
        genrePrimary: '',
        genreSecondary: null,
        genreConfidence: 0,
        duration: 0,
        format: '',
        bitrate: 0,
        sampleRate: 0,
        dateAdded: new Date(),
        filename: u.title,
        peaksUrl: '',
        analysisStatus: 'queued',
        analysisConfidence: 0,
        userOverrides: {},
      }))
      addTracks(minimalTracks)
    }
  }, [addTracks])

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <Header />
      <UploadProgress />
      <DropZone onTracksUploaded={handleTracksUploaded}>
        <AppShell
          sidebar={<SmartPlaylists />}
          main={<LibraryPanel />}
        />
      </DropZone>
    </div>
  )
}

export default App
