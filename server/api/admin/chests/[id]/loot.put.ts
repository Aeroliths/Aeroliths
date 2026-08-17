/** Replaces the whole loot table of one chest type. */
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const chestTypeId = getRouterParam(event, 'id')
    if (!chestTypeId) {
      throw createError({ statusCode: 400, statusMessage: 'Chest type is required' })
    }

    const body = await readBody(event)
    const entries = body?.entries

    if (!Array.isArray(entries)) {
      throw createError({ statusCode: 400, statusMessage: 'entries must be a list' })
    }

    for (const entry of entries) {
      if (!entry || typeof entry.lithosId !== 'string' || entry.lithosId.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'Each entry needs a lithos' })
      }
      if (!Number.isInteger(entry.weight) || entry.weight < 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Weights must be whole numbers of at least 1',
        })
      }
    }

    const lithosIds = new Set(entries.map((entry: any) => entry.lithosId))
    if (lithosIds.size !== entries.length) {
      throw createError({ statusCode: 400, statusMessage: 'One entry per lithos at most' })
    }

    await db.postgres.$transaction(async (tx: any) => {
      await tx.lootEntry.deleteMany({ where: { chestTypeId } })
      for (const entry of entries) {
        await tx.lootEntry.create({
          data: { chestTypeId, lithosId: entry.lithosId, weight: entry.weight },
        })
      }
    })

    return { success: true, data: { entries: entries.length } }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error saving a loot table:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save the loot table' })
  }
})
