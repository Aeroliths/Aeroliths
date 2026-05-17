// Admin: update a report (resolve/dismiss, optionally clear offending field)
export default defineEventHandler(async (event) => {
  try {
    const authUser = getAuthUser(event)
    requireRole(authUser, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Report ID is required' })
    }

    const body = await readBody(event)
    const { status, clearOffendingField } = body || {}

    if (!status || (status !== 'resolved' && status !== 'dismissed' && status !== 'pending')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'status must be "pending", "resolved", or "dismissed"',
      })
    }

    const report = await db.postgres.userReport.findUnique({
      where: { id },
      include: { reportedUser: true },
    })

    if (!report) {
      throw createError({ statusCode: 404, statusMessage: 'Report not found' })
    }

    if (clearOffendingField === true && status === 'resolved') {
      if (report.type === 'profile_picture' && report.reportedUser.profilePicture) {
        try {
          await delete_image(report.reportedUser.profilePicture, authUser)
        } catch (error: any) {
          console.warn('Failed to delete reported profile picture:', error.message)
        }
        await db.postgres.user.update({
          where: { id: report.reportedUserId },
          data: { profilePicture: null },
        })
      } else if (report.type === 'username') {
        const placeholder = `user_${report.reportedUserId.slice(0, 8)}`
        await db.postgres.user.update({
          where: { id: report.reportedUserId },
          data: { username: placeholder },
        })
      }
    }

    const updated = await db.postgres.userReport.update({
      where: { id },
      data: { status },
    })

    return {
      success: true,
      message: 'Report updated successfully',
      data: updated,
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error updating report:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update report' })
  }
})
