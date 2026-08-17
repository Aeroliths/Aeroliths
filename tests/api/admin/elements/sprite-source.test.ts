import { describe, it, expect, vi, beforeEach } from 'vitest'
import createHandler from '~~/server/api/admin/elements/index.post'
import patchHandler from '~~/server/api/admin/elements/[id].patch'
import deleteHandler from '~~/server/api/admin/elements/[id].delete'
import { createTestAdmin } from '../../../utils/auth'

const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const event = {} as any

describe('element sprite sources', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.requireRole.mockReturnValue(undefined)
    global.getRouterParam.mockReturnValue('element-1')
    global.db.postgres.elements.create.mockImplementation(({ data }: any) => ({
      id: 'element-1',
      ...data,
    }))
    global.db.postgres.elements.update.mockImplementation(({ data }: any) => ({
      id: 'element-1',
      ...data,
    }))
    global.db.postgres.elements.delete.mockResolvedValue({ id: 'element-1' })
    global.db.postgres.elements.findUnique.mockResolvedValue({
      id: 'element-1',
      name: 'Fire',
      sprite: '/app/uploads/elements/old.png',
    })
  })

  describe('POST /api/admin/elements', () => {
    it('uses the path of an existing library asset', async () => {
      global.readBody.mockResolvedValue({ name: 'Fire', mediaId: 'media-1' })
      global.db.postgres.mediaAsset.findUnique.mockResolvedValue({
        id: 'media-1',
        category: 'elements',
        path: '/app/uploads/elements/fire.png',
      })

      const result = await createHandler(event)

      expect(global.upload_image).not.toHaveBeenCalled()
      expect(result.data.sprite).toBe('/app/uploads/elements/fire.png')
    })

    it('returns 404 for an unknown mediaId', async () => {
      global.readBody.mockResolvedValue({ name: 'Fire', mediaId: 'nope' })
      global.db.postgres.mediaAsset.findUnique.mockResolvedValue(null)

      await expect(createHandler(event)).rejects.toMatchObject({ statusCode: 404 })
    })

    it('returns 400 when the mediaId belongs to the lithos library', async () => {
      global.readBody.mockResolvedValue({ name: 'Fire', mediaId: 'media-1' })
      global.db.postgres.mediaAsset.findUnique.mockResolvedValue({
        id: 'media-1',
        category: 'lithos',
        path: '/app/uploads/lithos/granite.png',
      })

      await expect(createHandler(event)).rejects.toMatchObject({ statusCode: 400 })
    })

    it('still accepts a base64 sprite and registers it in the library', async () => {
      global.readBody.mockResolvedValue({ name: 'Fire', sprite: PNG_DATA_URL })
      global.db.postgres.mediaAsset.findUnique.mockResolvedValue(null)
      global.upload_image.mockResolvedValue('/app/uploads/elements/elements-1-abc.png')
      global.db.postgres.mediaAsset.create.mockImplementation(({ data }: any) => data)

      const result = await createHandler(event)

      expect(global.db.postgres.mediaAsset.create).toHaveBeenCalled()
      expect(result.data.sprite).toBe('/app/uploads/elements/elements-1-abc.png')
    })

    it('returns 400 when neither sprite nor mediaId is given', async () => {
      global.readBody.mockResolvedValue({ name: 'Fire' })

      await expect(createHandler(event)).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('PATCH /api/admin/elements/:id', () => {
    it('swaps the sprite without deleting the previous file', async () => {
      global.readBody.mockResolvedValue({ mediaId: 'media-2' })
      global.db.postgres.mediaAsset.findUnique.mockResolvedValue({
        id: 'media-2',
        category: 'elements',
        path: '/app/uploads/elements/new.png',
      })

      const result = await patchHandler(event)

      expect(result.data.sprite).toBe('/app/uploads/elements/new.png')
      expect(global.delete_image).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/admin/elements/:id', () => {
    it('leaves the image in the library', async () => {
      await deleteHandler(event)

      expect(global.delete_image).not.toHaveBeenCalled()
      expect(global.db.postgres.elements.delete).toHaveBeenCalledWith({
        where: { id: 'element-1' },
      })
    })
  })
})
