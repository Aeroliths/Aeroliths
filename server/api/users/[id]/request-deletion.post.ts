import { sendDeletionRequestEmail } from '../../../utils/email'

// API route to request account deletion (authenticated user only, for their own account)
export default defineEventHandler(async (event) => {
  try {
    const authUser = getAuthUser(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
    }

    if (authUser.userId !== id) {
      throw createError({ statusCode: 403, statusMessage: 'You can only request deletion of your own account' })
    }

    const user = await db.postgres.user.findUnique({
      where: { id },
      include: { role: true },
    })

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    if (user.role.name === 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Admin accounts cannot be deleted' })
    }

    if (user.deletionRequestedAt) {
      throw createError({ statusCode: 409, statusMessage: 'A deletion request is already pending for this account' })
    }

    const deletionRequestedAt = new Date()
    const deletionDate = new Date(deletionRequestedAt.getTime() + 30 * 24 * 60 * 60 * 1000)

    await db.postgres.user.update({
      where: { id },
      data: {
        deletionRequestedAt,
        deletionReminderSent: false,
      },
    })

    try {
      await sendDeletionRequestEmail(user.email, user.username, deletionDate, user.locale === 'fr' ? 'fr' : 'en')
    } catch (emailError) {
      console.error('[DeletionRequest] Failed to send confirmation email:', emailError)
    }

    return {
      success: true,
      message: 'Deletion request submitted. Your account will be deleted in 30 days if you do not log in.',
      data: { deletionDate },
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error requesting account deletion:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error requesting account deletion' })
  }
})
