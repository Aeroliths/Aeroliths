import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/admin/media/[id].patch'
import { createTestAdmin, createTestUser } from '../../../utils/auth'

const event = {} as any

describe('PATCH /api/admin/media/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.requireRole.mockReturnValue(undefined)
    global.getRouterParam.mockReturnValue('media-1')
    global.readBody.mockResolvedValue({ label: 'Blue shard' })
    global.db.postgres.mediaAsset.findUnique.mockResolvedValue({
      id: 'media-1',
      category: 'lithos',
      path: '/app/uploads/lithos/a.png',
      label: 'a.png',
    })
    global.db.postgres.mediaAsset.update.mockImplementation(({ data }: any) => ({
      id: 'media-1',
      ...data,
    }))
  })

  it('rejects a caller who is not an admin', async () => {
    global.getAuthUser.mockReturnValue(createTestUser())
    global.requireRole.mockImplementation(() => {
      throw { statusCode: 403, statusMessage: 'Forbidden' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns 404 when the asset does not exist', async () => {
    global.db.postgres.mediaAsset.findUnique.mockResolvedValue(null)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('rejects a non-string label', async () => {
    global.readBody.mockResolvedValue({ label: 42 })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects an empty label', async () => {
    global.readBody.mockResolvedValue({ label: '   ' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('updates the label and leaves the path untouched', async () => {
    const result = await handler(event)

    expect(global.db.postgres.mediaAsset.update).toHaveBeenCalledWith({
      where: { id: 'media-1' },
      data: { label: 'Blue shard' },
    })
    expect(result.success).toBe(true)
    expect(result.data.label).toBe('Blue shard')
  })
})
