export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return

  const sendVisit = () => {
    if (sessionStorage.getItem('visit-tracked')) return
    $fetch('/api/visits', { method: 'POST', credentials: 'include' })
      .then(() => sessionStorage.setItem('visit-tracked', '1'))
      .catch(() => {})
  }

  const tryTrack = () => {
    const consent = localStorage.getItem('cookies-consent')
    if (consent === 'accepted') sendVisit()
  }

  tryTrack()

  window.addEventListener('cookies-consent-changed', (e: Event) => {
    if ((e as CustomEvent).detail === 'accepted') sendVisit()
  })
})
