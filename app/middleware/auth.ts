export default defineNuxtRouteMiddleware(async (to, from) => {
  // Route middleware runs outside a setup context, so useLocalePath() is not
  // available here - the NuxtApp injection is.
  const { $localePath } = useNuxtApp()
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
    return navigateTo($localePath('/login'))
  }
})
