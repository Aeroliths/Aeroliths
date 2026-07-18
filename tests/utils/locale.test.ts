import { describe, it, expect, vi } from 'vitest'

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return { ...actual, getCookie: vi.fn() }
})

describe('resolveRequestLocale', () => {
  it('returns "fr" when the routing cookie is set to fr', async () => {
    const h3 = await import('h3')
    ;(h3.getCookie as any).mockReturnValue('fr')
    const { resolveRequestLocale } = await import('~/server/utils/locale')
    expect(resolveRequestLocale({} as any)).toBe('fr')
  })

  it('returns "en" when the routing cookie is set to en', async () => {
    const h3 = await import('h3')
    ;(h3.getCookie as any).mockReturnValue('en')
    const { resolveRequestLocale } = await import('~/server/utils/locale')
    expect(resolveRequestLocale({} as any)).toBe('en')
  })

  it('defaults to "en" when the cookie is missing', async () => {
    const h3 = await import('h3')
    ;(h3.getCookie as any).mockReturnValue(undefined)
    const { resolveRequestLocale } = await import('~/server/utils/locale')
    expect(resolveRequestLocale({} as any)).toBe('en')
  })

  it('defaults to "en" for an unsupported cookie value', async () => {
    const h3 = await import('h3')
    ;(h3.getCookie as any).mockReturnValue('de')
    const { resolveRequestLocale } = await import('~/server/utils/locale')
    expect(resolveRequestLocale({} as any)).toBe('en')
  })
})
