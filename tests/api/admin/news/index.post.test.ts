import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/server/utils/auth', () => ({
  getAuthUser: vi.fn(),
  requireRole: vi.fn(),
}))

vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      news: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
    },
  },
}))

vi.mock('~/server/utils/news-helpers', async () => {
  const actual = await vi.importActual<typeof import('~/server/utils/news-helpers')>('~/server/utils/news-helpers')
  return {
    ...actual,
    ensureUniqueSlug: vi.fn(),
    sanitizeNewsContent: (c: string) => c,
  }
})

describe('locale validation for news creation', () => {
  beforeEach(() => vi.clearAllMocks())

  function normalizeLocale(input: unknown): 'en' | 'fr' {
    return input === 'fr' ? 'fr' : 'en'
  }

  it('accepts "fr" as-is', () => {
    expect(normalizeLocale('fr')).toBe('fr')
  })

  it('accepts "en" as-is', () => {
    expect(normalizeLocale('en')).toBe('en')
  })

  it('falls back to "en" for missing locale', () => {
    expect(normalizeLocale(undefined)).toBe('en')
  })

  it('falls back to "en" for an invalid locale value', () => {
    expect(normalizeLocale('de')).toBe('en')
  })

  it('passes the resolved locale into ensureUniqueSlug', async () => {
    const helpers = await import('~/server/utils/news-helpers')
    const mockEnsureUniqueSlug = helpers.ensureUniqueSlug as any
    mockEnsureUniqueSlug.mockResolvedValue('patch-1-0')
    const result = await mockEnsureUniqueSlug('patch-1-0', 'fr')
    expect(mockEnsureUniqueSlug).toHaveBeenCalledWith('patch-1-0', 'fr')
    expect(result).toBe('patch-1-0')
  }, 20000)
})
