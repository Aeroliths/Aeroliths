import { useState } from '#app'

export type CookieConsent = 'accepted' | 'refused' | null

const STORAGE_KEY = 'cookies-consent'

export const useCookieConsent = () => {
  const consent = useState<CookieConsent>('cookies-consent', () => null)

  const loadFromStorage = () => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'accepted' || stored === 'refused') {
      consent.value = stored
    } else {
      consent.value = null
    }
  }

  const setConsent = (value: 'accepted' | 'refused') => {
    consent.value = value
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value)
      window.dispatchEvent(new CustomEvent('cookies-consent-changed', { detail: value }))
    }
  }

  const reset = () => {
    consent.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      window.dispatchEvent(new CustomEvent('cookies-consent-changed', { detail: null }))
    }
  }

  return { consent, loadFromStorage, setConsent, reset }
}
