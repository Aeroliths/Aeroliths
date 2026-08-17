import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/chests/[id]/open.post'
import { createTestUser } from '../../utils/auth'

const event = {} as any

describe('POST /api/chests/[id]/open', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestUser())
    global.rateLimit.mockReturnValue(undefined)
    global.getRouterParam.mockReturnValue('chest-1')
    global.db.postgres.lootEntry.findMany.mockResolvedValue([{ lithosId: 'l-1', weight: 1 }])
    global.db.postgres.userChest.updateMany.mockResolvedValue({ count: 1 })
    global.db.postgres.collections.upsert.mockResolvedValue({})
    global.db.postgres.lithos.findUnique.mockResolvedValue({
      id: 'l-1',
      name: 'Stone',
      sprite: '/sprites/l-1.png',
    })
  })

  it('consumes one chest and hands over a lithos', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(result.data.lithos.id).toBe('l-1')
    expect(global.db.postgres.userChest.updateMany).toHaveBeenCalledTimes(1)
    expect(global.db.postgres.collections.upsert).toHaveBeenCalledTimes(1)
  })

  it('only decrements a row that still has a chest in it', async () => {
    await handler(event)

    // The guard is what stops two concurrent openings from spending the same
    // chest, and from going negative.
    const { where } = global.db.postgres.userChest.updateMany.mock.calls[0]![0]
    expect(where.quantity).toEqual({ gt: 0 })
    expect(where.userId).toBe('test-user-id')
  })

  it('refuses when the player holds none of that kind', async () => {
    global.db.postgres.userChest.updateMany.mockResolvedValue({ count: 0 })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.collections.upsert).not.toHaveBeenCalled()
  })

  it('refuses an empty loot table without consuming the chest', async () => {
    global.db.postgres.lootEntry.findMany.mockResolvedValue([])

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.userChest.updateMany).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    global.getAuthUser.mockImplementation(() => {
      throw { statusCode: 401, statusMessage: 'Unauthorized' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(global.db.postgres.userChest.updateMany).not.toHaveBeenCalled()
  })

  it('applies the rate limit', async () => {
    global.rateLimit.mockImplementation(() => {
      throw { statusCode: 429, statusMessage: 'Too many requests' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 429 })
  })

  it('rejects a request with no chest type', async () => {
    global.getRouterParam.mockReturnValue(undefined)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })
})
