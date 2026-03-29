export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (import.meta.server) {
    return
  }

  const { isAuthenticated, initAuth } = useAuth()

  // Try to restore session from httpOnly cookie if not already authenticated
  if (!isAuthenticated.value) {
    try {
      await initAuth()
    } catch (error) {
      console.error('Auth initialization failed:', error)
    }
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
