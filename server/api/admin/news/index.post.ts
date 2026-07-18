import type { JWTPayload } from '~~/server/utils/auth'

// API route to create a new news entry (admin only)
export default defineEventHandler(async (event) => {
  let uploadedImagePath: string | undefined
  let user: JWTPayload | undefined
  try {
    user = getAuthUser(event)
    requireRole(user, ['admin'])

    const body = await readBody(event)
    if (!body) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
    }

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const rawContent = typeof body.content === 'string' ? body.content : ''
    if (!title || !rawContent) {
      throw createError({ statusCode: 400, statusMessage: 'Fields title and content are required' })
    }

    const excerpt = typeof body.excerpt === 'string' && body.excerpt.trim() ? body.excerpt.trim() : null
    const published = Boolean(body.published)
    const content = sanitizeNewsContent(rawContent)
    const locale = body.locale === 'fr' ? 'fr' : 'en'

    // Slug
    const baseSlug = slugify(title)
    if (!baseSlug) {
      throw createError({ statusCode: 400, statusMessage: 'Title must contain at least one alphanumeric character' })
    }
    const slug = await ensureUniqueSlug(baseSlug, locale)

    // Cover image (optional, Base64)
    let coverImage: string | null = null
    if (typeof body.coverImage === 'string' && body.coverImage.startsWith('data:image/')) {
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
      coverImage = await upload_image(fileField, user)
      uploadedImagePath = coverImage
    }

    const news = await db.postgres.news.create({
      data: {
        title,
        slug,
        locale,
        excerpt,
        content,
        coverImage,
        published,
        publishedAt: published ? new Date() : null,
      },
    })

    return {
      success: true,
      message: 'News created successfully',
      data: news,
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) throw error
    if (error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'A news with this slug already exists' })
    }

    if (uploadedImagePath && user) {
      try { await delete_image(uploadedImagePath, user) } catch (e) { console.error('Cleanup failed', e) }
    }

    if (error.statusCode) throw error
    console.error('Error creating news:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error creating news' })
  }
})
