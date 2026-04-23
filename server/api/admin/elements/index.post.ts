export default defineEventHandler(async (event) => {
  let uploadedImagePath: string | undefined;
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const body = await readBody(event)

    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Element name is required and must be a string',
      })
    }

    if (!body) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid request body',
        })
    }

    // Process the Base64 sprite string into a file object structure
    let fileField: any = null
    if (typeof body.sprite === 'string' && body.sprite.startsWith('data:image/')) {
        const matches = body.sprite.match(/^data:(image\/\w+);base64,(.+)$/)
        if (matches) {
            fileField = {
                filename: 'upload', // Dummy name; handle-upload-images generates its own
                type: matches[1],
                data: Buffer.from(matches[2], 'base64'),
                DirName: body.folder || 'elements'
            }
        }
    }

    if (!fileField || !fileField.filename) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid or missing sprite image',
        })
    }

    // Validate file type
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!ALLOWED_TYPES.includes(fileField.type || '')) {
        throw createError({ statusCode: 415, statusMessage: 'Invalid file type.' })
    }

    // Upload the image using the utility function
    const spritePath = await upload_image(fileField, user)
    uploadedImagePath = spritePath

    const element = await db.postgres.elements.create({
      data: {
        name: body.name,
        sprite: uploadedImagePath,
      },
    })

    return {
      success: true,
      message: 'Element created successfully',
      data: element,
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    if (error.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'An element with this name already exists',
      })
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Error creating element:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create element',
    })
  }
})
