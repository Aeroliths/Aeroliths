import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/leaderboard/[username].get'
import { createTestUser } from '../../utils/auth'

const event = {} as any

describe('GET /api/leaderboard/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestUser())
    global.getRouterParam.mockReturnValue('ada')
    global.db.postgres.user.findUnique.mockResolvedValue({
      id: 'u1',
      username: 'ada',
      profilePicture: null,
      createdAt: new Date('2026-01-01'),
      xp: 900,
      level: 5,
      collections: [],
    })
    global.db.postgres.lithos.count.mockResolvedValue(0)
    global.db.postgres.elements.count.mockResolvedValue(0)
    global.db.postgres.lithos.findMany.mockResolvedValue([])
    global.db.postgres.lithos.groupBy.mockResolvedValue([])
    global.db.postgres.elements.findMany.mockResolvedValue([])
    global.db.postgres.match.groupBy.mockResolvedValue([
      { result: 'win', _count: { _all: 3 } },
      { result: 'loss', _count: { _all: 1 } },
    ])
    global.db.postgres.match.findMany.mockResolvedValue([
      {
        result: 'win',
        difficulty: 'hard',
        boardSize: 3,
        scoreSelf: 6,
        scoreOpponent: 3,
        playedAt: new Date('2026-08-17'),
      },
    ])
  })

  it('reports the progression', async () => {
    const result = await handler(event)

    expect(result.data.level).toBe(5)
    expect(result.data.xp).toBe(900)
  })

  it('reports the record with its win rate', async () => {
    const result = await handler(event)

    expect(result.data.record.wins).toBe(3)
    expect(result.data.record.losses).toBe(1)
    expect(result.data.record.winRate).toBe(75)
  })

  it('returns the recent matches, newest first, capped at ten', async () => {
    await handler(event)

    const query = global.db.postgres.match.findMany.mock.calls[0]![0]
    expect(query.take).toBe(10)
    expect(query.orderBy).toEqual({ playedAt: 'desc' })
    expect(query.where.userId).toBe('u1')
  })

  it('reads the record of that one player, never of everyone', async () => {
    await handler(event)

    const grouped = global.db.postgres.match.groupBy.mock.calls[0]![0]
    expect(grouped.where.userId).toBe('u1')
  })

  it('shows a player who never played at zero', async () => {
    global.db.postgres.match.groupBy.mockResolvedValue([])
    global.db.postgres.match.findMany.mockResolvedValue([])

    const result = await handler(event)

    expect(result.data.record.wins).toBe(0)
    expect(result.data.record.winRate).toBe(0)
    expect(result.data.recentMatches).toEqual([])
  })

  it('answers 404 for an unknown player', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(null)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('requires authentication', async () => {
    global.getAuthUser.mockImplementation(() => {
      throw { statusCode: 401, statusMessage: 'Unauthorized' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(global.db.postgres.user.findUnique).not.toHaveBeenCalled()
  })

  it('rejects a request with no username', async () => {
    global.getRouterParam.mockReturnValue(undefined)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })
})
