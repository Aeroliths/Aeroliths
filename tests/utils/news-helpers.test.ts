import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~~/server/utils/db', () => ({
  default: {
    postgres: {
      news: {
        findUnique: vi.fn(),
      },
    },
  },
}))

// Imported statically on purpose. A first `await import()` inside a hook charges
// the module's cold transform against the hook timeout, and news-helpers pulls
// in isomorphic-dompurify, which does not fit in 10s when the whole suite runs
// in a single fork.
import { ensureUniqueSlug } from '~~/server/utils/news-helpers'
import db from '~~/server/utils/db'

describe('ensureUniqueSlug', () => {
  const mockFindUnique = db.postgres.news.findUnique as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the base slug when it is free for that locale', async () => {
    mockFindUnique.mockResolvedValue(null)
    const slug = await ensureUniqueSlug('patch-1-0', 'en')
    expect(slug).toBe('patch-1-0')
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { slug_locale: { slug: 'patch-1-0', locale: 'en' } } })
  })

  it('appends a numeric suffix when the slug is taken in that locale', async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: 'existing-1' })
      .mockResolvedValueOnce(null)
    const slug = await ensureUniqueSlug('patch-1-0', 'en')
    expect(slug).toBe('patch-1-0-2')
  })

  it('allows the same slug to exist in a different locale', async () => {
    // fr lookup for the same base slug finds nothing taken, even though en has it
    mockFindUnique.mockResolvedValue(null)
    const slug = await ensureUniqueSlug('patch-1-0', 'fr')
    expect(slug).toBe('patch-1-0')
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { slug_locale: { slug: 'patch-1-0', locale: 'fr' } } })
  })

  it('returns the candidate when it belongs to the excluded id', async () => {
    mockFindUnique.mockResolvedValue({ id: 'self-id' })
    const slug = await ensureUniqueSlug('patch-1-0', 'en', 'self-id')
    expect(slug).toBe('patch-1-0')
  })
})
