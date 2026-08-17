import { replayMatch } from '~~/server/utils/match-replay'
import { computeXp, applyDailyCap, type BotDifficulty } from '~~/server/utils/xp'
import { levelForXp, levelsCrossed } from '~~/server/utils/progression'
import { toElementGraph } from '~/game/engine/adapters'
import type { Player, Stone } from '~/game/engine/types'

const DIFFICULTIES: BotDifficulty[] = ['easy', 'medium', 'hard']

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Records a finished bot match and grants the XP the server itself computed.
 *
 * The request carries stone identifiers and a move list. It carries no values
 * and no result: both are derived here, from the database and from a replay
 * through the engine.
 */
export default defineEventHandler(async (event) => {
  try {
    const authUser = getAuthUser(event)

    rateLimit(event, { key: 'submit-match', limit: 60, windowMs: 60 * 60 * 1000 })

    const submission = await readBody(event)
    const {
      difficulty,
      size,
      rules,
      handRule,
      openHands,
      startingPlayer,
      boardElements,
      hands,
      moves,
    } = submission || {}

    if (!DIFFICULTIES.includes(difficulty)) {
      throw createError({ statusCode: 400, statusMessage: 'Unknown difficulty' })
    }
    if (startingPlayer !== 'A' && startingPlayer !== 'B') {
      throw createError({ statusCode: 400, statusMessage: 'Unknown starting player' })
    }
    if (!hands || !Array.isArray(hands.A) || !Array.isArray(hands.B) || !Array.isArray(moves)) {
      throw createError({ statusCode: 400, statusMessage: 'Malformed submission' })
    }

    const requestedIds: string[] = [...hands.A, ...hands.B]
    if (requestedIds.some((id) => typeof id !== 'string')) {
      throw createError({ statusCode: 400, statusMessage: 'Malformed hands' })
    }

    const rows = await db.postgres.lithos.findMany({
      where: { id: { in: [...new Set(requestedIds)] } },
      select: {
        id: true,
        spikeUp: true,
        spikeDown: true,
        spikeLeft: true,
        spikeRight: true,
        elementId: true,
      },
    })

    const byId = new Map(rows.map((row) => [row.id, row]))
    const toStone = (id: string): Stone => {
      const row = byId.get(id)
      if (!row) throw createError({ statusCode: 400, statusMessage: `Unknown lithos: ${id}` })
      return {
        id: row.id,
        elementId: row.elementId,
        spikeUp: row.spikeUp,
        spikeDown: row.spikeDown,
        spikeLeft: row.spikeLeft,
        spikeRight: row.spikeRight,
      }
    }

    const resolvedHands: Record<Player, Stone[]> = {
      A: hands.A.map(toStone),
      B: hands.B.map(toStone),
    }

    const elementRows = await db.postgres.elements.findMany({
      select: { id: true, strengthsFrom: { select: { strongAgainst: { select: { id: true } } } } },
    })

    let outcome
    try {
      outcome = replayMatch({
        size,
        rules,
        handRule,
        openHands: Boolean(openHands),
        startingPlayer,
        boardElements: boardElements ?? [],
        elements: toElementGraph(elementRows as any),
        hands: resolvedHands,
        moves,
      })
    } catch (replayError: any) {
      throw createError({
        statusCode: 400,
        statusMessage: `Rejected match: ${replayError.message}`,
      })
    }

    const earned = computeXp({ result: outcome.result, difficulty, size })
    const today = await db.postgres.match.aggregate({
      _sum: { xpAwarded: true },
      where: { userId: authUser.userId, playedAt: { gte: startOfToday() } },
    })
    const awardedToday = today._sum.xpAwarded ?? 0
    const xpAwarded = applyDailyCap(earned, awardedToday)

    const [curve, tiers] = await Promise.all([
      db.postgres.progressionLevel.findMany({ select: { level: true, xpRequired: true } }),
      db.postgres.levelReward.findMany({
        select: { level: true, kind: true, quantity: true, lithosId: true },
      }),
    ])

    // The match row and the grant travel together: an XP increment with no
    // match behind it is exactly the corruption this endpoint exists to stop.
    const grant = await db.postgres.$transaction(async (tx: any) => {
      await tx.match.create({
        data: {
          userId: authUser.userId,
          opponent: 'bot',
          difficulty,
          boardSize: size,
          result: outcome.result,
          scoreSelf: outcome.scoreSelf,
          scoreOpponent: outcome.scoreOpponent,
          xpAwarded,
        },
      })

      if (xpAwarded === 0) {
        const current = await tx.user.findUnique({
          where: { id: authUser.userId },
          select: { xp: true, level: true },
        })
        return {
          totalXp: current?.xp ?? null,
          level: current?.level ?? 1,
          levelsGained: [] as number[],
          rewards: [] as { lithosId: string; quantity: number }[],
        }
      }

      // Read inside the transaction: two concurrent submissions reading the
      // level outside it could both grant the same tiers.
      const before = await tx.user.findUnique({
        where: { id: authUser.userId },
        select: { xp: true, level: true },
      })
      const previousLevel = before?.level ?? 1

      const updated = await tx.user.update({
        where: { id: authUser.userId },
        data: { xp: { increment: xpAwarded } },
        select: { xp: true },
      })

      const newLevel = levelForXp(updated.xp, curve)
      const levelsGained = levelsCrossed(previousLevel, newLevel)
      if (levelsGained.length === 0) {
        return { totalXp: updated.xp, level: previousLevel, levelsGained, rewards: [] }
      }

      await tx.user.update({ where: { id: authUser.userId }, data: { level: newLevel } })

      const rewards: { lithosId: string; quantity: number }[] = []
      for (const tier of tiers) {
        if (!levelsGained.includes(tier.level)) continue
        // A tier whose lithos was deleted still counts as a level reached; it
        // simply hands nothing over, rather than blocking the progression of
        // everyone who passes through that level.
        if (tier.kind !== 'lithos' || !tier.lithosId) continue
        const quantity = Math.max(1, tier.quantity)
        await tx.collections.upsert({
          where: { userId_lithosId: { userId: authUser.userId, lithosId: tier.lithosId } },
          create: { userId: authUser.userId, lithosId: tier.lithosId, quantity },
          update: { quantity: { increment: quantity } },
        })
        rewards.push({ lithosId: tier.lithosId, quantity })
      }

      return { totalXp: updated.xp, level: newLevel, levelsGained, rewards }
    })

    return {
      success: true,
      data: {
        result: outcome.result,
        scoreSelf: outcome.scoreSelf,
        scoreOpponent: outcome.scoreOpponent,
        xpAwarded,
        totalXp: grant.totalXp,
        cappedToday: xpAwarded < earned,
        level: grant.level,
        levelsGained: grant.levelsGained,
        rewards: grant.rewards,
      },
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error recording match:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to record the match' })
  }
})
