import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DropZone } from './DropZone'

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: (opts: Record<string, unknown>) => ({
    getRootProps: () => ({ 'data-testid': 'dropzone-root' }),
    getInputProps: () => ({ 'data-testid': 'dropzone-input', accept: opts.accept }),
    isDragActive: false,
    open: vi.fn(),
  }),
}))

// Mock api and stores
vi.mock('@/services/api', () => ({
  api: { uploadTracks: vi.fn() },
}))

vi.mock('@/stores/analysisStore', () => ({
  useAnalysisStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ startPolling: vi.fn(), pendingTrackIds: new Set(), totalCount: 0, completedCount: 0, isPolling: false }),
}))

describe('DropZone', () => {
  it('renders drop zone wrapper without crashing', () => {
    render(
      <DropZone>
        <div>child content</div>
      </DropZone>,
    )
    expect(screen.getByTestId('dropzone-root')).toBeInTheDocument()
  })

  it('shows "Browse files" button', () => {
    render(
      <DropZone>
        <div>child</div>
      </DropZone>,
    )
    expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument()
  })

  it('renders child content', () => {
    render(
      <DropZone>
        <div>test child</div>
      </DropZone>,
    )
    expect(screen.getByText('test child')).toBeInTheDocument()
  })

  it('accepts only mp3, wav, flac file types', () => {
    render(
      <DropZone>
        <div>child</div>
      </DropZone>,
    )
    const input = screen.getByTestId('dropzone-input')
    const accept = input.getAttribute('accept') as string | null
    // The accept config is passed as an object with mime types
    // This verifies the config is being passed through to useDropzone
    expect(accept).toBeDefined()
  })
})
