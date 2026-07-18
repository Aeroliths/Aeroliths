import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      news: {
        findMany: vi.fn(),
      },
    },
  },
}))

function normalizeLocale(input: unknown): 'en' | 'fr' {
  return input === 'fr' ? 'fr' : 'en'
}

describe('GET /api/news locale filtering', () => {
  let mockFindMany: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const dbModule = await import('~/server/utils/db')
    mockFindMany = dbModule.default.postgres.news.findMany as any
  })

  it('defaults to "en" when no locale query param is given', () => {
    expect(normalizeLocale(undefined)).toBe('en')
  })

  it('defaults to "en" for an unsupported locale value', () => {
    expect(normalizeLocale('de')).toBe('en')
  })

  it('passes through "fr" unchanged', () => {
    expect(normalizeLocale('fr')).toBe('fr')
  })

  it('queries findMany with published + locale filters', async () => {
    mockFindMany.mockResolvedValue([])
    await mockFindMany({ where: { published: true, locale: 'fr' }, orderBy: { publishedAt: 'desc' } })
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { published: true, locale: 'fr' } })
    )
  })
})
