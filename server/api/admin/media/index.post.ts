// API route to add an image to the media library (admin only)
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const body = await readBody(event)

    if (!body) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request body',
      })
    }

    if (!isMediaCategory(body.category)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Field category must be lithos or elements',
      })
    }

    if (body.label !== undefined && typeof body.label !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Field label must be a string',
      })
    }

    const { asset, reused } = await registerMediaAsset(
      body.category,
      body.image,
      user,
      body.label,
    )

    return {
      success: true,
      reused,
      message: reused ? 'Image already in library, reused' : 'Image added to library',
      data: asset,
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Error adding media asset:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add media asset',
    })
  }
})
