// API route to get a single published news by slug (public)
export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')

    if (!slug) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Slug is required',
      })
    }

    const news = await db.postgres.news.findUnique({
      where: { slug },
    })

    if (!news || !news.published) {
      throw createError({
        statusCode: 404,
        statusMessage: 'News not found',
      })
    }

    return {
      success: true,
      data: news,
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching news:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch news',
    })
  }
})
