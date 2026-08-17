import { describe, it, expect, vi } from 'vitest'

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return { ...actual, getCookie: vi.fn() }
})

// Imported statically on purpose. A first `await import()` inside a test body
// charges the module's cold transform against the test timeout, and h3 does not
// fit in 5s when the whole suite runs in a single fork.
import { getCookie } from 'h3'
import {
  resolveRequestLocale,
  localizePath,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
} from '~~/server/utils/locale'

describe('resolveRequestLocale', () => {
  it('returns "fr" when the routing cookie is set to fr', () => {
    ;(getCookie as any).mockReturnValue('fr')
    expect(resolveRequestLocale({} as any)).toBe('fr')
  })

  it('returns "en" when the routing cookie is set to en', () => {
    ;(getCookie as any).mockReturnValue('en')
    expect(resolveRequestLocale({} as any)).toBe('en')
  })

  it('defaults to "en" when the cookie is missing', () => {
    ;(getCookie as any).mockReturnValue(undefined)
    expect(resolveRequestLocale({} as any)).toBe('en')
  })

  it('defaults to "en" for an unsupported cookie value', () => {
    ;(getCookie as any).mockReturnValue('de')
    expect(resolveRequestLocale({} as any)).toBe('en')
  })
})

describe('localizePath', () => {
  it('leaves the path untouched for the default locale', () => {
    expect(localizePath('/play', 'en')).toBe('/play')
  })

  it('prefixes the path for a non-default locale', () => {
    expect(localizePath('/play', 'fr')).toBe('/fr/play')
  })

  it('keeps the query string after the prefix', () => {
    expect(localizePath('/login?error=oauth_failed', 'fr')).toBe('/fr/login?error=oauth_failed')
  })

  it('falls back to the default locale when the cookie is missing', () => {
    expect(localizePath('/play', undefined)).toBe('/play')
    expect(localizePath('/play', null)).toBe('/play')
    expect(localizePath('/play', '')).toBe('/play')
  })

  // The locale reaches this function from a client cookie, so an unsupported
  // value must never make it into the redirect target.
  it('falls back to the default locale for an unsupported value', () => {
    expect(localizePath('/play', 'de')).toBe('/play')
    expect(localizePath('/play', '../evil')).toBe('/play')
  })

  it('exposes the constants the OAuth routes rely on', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'fr'])
    expect(DEFAULT_LOCALE).toBe('en')
    expect(LOCALE_COOKIE).toBe('aeroliths_locale')
  })
})
