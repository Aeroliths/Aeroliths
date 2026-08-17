import { drawLoot } from '~~/server/utils/loot'

/**
 * Opens one chest of the given kind and hands over a random lithos.
 *
 * The draw happens here, from the stored weights: the client learns what it
 * got, never the table.
 */
export default defineEventHandler(async (event) => {
  try {
    const authUser = getAuthUser(event)

    rateLimit(event, { key: 'open-chest', limit: 120, windowMs: 60 * 60 * 1000 })

    const chestTypeId = getRouterParam(event, 'id')
    if (!chestTypeId) {
      throw createError({ statusCode: 400, statusMessage: 'Chest type is required' })
    }

    const entries = await db.postgres.lootEntry.findMany({
      where: { chestTypeId },
      select: { lithosId: true, weight: true },
    })

    // Checked before anything is consumed: a chest that vanishes and hands
    // nothing back is indistinguishable from theft.
    if (entries.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'This chest has nothing in it yet. Try again later.',
      })
    }

    const lithosId = await db.postgres.$transaction(async (tx: any) => {
      // Guarded decrement: only matches while a chest is actually held, so two
      // concurrent openings cannot spend the same one.
      const consumed = await tx.userChest.updateMany({
        where: { userId: authUser.userId, chestTypeId, quantity: { gt: 0 } },
        data: { quantity: { decrement: 1 } },
      })

      if (consumed.count === 0) {
        throw createError({ statusCode: 400, statusMessage: 'You have no chest of this kind' })
      }

      const drawn = drawLoot(entries)
      if (!drawn) {
        throw createError({ statusCode: 400, statusMessage: 'This chest has nothing in it yet.' })
      }

      await tx.collections.upsert({
        where: { userId_lithosId: { userId: authUser.userId, lithosId: drawn } },
        create: { userId: authUser.userId, lithosId: drawn, quantity: 1 },
        update: { quantity: { increment: 1 } },
      })

      return drawn
    })

    const lithos = await db.postgres.lithos.findUnique({
      where: { id: lithosId },
      select: { id: true, name: true, sprite: true },
    })

    return { success: true, data: { lithos } }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error opening a chest:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to open the chest' })
  }
})
