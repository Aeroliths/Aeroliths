// API route to get all published news (public)
export default defineEventHandler(async () => {
  try {
    const news = await db.postgres.news.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
      },
    })

    return {
      success: true,
      data: news,
      count: news.length,
    }
  } catch (error) {
    console.error('Error fetching news:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch news',
    })
  }
})
