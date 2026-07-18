import type { H3Event } from 'h3'
import { getCookie } from 'h3'

export type AppLocale = 'en' | 'fr'

// Reads the routing cookie set by @nuxtjs/i18n's detectBrowserLanguage config
// (nuxt.config.ts i18n.detectBrowserLanguage.cookieKey) to resolve which
// language a not-yet-authenticated request should receive email content in.
export function resolveRequestLocale(event: H3Event): AppLocale {
  const cookieLocale = getCookie(event, 'aeroliths_locale')
  return cookieLocale === 'fr' ? 'fr' : 'en'
}
