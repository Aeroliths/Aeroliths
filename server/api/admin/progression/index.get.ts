// Reads the whole progression configuration for the admin panel.
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const [curve, rewards] = await Promise.all([
      db.postgres.progressionLevel.findMany({
        select: { level: true, xpRequired: true },
        orderBy: { level: 'asc' },
      }),
      db.postgres.levelReward.findMany({
        select: { level: true, kind: true, quantity: true, lithosId: true },
        orderBy: { level: 'asc' },
      }),
    ])

    return { success: true, data: { curve, rewards } }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error reading the progression config:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to read the progression config' })
  }
})
