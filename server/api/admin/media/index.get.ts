// API route to list the media library of one category (admin only)
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const query = getQuery(event)
    const category = query.category

    if (!isMediaCategory(category)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Query parameter category must be lithos or elements',
      })
    }

    const assets = await db.postgres.mediaAsset.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    })

    const data = await Promise.all(
      assets.map(async (asset: any) => ({
        ...asset,
        usageCount: await countMediaUsage(asset.path),
      })),
    )

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Error listing media assets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to list media assets',
    })
  }
})
