import { randomUUID } from 'node:crypto'

// Records an anonymous site visit. Public endpoint (no auth required).
// One row inserted per call; the client throttles to one ping per session.
// A long-lived `aer_vid` cookie identifies a unique visitor across sessions.
export default defineEventHandler(async (event) => {
  try {
    rateLimit(event, { key: 'visit', limit: 60, windowMs: 60 * 1000 })

    let visitorId = getCookie(event, 'aer_vid')
    if (!visitorId || visitorId.length > 64) {
      visitorId = randomUUID()
      setCookie(event, 'aer_vid', visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      })
    }

    let userId: string | null = null
    try {
      const auth = getAuthUser(event)
      userId = auth.userId
    } catch {
      userId = null
    }

    await db.postgres.siteVisit.create({
      data: { visitorId, userId },
    })

    return { success: true }
  } catch (error: any) {
    if (error.statusCode === 429) throw error
    console.error('Error recording visit:', error)
    return { success: false }
  }
})
