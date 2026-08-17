export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Chest type is required' })

    // Held chests and configured tiers both outlive an admin's change of mind,
    // so neither is swept away silently.
    const held = await db.postgres.userChest.findMany({
      where: { chestTypeId: id, quantity: { gt: 0 } },
      select: { id: true },
      take: 1,
    })
    if (held.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Players are holding this chest. Empty it from their inventories first.',
      })
    }

    const tiers = await db.postgres.levelReward.findMany({
      where: { chestTypeId: id },
      select: { level: true },
      take: 1,
    })
    if (tiers.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A reward tier still grants this chest. Change that tier first.',
      })
    }

    await db.postgres.chestType.delete({ where: { id } })

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error deleting a chest type:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete the chest type' })
  }
})
