// The chests the caller is holding. Scoped to the caller, never to an id taken
// from the request.
export default defineEventHandler(async (event) => {
  try {
    const authUser = getAuthUser(event)

    const held = await db.postgres.userChest.findMany({
      where: { userId: authUser.userId, quantity: { gt: 0 } },
      select: { chestTypeId: true, quantity: true, chestType: { select: { name: true } } },
      orderBy: { chestType: { name: 'asc' } },
    })

    return {
      success: true,
      data: held.map((row) => ({
        chestTypeId: row.chestTypeId,
        name: row.chestType.name,
        quantity: row.quantity,
      })),
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error reading the chest inventory:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to read the inventory' })
  }
})
