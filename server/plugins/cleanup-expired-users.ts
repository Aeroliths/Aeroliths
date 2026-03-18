import db from '../utils/db'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const TWO_WEEKS_MS = 14 * ONE_DAY_MS
const THREE_YEARS_MS = 3 * 365 * ONE_DAY_MS

async function cleanupExpiredUsers() {
  const now = new Date()

  try {
    // Delete unverified accounts older than 2 weeks
    const unverifiedResult = await db.postgres.user.deleteMany({
      where: {
        emailVerified: false,
        createdAt: {
          lt: new Date(now.getTime() - TWO_WEEKS_MS),
        },
      },
    })

    if (unverifiedResult.count > 0) {
      console.log(`[Cleanup] Deleted ${unverifiedResult.count} unverified account(s) older than 2 weeks`)
    }

    // Delete inactive accounts (no activity for 3 years)
    const inactiveResult = await db.postgres.user.deleteMany({
      where: {
        emailVerified: true,
        lastActiveAt: {
          lt: new Date(now.getTime() - THREE_YEARS_MS),
        },
      },
    })

    if (inactiveResult.count > 0) {
      console.log(`[Cleanup] Deleted ${inactiveResult.count} inactive account(s) (3+ years)`)
    }
  } catch (error) {
    console.error('[Cleanup] Error during expired users cleanup:', error)
  }
}

export default defineNitroPlugin(() => {
  // Run cleanup once on startup
  cleanupExpiredUsers()

  // Then run daily
  setInterval(cleanupExpiredUsers, ONE_DAY_MS)

  console.log('[Cleanup] Expired users cleanup task scheduled (runs daily)')
})
