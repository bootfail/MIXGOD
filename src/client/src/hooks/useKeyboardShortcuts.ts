import { useEffect } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'

interface ShortcutCallbacks {
  onExport: () => void
  onToggleShortcuts: () => void
}

export function useKeyboardShortcuts({ onExport, onToggleShortcuts }: ShortcutCallbacks) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Always-active shortcuts (even in inputs)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault()
          onExport()
          return
        }
        if (e.key === 'f') {
          e.preventDefault()
          // Focus search input
          const search = document.querySelector<HTMLInputElement>('input[placeholder="Search tracks..."]')
          search?.focus()
          return
        }
        if (e.key === 'a' && !isInput) {
          e.preventDefault()
          // Select all not implemented yet
          return
        }
      }

      // Skip if in input field
      if (isInput) return

      const player = usePlayerStore.getState()
      const library = useLibraryStore.getState()

      switch (e.key) {
        case ' ':
          e.preventDefault()
          player.togglePlay()
          break
        case 'ArrowUp': {
          e.preventDefault()
          const tracks = library.getFilteredTracks()
          const idx = tracks.findIndex((t) => t.serverId === library.selectedTrackId)
          if (idx > 0) library.selectTrack(tracks[idx - 1].serverId)
          else if (idx === -1 && tracks.length > 0) library.selectTrack(tracks[0].serverId)
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          const tracks = library.getFilteredTracks()
          const idx = tracks.findIndex((t) => t.serverId === library.selectedTrackId)
          if (idx < tracks.length - 1) library.selectTrack(tracks[idx + 1].serverId)
          else if (idx === -1 && tracks.length > 0) library.selectTrack(tracks[0].serverId)
          break
        }
        case 'ArrowLeft':
          e.preventDefault()
          player.seek(Math.max(0, player.currentTime - (e.shiftKey ? 30 : 5)))
          break
        case 'ArrowRight':
          e.preventDefault()
          player.seek(Math.min(player.duration, player.currentTime + (e.shiftKey ? 30 : 5)))
          break
        case 'Enter':
          if (library.selectedTrackId) {
            player.play(library.selectedTrackId)
          }
          break
        case 'Delete':
        case 'Backspace':
          if (library.selectedTrackId) {
            library.removeTrack(library.selectedTrackId)
          }
          break
        case 'm':
        case 'M':
          player.toggleMute()
          break
        case '[':
          player.setVolume(player.volume - 0.05)
          break
        case ']':
          player.setVolume(player.volume + 0.05)
          break
        case '?':
          onToggleShortcuts()
          break
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onExport, onToggleShortcuts])
}
