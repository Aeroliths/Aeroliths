// API route to get all news including drafts (admin only)
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const news = await db.postgres.news.findMany({
      orderBy: [{ createdAt: 'desc' }],
    })

    return {
      success: true,
      data: news,
      count: news.length,
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching admin news:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch news',
    })
  }
})
