// API route for Tiptap inline image upload (admin only)
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const body = await readBody(event)
    if (!body || typeof body.image !== 'string' || !body.image.startsWith('data:image/')) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid or missing image' })
    }

    const matches = body.image.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!matches) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid image format' })
    }

    const fileField = {
      filename: 'upload',
      type: matches[1],
      data: Buffer.from(matches[2], 'base64'),
      DirName: 'news',
    }

    const url = await upload_image(fileField, user)

    return { success: true, url }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error uploading news inline image:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error uploading image' })
  }
})
