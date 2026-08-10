import type { H3Event } from 'h3'
import { getCookie } from 'h3'

export type AppLocale = 'en' | 'fr'

// Mirrors the `i18n` block of nuxt.config.ts, which Nitro cannot import.
// Keep these in sync with it.
export const SUPPORTED_LOCALES: AppLocale[] = ['en', 'fr']
export const DEFAULT_LOCALE: AppLocale = 'en'
export const LOCALE_COOKIE = 'aeroliths_locale'

// Reads the routing cookie set by @nuxtjs/i18n's detectBrowserLanguage config
// (nuxt.config.ts i18n.detectBrowserLanguage.cookieKey) to resolve which
// language a not-yet-authenticated request should receive email content in.
export function resolveRequestLocale(event: H3Event): AppLocale {
  const cookieLocale = getCookie(event, LOCALE_COOKIE)
  return cookieLocale === 'fr' ? 'fr' : 'en'
}

/**
 * Turns an unprefixed app path into one for the given locale, matching the
 * `prefix_except_default` routing strategy: the default locale keeps the bare
 * path, every other locale gets a `/<code>` prefix.
 *
 * Anything not in SUPPORTED_LOCALES falls back to the default. The locale
 * ultimately comes from a client cookie, so the allow-list is what keeps a
 * crafted value out of the redirect target.
 */
export function localizePath(path: string, locale: string | undefined | null): string {
  const resolved =
    locale && (SUPPORTED_LOCALES as string[]).includes(locale) ? locale : DEFAULT_LOCALE
  return resolved === DEFAULT_LOCALE ? path : `/${resolved}${path}`
}
