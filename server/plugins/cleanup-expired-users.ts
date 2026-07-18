import db from '../utils/db'
import {
  sendDeletionReminderEmail,
  sendInactivityWarningEmail,
} from '../utils/email'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const TWO_WEEKS_MS = 14 * ONE_DAY_MS
const THREE_YEARS_MS = 3 * 365 * ONE_DAY_MS
const SIX_MONTHS_MS = 6 * 30 * ONE_DAY_MS
const TWO_MONTHS_MS = 2 * 30 * ONE_DAY_MS
const ONE_MONTH_MS = 30 * ONE_DAY_MS
const ONE_WEEK_MS = 7 * ONE_DAY_MS
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS

async function cleanupExpiredUsers() {
  const now = new Date()

  try {
    // Delete unverified accounts older than 2 weeks (except admins)
    const unverifiedResult = await db.postgres.user.deleteMany({
      where: {
        emailVerified: false,
        role: { name: { not: 'admin' } },
        createdAt: {
          lt: new Date(now.getTime() - TWO_WEEKS_MS),
        },
      },
    })

    if (unverifiedResult.count > 0) {
      console.log(`[Cleanup] Deleted ${unverifiedResult.count} unverified account(s) older than 2 weeks`)
    }

    // Delete accounts that requested deletion 30+ days ago (except admins)
    const deletionRequestedResult = await db.postgres.user.deleteMany({
      where: {
        emailVerified: true,
        role: { name: { not: 'admin' } },
        deletionRequestedAt: {
          lt: new Date(now.getTime() - THIRTY_DAYS_MS),
          not: null,
        },
      },
    })

    if (deletionRequestedResult.count > 0) {
      console.log(`[Cleanup] Deleted ${deletionRequestedResult.count} account(s) that requested deletion 30+ days ago`)
    }

    // Send deletion reminder (1 week before the 30-day deadline) for pending deletion requests
    const pendingDeletionAccounts = await db.postgres.user.findMany({
      where: {
        emailVerified: true,
        deletionRequestedAt: {
          not: null,
          lt: new Date(now.getTime() - (THIRTY_DAYS_MS - ONE_WEEK_MS)), // requested more than 23 days ago
          gt: new Date(now.getTime() - THIRTY_DAYS_MS), // but not yet past 30 days
        },
        deletionReminderSent: false,
      },
      select: { id: true, email: true, username: true, locale: true, deletionRequestedAt: true },
    })

    for (const account of pendingDeletionAccounts) {
      const deletionDate = new Date(account.deletionRequestedAt!.getTime() + THIRTY_DAYS_MS)
      try {
        await sendDeletionReminderEmail(account.email, account.username, deletionDate, account.locale === 'fr' ? 'fr' : 'en')
        await db.postgres.user.update({
          where: { id: account.id },
          data: { deletionReminderSent: true },
        })
      } catch (err) {
        console.error(`[Cleanup] Failed to send deletion reminder to ${account.email}:`, err)
      }
    }

    // Delete inactive accounts (no activity for 3 years, except admins)
    const inactiveResult = await db.postgres.user.deleteMany({
      where: {
        emailVerified: true,
        role: { name: { not: 'admin' } },
        deletionRequestedAt: null,
        lastActiveAt: {
          lt: new Date(now.getTime() - THREE_YEARS_MS),
        },
      },
    })

    if (inactiveResult.count > 0) {
      console.log(`[Cleanup] Deleted ${inactiveResult.count} inactive account(s) (3+ years)`)
    }

    // --- Inactivity warning emails ---

    // 6-month warning
    const accounts6Months = await db.postgres.user.findMany({
      where: {
        emailVerified: true,
        deletionRequestedAt: null,
        warning6MonthsSent: false,
        lastActiveAt: { lt: new Date(now.getTime() - SIX_MONTHS_MS) },
      },
      select: { id: true, email: true, username: true, locale: true, lastActiveAt: true },
    })
    for (const account of accounts6Months) {
      const deletionDate = new Date(account.lastActiveAt.getTime() + THREE_YEARS_MS)
      try {
        await sendInactivityWarningEmail(account.email, account.username, '6months', deletionDate, account.locale === 'fr' ? 'fr' : 'en')
        await db.postgres.user.update({ where: { id: account.id }, data: { warning6MonthsSent: true } })
      } catch (err) {
        console.error(`[Cleanup] Failed to send 6-month warning to ${account.email}:`, err)
      }
    }

    // 2-month before deletion warning (inactive for 3 years - 2 months = 34 months)
    const accounts2Months = await db.postgres.user.findMany({
      where: {
        emailVerified: true,
        deletionRequestedAt: null,
        warning2MonthsSent: false,
        lastActiveAt: { lt: new Date(now.getTime() - (THREE_YEARS_MS - TWO_MONTHS_MS)) },
      },
      select: { id: true, email: true, username: true, locale: true, lastActiveAt: true },
    })
    for (const account of accounts2Months) {
      const deletionDate = new Date(account.lastActiveAt.getTime() + THREE_YEARS_MS)
      try {
        await sendInactivityWarningEmail(account.email, account.username, '2months', deletionDate, account.locale === 'fr' ? 'fr' : 'en')
        await db.postgres.user.update({ where: { id: account.id }, data: { warning2MonthsSent: true } })
      } catch (err) {
        console.error(`[Cleanup] Failed to send 2-month warning to ${account.email}:`, err)
      }
    }

    // 1-month before deletion warning
    const accounts1Month = await db.postgres.user.findMany({
      where: {
        emailVerified: true,
        deletionRequestedAt: null,
        warning1MonthSent: false,
        lastActiveAt: { lt: new Date(now.getTime() - (THREE_YEARS_MS - ONE_MONTH_MS)) },
      },
      select: { id: true, email: true, username: true, locale: true, lastActiveAt: true },
    })
    for (const account of accounts1Month) {
      const deletionDate = new Date(account.lastActiveAt.getTime() + THREE_YEARS_MS)
      try {
        await sendInactivityWarningEmail(account.email, account.username, '1month', deletionDate, account.locale === 'fr' ? 'fr' : 'en')
        await db.postgres.user.update({ where: { id: account.id }, data: { warning1MonthSent: true } })
      } catch (err) {
        console.error(`[Cleanup] Failed to send 1-month warning to ${account.email}:`, err)
      }
    }

    // 1-week before deletion warning
    const accounts1Week = await db.postgres.user.findMany({
      where: {
        emailVerified: true,
        deletionRequestedAt: null,
        warning1WeekSent: false,
        lastActiveAt: { lt: new Date(now.getTime() - (THREE_YEARS_MS - ONE_WEEK_MS)) },
      },
      select: { id: true, email: true, username: true, locale: true, lastActiveAt: true },
    })
    for (const account of accounts1Week) {
      const deletionDate = new Date(account.lastActiveAt.getTime() + THREE_YEARS_MS)
      try {
        await sendInactivityWarningEmail(account.email, account.username, '1week', deletionDate, account.locale === 'fr' ? 'fr' : 'en')
        await db.postgres.user.update({ where: { id: account.id }, data: { warning1WeekSent: true } })
      } catch (err) {
        console.error(`[Cleanup] Failed to send 1-week warning to ${account.email}:`, err)
      }
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
