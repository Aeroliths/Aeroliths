// API route to add a lithos to ALL users' collections (admin only)
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const body = await readBody(event)

    if (!body.lithosId) {
      throw createError({ statusCode: 400, statusMessage: 'Lithos ID is required' })
    }

    const quantity = Number(body.quantity ?? 1)
    if (isNaN(quantity) || quantity < 1) {
      throw createError({ statusCode: 400, statusMessage: 'Quantity must be at least 1' })
    }

    const lithos = await db.postgres.lithos.findUnique({ where: { id: body.lithosId } })
    if (!lithos) {
      throw createError({ statusCode: 404, statusMessage: 'Lithos not found' })
    }

    const users = await db.postgres.user.findMany({ select: { id: true } })

    await db.postgres.$transaction(
      users.map((u) =>
        db.postgres.collections.upsert({
          where: { userId_lithosId: { userId: u.id, lithosId: body.lithosId } },
          create: { userId: u.id, lithosId: body.lithosId, quantity },
          update: { quantity: { increment: quantity } },
        })
      )
    )

    return {
      success: true,
      message: `Lithos added to ${users.length} users' collections successfully`,
      data: { usersUpdated: users.length },
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error adding to all collections:', error)
    throw createError({ statusCode: 500, statusMessage: 'Error adding to all collections' })
  }
})
