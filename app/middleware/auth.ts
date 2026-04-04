export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isAuthenticated, initAuth } = useAuth()

  // Try to restore session from httpOnly cookie if not already authenticated
  if (!isAuthenticated.value) {
    try {
      await initAuth()
    } catch (error) {
      // Auth initialization failed
    }
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
