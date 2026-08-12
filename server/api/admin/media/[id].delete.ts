// API route to remove an image from the media library (admin only)
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Media asset ID is required',
      })
    }

    const existing = await db.postgres.mediaAsset.findUnique({ where: { id } })
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Media asset not found',
      })
    }

    const usageCount = await countMediaUsage(existing.path)
    if (usageCount > 0) {
      const [lithos, elements] = await Promise.all([
        db.postgres.lithos.findMany({
          where: { sprite: existing.path },
          select: { name: true },
        }),
        db.postgres.elements.findMany({
          where: { sprite: existing.path },
          select: { name: true },
        }),
      ])

      throw createError({
        statusCode: 409,
        statusMessage: 'This image is still used and cannot be deleted',
        data: {
          usageCount,
          usedBy: [...lithos, ...elements].map((item: any) => item.name),
        },
      })
    }

    // The row goes away even when the file is already missing, otherwise a
    // half-deleted asset would keep showing an empty thumbnail forever.
    try {
      await delete_image(existing.path, user)
    } catch (error: any) {
      console.warn('Failed to delete media file:', existing.path, ' error:', error.message)
    }

    await db.postgres.mediaAsset.delete({ where: { id } })

    return {
      success: true,
      message: `Image ${existing.label} deleted successfully`,
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Error deleting media asset:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete media asset',
    })
  }
})
