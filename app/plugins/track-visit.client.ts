export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return
  if (sessionStorage.getItem('visit-tracked')) return
  $fetch('/api/visits', { method: 'POST', credentials: 'include' })
    .then(() => sessionStorage.setItem('visit-tracked', '1'))
    .catch(() => {})
})
