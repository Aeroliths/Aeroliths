import { describe, it, expect, vi, beforeEach } from 'vitest'
import createHandler from '~/server/api/lithos/index.post'
import patchHandler from '~/server/api/lithos/[id].patch'
import deleteHandler from '~/server/api/admin/lithos/[id].delete'
import { createTestAdmin } from '../../utils/auth'

const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const event = {} as any

const baseBody = {
  name: 'Granite',
  rarity: 'common',
  spikeUp: 1,
  spikeRight: 1,
  spikeDown: 1,
  spikeLeft: 1,
}

describe('lithos sprite sources', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.requireRole.mockReturnValue(undefined)
    global.getRouterParam.mockReturnValue('lithos-1')
    global.db.postgres.lithos.create.mockImplementation(({ data }: any) => ({
      id: 'lithos-1',
      ...data,
    }))
    global.db.postgres.lithos.update.mockImplementation(({ data }: any) => ({
      id: 'lithos-1',
      ...data,
    }))
    global.db.postgres.lithos.delete.mockResolvedValue({ id: 'lithos-1' })
    global.db.postgres.lithos.findUnique.mockResolvedValue({
      id: 'lithos-1',
      name: 'Granite',
      sprite: '/app/uploads/lithos/old.png',
    })
  })

  describe('POST /api/lithos', () => {
    it('uses the path of an existing library asset', async () => {
      global.readBody.mockResolvedValue({ ...baseBody, mediaId: 'media-1' })
      global.db.postgres.mediaAsset.findUnique.mockResolvedValue({
        id: 'media-1',
        category: 'lithos',
        path: '/app/uploads/lithos/granite.png',
      })

      const result = await createHandler(event)

      expect(global.upload_image).not.toHaveBeenCalled()
      expect(result.data.sprite).toBe('/app/uploads/lithos/granite.png')
    })

    it('returns 400 when the mediaId belongs to the elements library', async () => {
      global.readBody.mockResolvedValue({ ...baseBody, mediaId: 'media-1' })
      global.db.postgres.mediaAsset.findUnique.mockResolvedValue({
        id: 'media-1',
        category: 'elements',
        path: '/app/uploads/elements/fire.png',
      })

      await expect(createHandler(event)).rejects.toMatchObject({ statusCode: 400 })
    })

    it('still accepts a base64 sprite and registers it in the library', async () => {
      global.readBody.mockResolvedValue({ ...baseBody, sprite: PNG_DATA_URL })
      global.db.postgres.mediaAsset.findUnique.mockResolvedValue(null)
      global.upload_image.mockResolvedValue('/app/uploads/lithos/lithos-1-abc.png')
      global.db.postgres.mediaAsset.create.mockImplementation(({ data }: any) => data)

      const result = await createHandler(event)

      expect(global.db.postgres.mediaAsset.create).toHaveBeenCalled()
      expect(result.data.sprite).toBe('/app/uploads/lithos/lithos-1-abc.png')
    })

    it('returns 400 when neither sprite nor mediaId is given', async () => {
      global.readBody.mockResolvedValue(baseBody)

      await expect(createHandler(event)).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('PATCH /api/lithos/:id', () => {
    it('swaps the sprite without deleting the previous file', async () => {
      global.readBody.mockResolvedValue({ mediaId: 'media-2' })
      global.db.postgres.mediaAsset.findUnique.mockResolvedValue({
        id: 'media-2',
        category: 'lithos',
        path: '/app/uploads/lithos/new.png',
      })

      const result = await patchHandler(event)

      expect(result.data.sprite).toBe('/app/uploads/lithos/new.png')
      expect(global.delete_image).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/admin/lithos/:id', () => {
    it('leaves the image in the library', async () => {
      await deleteHandler(event)

      expect(global.delete_image).not.toHaveBeenCalled()
      expect(global.db.postgres.lithos.delete).toHaveBeenCalledWith({
        where: { id: 'lithos-1' },
      })
    })
  })
})
