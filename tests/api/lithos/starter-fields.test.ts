import { describe, it, expect, vi, beforeEach } from 'vitest'
import createHandler from '~~/server/api/lithos/index.post'
import patchHandler from '~~/server/api/lithos/[id].patch'
import { createTestAdmin } from '../../utils/auth'

const event = {} as any

const validBody = {
  name: 'Starter Shard',
  mediaId: 'media-1',
  rarity: 'common',
  spikeUp: 1,
  spikeRight: 1,
  spikeDown: 1,
  spikeLeft: 1,
}

describe('lithos starter pool fields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.requireRole.mockReturnValue(undefined)
    global.getRouterParam.mockReturnValue('lithos-1')
    global.db.postgres.mediaAsset.findUnique.mockResolvedValue({
      id: 'media-1',
      category: 'lithos',
      path: '/app/uploads/lithos/a.png',
    })
    global.db.postgres.lithos.findUnique.mockResolvedValue({ id: 'lithos-1', name: 'Shard' })
    global.db.postgres.lithos.create.mockImplementation(({ data }: any) => ({
      id: 'lithos-1',
      ...data,
    }))
    global.db.postgres.lithos.update.mockImplementation(({ data }: any) => ({
      id: 'lithos-1',
      ...data,
    }))
  })

  describe('POST /api/lithos', () => {
    it('leaves the starter fields to their database defaults when not sent', async () => {
      global.readBody.mockResolvedValue(validBody)

      await createHandler(event)

      const { data } = global.db.postgres.lithos.create.mock.calls[0][0]
      expect(data).not.toHaveProperty('isStarter')
      expect(data).not.toHaveProperty('starterQuantity')
    })

    it('stores the starter flag and quantity', async () => {
      global.readBody.mockResolvedValue({ ...validBody, isStarter: true, starterQuantity: 3 })

      const result = await createHandler(event)

      expect(result.data.isStarter).toBe(true)
      expect(result.data.starterQuantity).toBe(3)
    })

    it('rejects a starter quantity below 1', async () => {
      global.readBody.mockResolvedValue({ ...validBody, isStarter: true, starterQuantity: 0 })

      await expect(createHandler(event)).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('PATCH /api/lithos/[id]', () => {
    it('updates the starter flag and quantity', async () => {
      global.readBody.mockResolvedValue({ isStarter: true, starterQuantity: 2 })

      const result = await patchHandler(event)

      expect(result.data.isStarter).toBe(true)
      expect(result.data.starterQuantity).toBe(2)
    })

    it('can take a lithos back out of the pool', async () => {
      global.readBody.mockResolvedValue({ isStarter: false })

      const result = await patchHandler(event)

      expect(result.data.isStarter).toBe(false)
    })

    it('rejects a starter quantity below 1', async () => {
      global.readBody.mockResolvedValue({ isStarter: true, starterQuantity: 0 })

      await expect(patchHandler(event)).rejects.toMatchObject({ statusCode: 400 })
    })
  })
})
