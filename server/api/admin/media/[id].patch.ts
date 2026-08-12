// API route to rename a media library entry (admin only)
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

    const body = await readBody(event)

    if (typeof body?.label !== 'string' || body.label.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Field label is required and must be a non-empty string',
      })
    }

    const existing = await db.postgres.mediaAsset.findUnique({ where: { id } })
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Media asset not found',
      })
    }

    const updated = await db.postgres.mediaAsset.update({
      where: { id },
      data: { label: body.label.trim() },
    })

    return {
      success: true,
      message: 'Media asset updated successfully',
      data: updated,
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Error updating media asset:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update media asset',
    })
  }
})
