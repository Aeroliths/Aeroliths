import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/matches/index.post'
import { createTestUser } from '../../utils/auth'

const event = {} as any

const strongThenWeak = [
  { id: 'l-strong', spikeUp: 9, spikeDown: 9, spikeLeft: 9, spikeRight: 9, elementId: null },
  { id: 'l-weak', spikeUp: 1, spikeDown: 1, spikeLeft: 1, spikeRight: 1, elementId: null },
]

function body(overrides: Record<string, any> = {}) {
  return {
    difficulty: 'easy',
    size: 3,
    rules: { same: false, plus: false, combo: false, wall: false },
    handRule: 'none',
    openHands: false,
    startingPlayer: 'A',
    boardElements: [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
    hands: {
      A: ['l-strong', 'l-strong', 'l-strong', 'l-strong', 'l-strong'],
      B: ['l-weak', 'l-weak', 'l-weak', 'l-weak'],
    },
    moves: [
      { handIndex: 0, x: 0, y: 0 },
      { handIndex: 0, x: 1, y: 0 },
      { handIndex: 0, x: 2, y: 0 },
      { handIndex: 0, x: 0, y: 1 },
      { handIndex: 0, x: 1, y: 1 },
      { handIndex: 0, x: 2, y: 1 },
      { handIndex: 0, x: 0, y: 2 },
      { handIndex: 0, x: 1, y: 2 },
      { handIndex: 0, x: 2, y: 2 },
    ],
    ...overrides,
  }
}

describe('POST /api/matches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestUser())
    global.rateLimit.mockReturnValue(undefined)
    global.readBody.mockResolvedValue(body())
    global.db.postgres.lithos.findMany.mockResolvedValue(strongThenWeak)
    global.db.postgres.elements.findMany.mockResolvedValue([])
    global.db.postgres.match.aggregate.mockResolvedValue({ _sum: { xpAwarded: 0 } })
    global.db.postgres.match.create.mockResolvedValue({ id: 'm-1' })
    global.db.postgres.user.update.mockResolvedValue({ xp: 100 })
    global.db.postgres.user.findUnique.mockResolvedValue({ xp: 0, level: 1 })
    global.db.postgres.progressionLevel.findMany.mockResolvedValue([])
    global.db.postgres.levelReward.findMany.mockResolvedValue([])
    global.db.postgres.userChest.upsert.mockResolvedValue({})
  })

  it('records the match and grants xp', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(result.data.result).toBe('win')
    expect(result.data.xpAwarded).toBeGreaterThan(0)
    expect(global.db.postgres.match.create).toHaveBeenCalledTimes(1)
    expect(global.db.postgres.user.update).toHaveBeenCalledTimes(1)
  })

  it('requires authentication', async () => {
    global.getAuthUser.mockImplementation(() => {
      throw { statusCode: 401, statusMessage: 'Unauthorized' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(global.db.postgres.match.create).not.toHaveBeenCalled()
  })

  it('applies the rate limit', async () => {
    global.rateLimit.mockImplementation(() => {
      throw { statusCode: 429, statusMessage: 'Too many requests' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 429 })
    expect(global.db.postgres.match.create).not.toHaveBeenCalled()
  })

  it('rejects an unknown lithos id', async () => {
    global.db.postgres.lithos.findMany.mockResolvedValue([strongThenWeak[0]])

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.match.create).not.toHaveBeenCalled()
  })

  it('rejects an illegal move without writing anything', async () => {
    const invalid = body()
    invalid.moves[1] = { handIndex: 0, x: 0, y: 0 }
    global.readBody.mockResolvedValue(invalid)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.match.create).not.toHaveBeenCalled()
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('rejects an unfinished match', async () => {
    const invalid = body()
    invalid.moves = invalid.moves.slice(0, 8)
    global.readBody.mockResolvedValue(invalid)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects an unsupported difficulty', async () => {
    global.readBody.mockResolvedValue(body({ difficulty: 'nightmare' }))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('reads stone values from the database, never from the request', async () => {
    // Same identifiers, same moves, but the database says the strong-looking
    // stone is the weak one. The outcome must follow the database.
    global.db.postgres.lithos.findMany.mockResolvedValue([
      { id: 'l-strong', spikeUp: 1, spikeDown: 1, spikeLeft: 1, spikeRight: 1, elementId: null },
      { id: 'l-weak', spikeUp: 9, spikeDown: 9, spikeLeft: 9, spikeRight: 9, elementId: null },
    ])

    const result = await handler(event)

    expect(result.data.result).toBe('loss')
  })

  it('grants nothing once the daily cap is reached, and still records the match', async () => {
    global.db.postgres.match.aggregate.mockResolvedValue({ _sum: { xpAwarded: 10_000 } })

    const result = await handler(event)

    expect(result.data.xpAwarded).toBe(0)
    expect(result.data.cappedToday).toBe(true)
    expect(global.db.postgres.match.create).toHaveBeenCalledTimes(1)
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  describe('levelling', () => {
    const curve = [
      { level: 1, xpRequired: 0 },
      { level: 2, xpRequired: 50 },
      { level: 3, xpRequired: 90 },
      { level: 4, xpRequired: 10_000 },
    ]

    beforeEach(() => {
      global.db.postgres.progressionLevel.findMany.mockResolvedValue(curve)
      global.db.postgres.levelReward.findMany.mockResolvedValue([
        { level: 2, kind: 'lithos', quantity: 2, lithosId: 'l-strong' },
        { level: 3, kind: 'lithos', quantity: 1, lithosId: 'l-weak' },
      ])
      global.db.postgres.collections.upsert.mockResolvedValue({})
    })

    it('raises the level and grants every tier crossed', async () => {
      // A win on easy pays 100, which clears both the level 2 and level 3
      // thresholds in a single match.
      const result = await handler(event)

      expect(result.data.level).toBe(3)
      expect(result.data.levelsGained).toEqual([2, 3])
      expect(global.db.postgres.collections.upsert).toHaveBeenCalledTimes(2)
    })

    it('grants nothing when no threshold is crossed', async () => {
      global.db.postgres.progressionLevel.findMany.mockResolvedValue([
        { level: 1, xpRequired: 0 },
        { level: 2, xpRequired: 10_000 },
      ])

      const result = await handler(event)

      expect(result.data.level).toBe(1)
      expect(result.data.levelsGained).toEqual([])
      expect(global.db.postgres.collections.upsert).not.toHaveBeenCalled()
    })

    it('cannot level up on xp the daily cap refused', async () => {
      global.db.postgres.match.aggregate.mockResolvedValue({ _sum: { xpAwarded: 10_000 } })

      const result = await handler(event)

      expect(result.data.xpAwarded).toBe(0)
      expect(result.data.levelsGained).toEqual([])
      expect(global.db.postgres.collections.upsert).not.toHaveBeenCalled()
    })

    it('fills the inventory rather than the collection for a chest tier', async () => {
      global.db.postgres.levelReward.findMany.mockResolvedValue([
        { level: 2, kind: 'chest', quantity: 1, lithosId: null, chestTypeId: 'chest-1' },
      ])

      const result = await handler(event)

      expect(result.data.levelsGained).toEqual([2, 3])
      expect(global.db.postgres.userChest.upsert).toHaveBeenCalledTimes(1)
      expect(global.db.postgres.collections.upsert).not.toHaveBeenCalled()
    })

    it('skips a chest tier with no chest type', async () => {
      global.db.postgres.levelReward.findMany.mockResolvedValue([
        { level: 2, kind: 'chest', quantity: 1, lithosId: null, chestTypeId: null },
      ])

      const result = await handler(event)

      expect(result.data.levelsGained).toEqual([2, 3])
      expect(global.db.postgres.userChest.upsert).not.toHaveBeenCalled()
    })

    it('counts a tier whose lithos was deleted as reached, and hands nothing over', async () => {
      global.db.postgres.levelReward.findMany.mockResolvedValue([
        { level: 2, kind: 'lithos', quantity: 1, lithosId: null },
      ])

      const result = await handler(event)

      expect(result.data.levelsGained).toEqual([2, 3])
      expect(global.db.postgres.collections.upsert).not.toHaveBeenCalled()
    })
  })
})
