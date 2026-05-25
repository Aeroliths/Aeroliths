// API route to update a news entry (admin only)
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'News ID is required' })
    }

    const body = await readBody(event)
    if (!body) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
    }

    const existing = await db.postgres.news.findUnique({ where: { id } })
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'News not found' })
    }

    const updateData: any = {}

    if (typeof body.title === 'string' && body.title.trim()) {
      updateData.title = body.title.trim()
    }

    if (body.excerpt !== undefined) {
      updateData.excerpt = typeof body.excerpt === 'string' && body.excerpt.trim()
        ? body.excerpt.trim()
        : null
    }

    if (typeof body.content === 'string') {
      updateData.content = sanitizeNewsContent(body.content)
    }

    // Cover image update
    if (body.coverImage !== undefined) {
      if (body.coverImage === null || body.coverImage === '') {
        // Removing cover image
        if (existing.coverImage) {
          try { await delete_image(existing.coverImage, user) } catch (e) {
            console.warn('Failed to delete old cover:', e)
          }
        }
        updateData.coverImage = null
      } else if (typeof body.coverImage === 'string' && body.coverImage.startsWith('data:image/')) {
        // New upload
        const matches = body.coverImage.match(/^data:(image\/\w+);base64,(.+)$/)
        if (!matches) {
          throw createError({ statusCode: 400, statusMessage: 'Invalid cover image format' })
        }
        const fileField = {
          filename: 'upload',
          type: matches[1],
          data: Buffer.from(matches[2], 'base64'),
          DirName: 'news',
        }
        updateData.coverImage = await upload_image(fileField, user)

        if (existing.coverImage) {
          try { await delete_image(existing.coverImage, user) } catch (e) {
            console.warn('Failed to delete old cover:', e)
          }
        }
      }
      // Otherwise: existing path, leave unchanged
    }

    // Published transition
    if (body.published !== undefined) {
      const newPublished = Boolean(body.published)
      updateData.published = newPublished
      if (newPublished && !existing.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No valid fields to update' })
    }

    const updated = await db.postgres.news.update({
      where: { id },
      data: updateData,
    })

    return {
      success: true,
      message: 'News updated successfully',
      data: updated,
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error updating news:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error updating news' })
  }
})
