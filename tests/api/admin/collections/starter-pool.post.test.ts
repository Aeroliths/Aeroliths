import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~/server/api/admin/collections/starter-pool.post'
import { createTestAdmin, createTestUser } from '../../../utils/auth'

const event = {} as any

describe('POST /api/admin/collections/starter-pool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.requireRole.mockReturnValue(undefined)
    global.db.postgres.lithos.count.mockResolvedValue(2)
    global.db.postgres.lithos.findMany.mockResolvedValue([
      { id: 'lithos-1', starterQuantity: 2 },
    ])
    global.db.postgres.user.findUnique.mockResolvedValue({ starterPoolGrantedAt: null })
    global.db.postgres.user.updateMany.mockResolvedValue({ count: 1 })
    global.db.postgres.collections.upsert.mockResolvedValue({})
  })

  it('rejects a caller who is not an admin', async () => {
    global.getAuthUser.mockReturnValue(createTestUser())
    global.requireRole.mockImplementation(() => {
      throw { statusCode: 403, statusMessage: 'Forbidden' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(global.db.postgres.collections.upsert).not.toHaveBeenCalled()
  })

  it('serves every player who never received the pool', async () => {
    global.db.postgres.user.findMany
      .mockResolvedValueOnce([{ id: 'user-1' }, { id: 'user-2' }])
      .mockResolvedValue([])

    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(result.data.usersUpdated).toBe(2)
    expect(global.db.postgres.collections.upsert).toHaveBeenCalledTimes(2)
  })

  it('serves nobody on a second consecutive run', async () => {
    global.db.postgres.user.findMany.mockResolvedValue([])

    const result = await handler(event)

    expect(result.data.usersUpdated).toBe(0)
    expect(global.db.postgres.collections.upsert).not.toHaveBeenCalled()
  })

  it('does nothing when no lithos is flagged as starter', async () => {
    global.db.postgres.lithos.count.mockResolvedValue(0)

    const result = await handler(event)

    expect(result.data.usersUpdated).toBe(0)
    expect(global.db.postgres.user.findMany).not.toHaveBeenCalled()
  })

  it('stops instead of looping when a batch grants nothing', async () => {
    // Every user in the batch turns out to be already served. Without the
    // guard, the same batch would come back forever.
    global.db.postgres.user.findMany.mockResolvedValue([{ id: 'user-1' }])
    global.db.postgres.user.updateMany.mockResolvedValue({ count: 0 })

    const result = await handler(event)

    expect(result.data.usersUpdated).toBe(0)
    expect(global.db.postgres.user.findMany).toHaveBeenCalledTimes(1)
  })
})
