// Redirect legacy upload paths to the /api/uploads/ route
// Old paths: /lithos/xxx.png, /elements/xxx.png, /profile_pictures/xxx.png
// New paths: /api/uploads/lithos/xxx.png, etc.
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  const legacyPrefixes = ['/lithos/', '/elements/', '/profile_pictures/']
  for (const prefix of legacyPrefixes) {
    if (path.startsWith(prefix)) {
      return sendRedirect(event, `/api/uploads${path}`, 301)
    }
  }
})
