import { Header } from '@/components/layout/Header'
import { AppShell } from '@/components/layout/AppShell'
import { DropZone } from '@/components/upload/DropZone'
import { UploadProgress } from '@/components/upload/UploadProgress'

function App() {
  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <Header />
      <UploadProgress />
      <DropZone>
        <AppShell
          main={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 text-lg neon-shimmer bg-clip-text">
                  Drop audio files here to get started
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  MP3, WAV, FLAC
                </p>
              </div>
            </div>
          }
        />
      </DropZone>
    </div>
  )
}

export default App
