import { describe, it, expect } from 'vitest'
import { validateUrl } from '@/utils/urlValidation'

describe('URL Validation', () => {
  describe('YouTube URLs', () => {
    it('accepts youtube.com/watch?v= pattern', () => {
      expect(validateUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube')
    })

    it('accepts youtube.com/watch?v= without www', () => {
      expect(validateUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube')
    })

    it('accepts youtu.be/ short links', () => {
      expect(validateUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube')
    })

    it('accepts youtube.com/shorts/ pattern', () => {
      expect(validateUrl('https://www.youtube.com/shorts/abc123DEF')).toBe('youtube')
    })

    it('accepts music.youtube.com/watch pattern', () => {
      expect(validateUrl('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube')
    })

    it('accepts http (non-https) YouTube URLs', () => {
      expect(validateUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube')
    })
  })

  describe('SoundCloud URLs', () => {
    it('accepts soundcloud.com/artist/track pattern', () => {
      expect(validateUrl('https://soundcloud.com/artist-name/track-name')).toBe('soundcloud')
    })

    it('accepts www.soundcloud.com pattern', () => {
      expect(validateUrl('https://www.soundcloud.com/artist/track')).toBe('soundcloud')
    })

    it('accepts m.soundcloud.com (mobile) pattern', () => {
      expect(validateUrl('https://m.soundcloud.com/artist/track')).toBe('soundcloud')
    })

    it('accepts http (non-https) SoundCloud URLs', () => {
      expect(validateUrl('http://soundcloud.com/user123/cool-track')).toBe('soundcloud')
    })
  })

  describe('Invalid URLs', () => {
    it('rejects empty string', () => {
      expect(validateUrl('')).toBeNull()
    })

    it('rejects whitespace-only string', () => {
      expect(validateUrl('   ')).toBeNull()
    })

    it('rejects random text', () => {
      expect(validateUrl('not a url at all')).toBeNull()
    })

    it('rejects Spotify URLs', () => {
      expect(validateUrl('https://open.spotify.com/track/abc123')).toBeNull()
    })

    it('rejects generic website URLs', () => {
      expect(validateUrl('https://example.com/some-page')).toBeNull()
    })

    it('rejects soundcloud.com without track path', () => {
      expect(validateUrl('https://soundcloud.com/')).toBeNull()
    })

    it('rejects youtube.com without video ID path', () => {
      expect(validateUrl('https://youtube.com/')).toBeNull()
    })
  })

  describe('Mixed valid/invalid URLs', () => {
    it('correctly identifies each URL type', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://soundcloud.com/artist/track',
        'not-a-url',
        'https://spotify.com/track/abc',
        'https://youtu.be/abc123',
      ]

      const results = urls.map(validateUrl)
      expect(results).toEqual(['youtube', 'soundcloud', null, null, 'youtube'])
    })
  })

  describe('Edge cases', () => {
    it('trims whitespace before validating', () => {
      expect(validateUrl('  https://www.youtube.com/watch?v=abc  ')).toBe('youtube')
    })

    it('handles URLs with extra query parameters', () => {
      expect(validateUrl('https://www.youtube.com/watch?v=abc&list=PLxyz&index=5')).toBe('youtube')
    })

    it('handles SoundCloud URLs with hyphens and numbers', () => {
      expect(validateUrl('https://soundcloud.com/dj-123/track-name-2024')).toBe('soundcloud')
    })
  })
})
