// API route to delete a news entry (admin only)
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'News ID is required' })
    }

    const existing = await db.postgres.news.findUnique({ where: { id } })
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'News not found' })
    }

    await db.postgres.news.delete({ where: { id } })

    if (existing.coverImage) {
      try { await delete_image(existing.coverImage, user) } catch (e) {
        console.warn('Failed to delete cover image:', e)
      }
    }

    return {
      success: true,
      message: 'News deleted successfully',
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error deleting news:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error deleting news' })
  }
})
