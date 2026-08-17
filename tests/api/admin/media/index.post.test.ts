import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/admin/media/index.post'
import { createTestAdmin, createTestUser } from '../../../utils/auth'

const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const event = {} as any

describe('POST /api/admin/media', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.requireRole.mockReturnValue(undefined)
    global.readBody.mockResolvedValue({ category: 'lithos', image: PNG_DATA_URL })
    global.db.postgres.mediaAsset.findUnique.mockResolvedValue(null)
    global.upload_image.mockResolvedValue('/app/uploads/lithos/lithos-1-abc.png')
    global.db.postgres.mediaAsset.create.mockImplementation(({ data }: any) => ({
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
    expect(global.upload_image).not.toHaveBeenCalled()
  })

  it('rejects an unknown category', async () => {
    global.readBody.mockResolvedValue({ category: 'profile', image: PNG_DATA_URL })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects a missing image', async () => {
    global.readBody.mockResolvedValue({ category: 'lithos' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('uploads a new image and returns the created asset', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(result.reused).toBe(false)
    expect(result.data).toMatchObject({
      id: 'media-1',
      category: 'lithos',
      path: '/app/uploads/lithos/lithos-1-abc.png',
      label: 'lithos-1-abc.png',
    })
  })

  it('reuses the existing asset when the same bytes are already stored', async () => {
    const existing = {
      id: 'media-9',
      category: 'lithos',
      path: '/app/uploads/lithos/old.png',
      label: 'old.png',
    }
    global.db.postgres.mediaAsset.findUnique.mockResolvedValue(existing)

    const result = await handler(event)

    expect(result.reused).toBe(true)
    expect(result.data).toEqual(existing)
    expect(global.upload_image).not.toHaveBeenCalled()
    expect(global.db.postgres.mediaAsset.create).not.toHaveBeenCalled()
  })

  it('stores the provided label', async () => {
    global.readBody.mockResolvedValue({
      category: 'lithos',
      image: PNG_DATA_URL,
      label: 'Blue shard',
    })

    const result = await handler(event)

    expect(result.data.label).toBe('Blue shard')
  })
})
