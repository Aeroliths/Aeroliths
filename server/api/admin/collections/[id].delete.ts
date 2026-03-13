// API route to remove a collection entry (admin only)
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Collection ID is required' })
    }

    const existing = await db.postgres.collections.findUnique({ where: { id } })
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Collection entry not found' })
    }

    await db.postgres.collections.delete({ where: { id } })

    return {
      success: true,
      message: 'Collection entry removed successfully',
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error deleting collection entry:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error deleting collection entry' })
  }
})
