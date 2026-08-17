import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/admin/media/index.get'
import { createTestAdmin, createTestUser } from '../../../utils/auth'

const event = {} as any

describe('GET /api/admin/media', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.requireRole.mockReturnValue(undefined)
    global.getQuery.mockReturnValue({ category: 'lithos' })
    global.db.postgres.mediaAsset.findMany.mockResolvedValue([])
  })

  it('rejects a caller who is not an admin', async () => {
    global.getAuthUser.mockReturnValue(createTestUser())
    global.requireRole.mockImplementation(() => {
      throw { statusCode: 403, statusMessage: 'Forbidden' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(global.db.postgres.mediaAsset.findMany).not.toHaveBeenCalled()
  })

  it('rejects an unknown category', async () => {
    global.getQuery.mockReturnValue({ category: 'news' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects a missing category', async () => {
    global.getQuery.mockReturnValue({})

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns the category assets newest first', async () => {
    global.db.postgres.mediaAsset.findMany.mockResolvedValue([
      { id: 'media-1', category: 'lithos', path: '/app/uploads/lithos/a.png', label: 'a.png' },
    ])
    global.db.postgres.lithos.count.mockResolvedValue(1)
    global.db.postgres.elements.count.mockResolvedValue(0)

    const result = await handler(event)

    expect(global.db.postgres.mediaAsset.findMany).toHaveBeenCalledWith({
      where: { category: 'lithos' },
      orderBy: { createdAt: 'desc' },
    })
    expect(result.success).toBe(true)
    expect(result.data).toEqual([
      {
        id: 'media-1',
        category: 'lithos',
        path: '/app/uploads/lithos/a.png',
        label: 'a.png',
        usageCount: 1,
      },
    ])
  })

  it('reports usage coming from the other category', async () => {
    global.db.postgres.mediaAsset.findMany.mockResolvedValue([
      { id: 'media-1', category: 'lithos', path: '/app/uploads/lithos/a.png', label: 'a.png' },
    ])
    global.db.postgres.lithos.count.mockResolvedValue(0)
    global.db.postgres.elements.count.mockResolvedValue(2)

    const result = await handler(event)

    expect(result.data[0].usageCount).toBe(2)
  })
})
