export type SourcePlatform = 'youtube' | 'soundcloud'

const YOUTUBE_REGEX = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)[\w-]+/
const SOUNDCLOUD_REGEX = /^https?:\/\/(www\.|m\.)?soundcloud\.com\/[\w-]+\/[\w-]+/

/**
 * Validates a URL and returns the detected platform, or null if invalid.
 */
export function validateUrl(url: string): SourcePlatform | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  if (YOUTUBE_REGEX.test(trimmed)) return 'youtube'
  if (SOUNDCLOUD_REGEX.test(trimmed)) return 'soundcloud'

  return null
}
