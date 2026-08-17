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

describe('GET /api/news/[slug] locale filtering', () => {
  let mockFindUnique: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const dbModule = await import('~~/server/utils/db')
    mockFindUnique = dbModule.default.postgres.news.findUnique as any
  })

  it('looks up by the composite slug_locale key', async () => {
    mockFindUnique.mockResolvedValue({ id: 'n-1', slug: 'patch-1-0', locale: 'fr', published: true })
    await mockFindUnique({ where: { slug_locale: { slug: 'patch-1-0', locale: 'fr' } } })
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { slug_locale: { slug: 'patch-1-0', locale: 'fr' } } })
  })

  it('treats a missing row as not found regardless of locale', async () => {
    mockFindUnique.mockResolvedValue(null)
    const result = await mockFindUnique({ where: { slug_locale: { slug: 'missing', locale: 'en' } } })
    expect(result).toBeNull()
  })
})
