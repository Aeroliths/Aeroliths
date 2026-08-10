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

describe('localizePath', () => {
  it('leaves the path untouched for the default locale', async () => {
    const { localizePath } = await import('~/server/utils/locale')
    expect(localizePath('/play', 'en')).toBe('/play')
  })

  it('prefixes the path for a non-default locale', async () => {
    const { localizePath } = await import('~/server/utils/locale')
    expect(localizePath('/play', 'fr')).toBe('/fr/play')
  })

  it('keeps the query string after the prefix', async () => {
    const { localizePath } = await import('~/server/utils/locale')
    expect(localizePath('/login?error=oauth_failed', 'fr')).toBe('/fr/login?error=oauth_failed')
  })

  it('falls back to the default locale when the cookie is missing', async () => {
    const { localizePath } = await import('~/server/utils/locale')
    expect(localizePath('/play', undefined)).toBe('/play')
    expect(localizePath('/play', null)).toBe('/play')
    expect(localizePath('/play', '')).toBe('/play')
  })

  // The locale reaches this function from a client cookie, so an unsupported
  // value must never make it into the redirect target.
  it('falls back to the default locale for an unsupported value', async () => {
    const { localizePath } = await import('~/server/utils/locale')
    expect(localizePath('/play', 'de')).toBe('/play')
    expect(localizePath('/play', '../evil')).toBe('/play')
  })

  it('exposes the constants the OAuth routes rely on', async () => {
    const { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE } = await import(
      '~/server/utils/locale'
    )
    expect(SUPPORTED_LOCALES).toEqual(['en', 'fr'])
    expect(DEFAULT_LOCALE).toBe('en')
    expect(LOCALE_COOKIE).toBe('aeroliths_locale')
  })
})
