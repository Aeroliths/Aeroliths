import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~/server/api/admin/media/[id].delete'
import { createTestAdmin, createTestUser } from '../../../utils/auth'

const event = {} as any

describe('DELETE /api/admin/media/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.requireRole.mockReturnValue(undefined)
    global.getRouterParam.mockReturnValue('media-1')
    global.db.postgres.mediaAsset.findUnique.mockResolvedValue({
      id: 'media-1',
      category: 'lithos',
      path: '/app/uploads/lithos/a.png',
      label: 'a.png',
    })
    global.db.postgres.lithos.count.mockResolvedValue(0)
    global.db.postgres.elements.count.mockResolvedValue(0)
    global.db.postgres.lithos.findMany.mockResolvedValue([])
    global.db.postgres.elements.findMany.mockResolvedValue([])
    global.db.postgres.mediaAsset.delete.mockResolvedValue({ id: 'media-1' })
    global.delete_image.mockResolvedValue(undefined)
  })

  it('rejects a caller who is not an admin', async () => {
    global.getAuthUser.mockReturnValue(createTestUser())
    global.requireRole.mockImplementation(() => {
      throw { statusCode: 403, statusMessage: 'Forbidden' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(global.delete_image).not.toHaveBeenCalled()
  })

  it('returns 404 when the asset does not exist', async () => {
    global.db.postgres.mediaAsset.findUnique.mockResolvedValue(null)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('refuses to delete an asset still in use and names the users', async () => {
    global.db.postgres.lithos.count.mockResolvedValue(1)
    global.db.postgres.lithos.findMany.mockResolvedValue([{ name: 'Granite' }])
    global.db.postgres.elements.findMany.mockResolvedValue([{ name: 'Fire' }])

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 409,
      data: { usageCount: 1, usedBy: ['Granite', 'Fire'] },
    })

    expect(global.delete_image).not.toHaveBeenCalled()
    expect(global.db.postgres.mediaAsset.delete).not.toHaveBeenCalled()
  })

  it('deletes the row and the file when nothing references it', async () => {
    const result = await handler(event)

    expect(global.delete_image).toHaveBeenCalledWith(
      '/app/uploads/lithos/a.png',
      expect.anything(),
    )
    expect(global.db.postgres.mediaAsset.delete).toHaveBeenCalledWith({
      where: { id: 'media-1' },
    })
    expect(result.success).toBe(true)
  })

  it('still removes the row when the file is already gone', async () => {
    global.delete_image.mockRejectedValue({ statusCode: 404, message: 'Image file not found' })

    const result = await handler(event)

    expect(global.db.postgres.mediaAsset.delete).toHaveBeenCalledWith({
      where: { id: 'media-1' },
    })
    expect(result.success).toBe(true)
  })
})
