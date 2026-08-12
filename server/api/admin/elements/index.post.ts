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

    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Element name is required and must be a string',
      })
    }

    let sprite: string

    if (body.mediaId) {
      // Reuse an image already in the library.
      const asset = await db.postgres.mediaAsset.findUnique({
        where: { id: body.mediaId },
      })

      if (!asset) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Media asset not found',
        })
      }

      if (asset.category !== 'elements') {
        throw createError({
          statusCode: 400,
          statusMessage: 'This image belongs to another library',
        })
      }

      sprite = asset.path
    } else if (body.sprite) {
      // Direct upload, also filed in the library so it can be reused later.
      const { asset } = await registerMediaAsset('elements', body.sprite, user)
      sprite = asset.path
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Either mediaId or sprite is required',
      })
    }

    const element = await db.postgres.elements.create({
      data: {
        name: body.name,
        sprite,
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
