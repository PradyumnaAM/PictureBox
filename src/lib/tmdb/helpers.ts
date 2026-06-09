import type { MediaType } from '@/types/tmdb'

const IMAGE_BASE = 'https://image.tmdb.org/t/p'

// ----------------------------------------------------------------------------
// Image URLs
// ----------------------------------------------------------------------------

const POSTER_SIZES = {
  sm: 'w185',
  md: 'w342',
  lg: 'w500',
  original: 'original',
} as const

const BACKDROP_SIZES = {
  md: 'w780',
  lg: 'w1280',
  original: 'original',
} as const

export function getPosterUrl(
  path: string | null | undefined,
  size: keyof typeof POSTER_SIZES,
): string | null {
  if (!path) return null
  return `${IMAGE_BASE}/${POSTER_SIZES[size]}${path}`
}

export function getBackdropUrl(
  path: string | null | undefined,
  size: keyof typeof BACKDROP_SIZES,
): string | null {
  if (!path) return null
  return `${IMAGE_BASE}/${BACKDROP_SIZES[size]}${path}`
}

export function getProfileUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return `${IMAGE_BASE}/w185${path}`
}

// ----------------------------------------------------------------------------
// Formatting
// ----------------------------------------------------------------------------

export function formatRuntime(minutes: number): string {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatReleaseYear(dateString: string | null | undefined): string {
  if (!dateString) return ''
  return dateString.slice(0, 4)
}

export function getMediaTypeLabel(type: MediaType): string {
  return type === 'movie' ? 'Film' : 'TV Series'
}

// ----------------------------------------------------------------------------
// Slugs  —  format: "{id}-{hyphenated-title}"
// e.g. slugify(550, "Fight Club") → "550-fight-club"
// ----------------------------------------------------------------------------

export function slugify(id: number, title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFD')                      // decompose accented chars
    .replace(/[̀-ͯ]/g, '')       // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')         // keep alphanumeric, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-')                  // spaces → hyphens
    .replace(/-+/g, '-')                   // collapse consecutive hyphens
  return `${id}-${slug}`
}

export function deslugify(slug: string): { id: number; title: string } {
  const dashIndex = slug.indexOf('-')
  if (dashIndex === -1) {
    return { id: Number(slug), title: '' }
  }
  const id = Number(slug.slice(0, dashIndex))
  const title = slug.slice(dashIndex + 1)
  return { id, title }
}
