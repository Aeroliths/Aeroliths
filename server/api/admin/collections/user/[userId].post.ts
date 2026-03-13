// API route to add a lithos to a user's collection (admin only)
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const userId = getRouterParam(event, 'userId')
    if (!userId) {
      throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
    }

    const body = await readBody(event)

    if (!body.lithosId) {
      throw createError({ statusCode: 400, statusMessage: 'Lithos ID is required' })
    }

    const quantity = Number(body.quantity ?? 1)
    if (isNaN(quantity) || quantity < 1) {
      throw createError({ statusCode: 400, statusMessage: 'Quantity must be at least 1' })
    }

    const targetUser = await db.postgres.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    const lithos = await db.postgres.lithos.findUnique({ where: { id: body.lithosId } })
    if (!lithos) {
      throw createError({ statusCode: 404, statusMessage: 'Lithos not found' })
    }

    // Upsert: if entry already exists, increment quantity
    const collection = await db.postgres.collections.upsert({
      where: { userId_lithosId: { userId, lithosId: body.lithosId } },
      create: { userId, lithosId: body.lithosId, quantity },
      update: { quantity: { increment: quantity } },
      include: { lithos: true },
    })

    return {
      success: true,
      message: 'Lithos added to collection successfully',
      data: collection,
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error adding to collection:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error adding to collection' })
  }
})
