// Create a new user report (any authenticated user)
export default defineEventHandler(async (event) => {
  try {
    const authUser = getAuthUser(event)

    rateLimit(event, { key: 'create-report', limit: 5, windowMs: 60 * 60 * 1000 })

    const body = await readBody(event)
    const { reportedUserId, type, reason } = body || {}

    if (!reportedUserId || typeof reportedUserId !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'reportedUserId is required' })
    }

    if (!type || (type !== 'username' && type !== 'profile_picture')) {
      throw createError({ statusCode: 400, statusMessage: 'type must be "username" or "profile_picture"' })
    }

    const normalizedReason =
      typeof reason === 'string' ? reason.trim() : ''

    if (normalizedReason.length > 500) {
      throw createError({ statusCode: 400, statusMessage: 'Reason cannot exceed 500 characters' })
    }

    if (reportedUserId === authUser.userId) {
      throw createError({ statusCode: 400, statusMessage: 'You cannot report yourself' })
    }

    const reportedUser = await db.postgres.user.findUnique({
      where: { id: reportedUserId },
    })

    if (!reportedUser) {
      throw createError({ statusCode: 404, statusMessage: 'Reported user not found' })
    }

    const existingPending = await db.postgres.userReport.findFirst({
      where: {
        reporterId: authUser.userId,
        reportedUserId,
        type,
        status: 'pending',
      },
    })

    if (existingPending) {
      throw createError({
        statusCode: 409,
        statusMessage: 'You already have a pending report of this type against this user',
      })
    }

    const report = await db.postgres.userReport.create({
      data: {
        reporterId: authUser.userId,
        reportedUserId,
        type,
        reason: normalizedReason,
      },
    })

    return {
      success: true,
      message: 'Report submitted successfully',
      data: { id: report.id },
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error creating report:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create report' })
  }
})
