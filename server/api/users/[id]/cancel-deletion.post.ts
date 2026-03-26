// API route to cancel a pending account deletion request
export default defineEventHandler(async (event) => {
  try {
    const authUser = getAuthUser(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
    }

    if (authUser.userId !== id) {
      throw createError({ statusCode: 403, statusMessage: 'You can only cancel deletion of your own account' })
    }

    const user = await db.postgres.user.findUnique({ where: { id } })

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    if (!user.deletionRequestedAt) {
      throw createError({ statusCode: 409, statusMessage: 'No pending deletion request found for this account' })
    }

    await db.postgres.user.update({
      where: { id },
      data: {
        deletionRequestedAt: null,
        deletionReminderSent: false,
      },
    })

    return {
      success: true,
      message: 'Deletion request cancelled. Your account will not be deleted.',
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error cancelling account deletion:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error cancelling account deletion' })
  }
})
