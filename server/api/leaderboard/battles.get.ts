import { winRate, rankByXp, type BattleTally } from '~~/server/utils/leaderboard'

const PAGE_SIZE = 20

/**
 * Ranking by progression. The ordering key is a stored column, so the page is
 * chosen in the database and only that page is ever read.
 */
export default defineEventHandler(async (event) => {
  try {
    getAuthUser(event)

    const query = getQuery(event)
    const requested = Number.parseInt(String(query.page ?? '1'), 10)
    const page = Number.isFinite(requested) && requested > 0 ? requested : 1

    const where = { emailVerified: true }

    const [players, total] = await Promise.all([
      db.postgres.user.findMany({
        where,
        select: { id: true, username: true, profilePicture: true, xp: true, level: true },
        orderBy: [{ xp: 'desc' }, { username: 'asc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.postgres.user.count({ where }),
    ])

    // One grouped count for the whole page rather than one query per player.
    const counts = players.length
      ? await db.postgres.match.groupBy({
          by: ['userId', 'result'],
          where: { userId: { in: players.map((player) => player.id) } },
          _count: { _all: true },
        })
      : []

    const tallies = new Map<string, BattleTally>()
    for (const player of players) {
      tallies.set(player.id, { userId: player.id, wins: 0, losses: 0, draws: 0 })
    }
    for (const row of counts) {
      const tally = tallies.get(row.userId)
      if (!tally) continue
      const amount = row._count._all
      if (row.result === 'win') tally.wins += amount
      else if (row.result === 'loss') tally.losses += amount
      else if (row.result === 'draw') tally.draws += amount
    }

    // Ranked again in code: the tie-break then lives in one place, and the
    // order stops depending on the database collation.
    const ranked = rankByXp(players).map((player, index) => {
      const tally = tallies.get(player.id)!
      return {
        rank: (page - 1) * PAGE_SIZE + index + 1,
        id: player.id,
        username: player.username,
        profilePicture: player.profilePicture,
        xp: player.xp,
        level: player.level,
        wins: tally.wins,
        losses: tally.losses,
        draws: tally.draws,
        winRate: winRate(tally),
      }
    })

    return { success: true, data: { players: ranked, total, page, pageSize: PAGE_SIZE } }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error building the battle leaderboard:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to build the leaderboard' })
  }
})
