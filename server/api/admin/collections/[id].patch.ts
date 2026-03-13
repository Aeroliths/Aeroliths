// API route to update a collection entry quantity (admin only)
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Collection ID is required' })
    }

    const body = await readBody(event)
    const quantity = Number(body.quantity)
    if (isNaN(quantity) || quantity < 0) {
      throw createError({ statusCode: 400, statusMessage: 'Quantity must be a non-negative number' })
    }

    const existing = await db.postgres.collections.findUnique({ where: { id } })
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Collection entry not found' })
    }

    const updated = await db.postgres.collections.update({
      where: { id },
      data: { quantity },
      include: { lithos: true },
    })

    return {
      success: true,
      message: 'Collection updated successfully',
      data: updated,
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error updating collection:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error updating collection' })
  }
})
