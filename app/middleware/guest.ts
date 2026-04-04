export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isAuthenticated, initAuth } = useAuth()

  // Try to restore session from httpOnly cookie if not already authenticated
  if (!isAuthenticated.value) {
    try {
      await initAuth()
    } catch (error) {
      // No valid session, stay on guest page
    }
  }

  // If authenticated, redirect to home or play page
  if (isAuthenticated.value) {
    return navigateTo('/play')
  }
})
