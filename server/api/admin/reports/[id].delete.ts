// Admin: delete a report
export default defineEventHandler(async (event) => {
  try {
    const authUser = getAuthUser(event)
    requireRole(authUser, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Report ID is required' })
    }

    const existing = await db.postgres.userReport.findUnique({ where: { id } })
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Report not found' })
    }

    await db.postgres.userReport.delete({ where: { id } })

    return { success: true, message: 'Report deleted successfully' }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error deleting report:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete report' })
  }
})
