import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/admin/progression/rewards.put'
import { createTestAdmin, createTestUser } from '../../../utils/auth'

const event = {} as any

const validReward = { level: 2, kind: 'lithos', quantity: 3, lithosId: 'l-1' }

describe('PUT /api/admin/progression/rewards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.requireRole.mockReturnValue(undefined)
    global.readBody.mockResolvedValue({ rewards: [validReward] })
    global.db.postgres.progressionLevel.findMany.mockResolvedValue([
      { level: 1 },
      { level: 2 },
      { level: 3 },
    ])
    global.db.postgres.levelReward.deleteMany.mockResolvedValue({ count: 0 })
    global.db.postgres.levelReward.create.mockResolvedValue({})
  })

  it('replaces the reward table', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.levelReward.deleteMany).toHaveBeenCalledTimes(1)
    expect(global.db.postgres.levelReward.create).toHaveBeenCalledTimes(1)
  })

  it('rejects a caller who is not an admin', async () => {
    global.getAuthUser.mockReturnValue(createTestUser())
    global.requireRole.mockImplementation(() => {
      throw { statusCode: 403, statusMessage: 'Forbidden' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(global.db.postgres.levelReward.deleteMany).not.toHaveBeenCalled()
  })

  it('refuses a tier on a level the curve does not define', async () => {
    global.readBody.mockResolvedValue({ rewards: [{ ...validReward, level: 9 }] })

    // Such a tier could never pay out, so it is a configuration mistake rather
    // than a harmless row.
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.levelReward.deleteMany).not.toHaveBeenCalled()
  })

  it('refuses two tiers on the same level', async () => {
    global.readBody.mockResolvedValue({ rewards: [validReward, { ...validReward, quantity: 1 }] })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('refuses a lithos reward with no lithos', async () => {
    global.readBody.mockResolvedValue({ rewards: [{ ...validReward, lithosId: '' }] })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('refuses a quantity below one', async () => {
    global.readBody.mockResolvedValue({ rewards: [{ ...validReward, quantity: 0 }] })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('refuses an unknown reward kind', async () => {
    global.readBody.mockResolvedValue({ rewards: [{ ...validReward, kind: 'chest' }] })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('accepts an empty table, which clears every tier', async () => {
    global.readBody.mockResolvedValue({ rewards: [] })

    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.levelReward.deleteMany).toHaveBeenCalledTimes(1)
    expect(global.db.postgres.levelReward.create).not.toHaveBeenCalled()
  })
})
