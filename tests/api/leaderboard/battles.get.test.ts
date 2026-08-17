import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/leaderboard/battles.get'
import { createTestUser } from '../../utils/auth'

const event = {} as any

describe('GET /api/leaderboard/battles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestUser())
    global.getQuery.mockReturnValue({})
    global.db.postgres.user.findMany.mockResolvedValue([
      { id: 'u1', username: 'ada', profilePicture: null, xp: 900, level: 5 },
      { id: 'u2', username: 'bob', profilePicture: null, xp: 100, level: 2 },
    ])
    global.db.postgres.user.count.mockResolvedValue(2)
    global.db.postgres.match.groupBy.mockResolvedValue([
      { userId: 'u1', result: 'win', _count: { _all: 3 } },
      { userId: 'u1', result: 'loss', _count: { _all: 1 } },
    ])
  })

  it('ranks by xp, highest first', async () => {
    const result = await handler(event)

    expect(result.data.players.map((p: any) => p.username)).toEqual(['ada', 'bob'])
  })

  it('reports each player record', async () => {
    const result = await handler(event)

    const ada = result.data.players[0]
    expect(ada.wins).toBe(3)
    expect(ada.losses).toBe(1)
    expect(ada.winRate).toBe(75)
    expect(ada.level).toBe(5)
    expect(ada.rank).toBe(1)
  })

  it('shows a player with no match at zero rather than dropping them', async () => {
    const result = await handler(event)

    const bob = result.data.players[1]
    expect(bob.wins).toBe(0)
    expect(bob.losses).toBe(0)
    expect(bob.winRate).toBe(0)
  })

  it('asks the database for the page, not for everyone', async () => {
    global.getQuery.mockReturnValue({ page: '3' })

    await handler(event)

    const query = global.db.postgres.user.findMany.mock.calls[0]![0]
    expect(query.take).toBe(20)
    expect(query.skip).toBe(40)
    expect(query.orderBy).toBeDefined()
  })

  it('numbers the ranks from the page, not from one', async () => {
    global.getQuery.mockReturnValue({ page: '2' })

    const result = await handler(event)

    expect(result.data.players[0].rank).toBe(21)
  })

  it('reports the total so the page can be placed', async () => {
    const result = await handler(event)

    expect(result.data.total).toBe(2)
    expect(result.data.page).toBe(1)
  })

  it('only counts verified accounts', async () => {
    await handler(event)

    const query = global.db.postgres.user.findMany.mock.calls[0]![0]
    expect(query.where.emailVerified).toBe(true)
  })

  it('falls back to the first page on a nonsense page number', async () => {
    global.getQuery.mockReturnValue({ page: 'banana' })

    const result = await handler(event)

    expect(result.data.page).toBe(1)
    expect(global.db.postgres.user.findMany.mock.calls[0]![0].skip).toBe(0)
  })

  it('asks for no win record when the page is empty', async () => {
    global.db.postgres.user.findMany.mockResolvedValue([])

    const result = await handler(event)

    expect(result.data.players).toEqual([])
    expect(global.db.postgres.match.groupBy).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    global.getAuthUser.mockImplementation(() => {
      throw { statusCode: 401, statusMessage: 'Unauthorized' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
  })
})
