// API route to get all collections for a specific user (admin only)
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const userId = getRouterParam(event, 'userId')
    if (!userId) {
      throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
    }

    const targetUser = await db.postgres.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    const collections = await db.postgres.collections.findMany({
      where: { userId },
      include: {
        lithos: {
          include: { element: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      success: true,
      message: 'Collections retrieved successfully',
      data: collections,
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error retrieving collections:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error retrieving collections' })
  }
})
