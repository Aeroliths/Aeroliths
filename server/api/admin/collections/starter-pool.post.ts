// API route to give the starter pool to every player who never received it (admin only)
const BATCH_SIZE = 100

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    // Nothing to hand out: bail before scanning users, otherwise the loop below
    // would keep re-reading the same never-served batch.
    const starterCount = await db.postgres.lithos.count({ where: { isStarter: true } })
    if (starterCount === 0) {
      return {
        success: true,
        message: 'No lithos is flagged as starter, nothing was given',
        data: { usersUpdated: 0 },
      }
    }

    let usersUpdated = 0

    // Served players drop out of the filter, so each pass reads the next batch.
    for (;;) {
      const users = await db.postgres.user.findMany({
        where: { starterPoolGrantedAt: null },
        select: { id: true },
        take: BATCH_SIZE,
      })

      if (users.length === 0) break

      let grantedInBatch = 0
      for (const u of users) {
        const { granted } = await grantStarterPool(u.id)
        if (granted) grantedInBatch++
      }

      usersUpdated += grantedInBatch

      // A batch that granted nothing would come back identical: stop here.
      if (grantedInBatch === 0) break
      if (users.length < BATCH_SIZE) break
    }

    return {
      success: true,
      message: `Starter pool given to ${usersUpdated} players`,
      data: { usersUpdated },
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error giving the starter pool:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error giving the starter pool' })
  }
})
