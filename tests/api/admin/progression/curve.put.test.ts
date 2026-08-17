import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/admin/progression/curve.put'
import { createTestAdmin, createTestUser } from '../../../utils/auth'

const event = {} as any

const validCurve = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
]

describe('PUT /api/admin/progression/curve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.requireRole.mockReturnValue(undefined)
    global.readBody.mockResolvedValue({ curve: validCurve })
    global.db.postgres.progressionLevel.deleteMany.mockResolvedValue({ count: 0 })
    global.db.postgres.progressionLevel.createMany.mockResolvedValue({ count: 2 })
  })

  it('replaces the curve', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.progressionLevel.deleteMany).toHaveBeenCalledTimes(1)
    expect(global.db.postgres.progressionLevel.createMany).toHaveBeenCalledTimes(1)
  })

  it('rejects a caller who is not an admin', async () => {
    global.getAuthUser.mockReturnValue(createTestUser())
    global.requireRole.mockImplementation(() => {
      throw { statusCode: 403, statusMessage: 'Forbidden' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(global.db.postgres.progressionLevel.deleteMany).not.toHaveBeenCalled()
  })

  it('leaves the stored curve untouched when the new one is invalid', async () => {
    global.readBody.mockResolvedValue({
      curve: [
        { level: 1, xpRequired: 0 },
        { level: 3, xpRequired: 100 },
      ],
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.progressionLevel.deleteMany).not.toHaveBeenCalled()
    expect(global.db.postgres.progressionLevel.createMany).not.toHaveBeenCalled()
  })

  it('rejects a body that is not a list', async () => {
    global.readBody.mockResolvedValue({ curve: 'nope' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects non numeric entries', async () => {
    global.readBody.mockResolvedValue({ curve: [{ level: '1', xpRequired: 0 }] })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('accepts an empty curve, which disables levelling', async () => {
    global.readBody.mockResolvedValue({ curve: [] })

    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.progressionLevel.deleteMany).toHaveBeenCalledTimes(1)
    expect(global.db.postgres.progressionLevel.createMany).not.toHaveBeenCalled()
  })
})
