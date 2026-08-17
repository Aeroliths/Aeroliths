/**
 * Replaces the whole reward table. Every tier must sit on a level the curve
 * defines, otherwise it could never pay out.
 */
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const body = await readBody(event)
    const rewards = body?.rewards

    if (!Array.isArray(rewards)) {
      throw createError({ statusCode: 400, statusMessage: 'rewards must be a list' })
    }

    for (const reward of rewards) {
      if (!reward || !Number.isInteger(reward.level) || !Number.isInteger(reward.quantity)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Each reward needs an integer level and quantity',
        })
      }
      if (reward.quantity < 1) {
        throw createError({ statusCode: 400, statusMessage: 'Quantity must be at least 1' })
      }
      if (reward.kind !== 'lithos') {
        throw createError({ statusCode: 400, statusMessage: `Unknown reward kind: ${reward.kind}` })
      }
      if (typeof reward.lithosId !== 'string' || reward.lithosId.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'A lithos reward needs a lithos' })
      }
    }

    const levels = new Set(rewards.map((reward: any) => reward.level))
    if (levels.size !== rewards.length) {
      throw createError({ statusCode: 400, statusMessage: 'One reward per level at most' })
    }

    const curve = await db.postgres.progressionLevel.findMany({ select: { level: true } })
    const definedLevels = new Set(curve.map((entry) => entry.level))
    for (const reward of rewards) {
      if (!definedLevels.has(reward.level)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Level ${reward.level} is not part of the curve`,
        })
      }
    }

    await db.postgres.$transaction(async (tx: any) => {
      await tx.levelReward.deleteMany({})
      for (const reward of rewards) {
        await tx.levelReward.create({
          data: {
            level: reward.level,
            kind: reward.kind,
            quantity: reward.quantity,
            lithosId: reward.lithosId,
          },
        })
      }
    })

    return { success: true, data: { rewards: rewards.length } }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error saving the reward tiers:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save the rewards' })
  }
})
