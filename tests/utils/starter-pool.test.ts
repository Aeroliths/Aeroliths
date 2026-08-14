import { describe, it, expect, vi, beforeEach } from 'vitest'
import { grantStarterPool, grantStarterPoolSafely } from '~/server/utils/starter-pool'

const STARTER_LITHOS = [
  { id: 'lithos-1', starterQuantity: 2 },
  { id: 'lithos-2', starterQuantity: 1 },
]

describe('server/utils/starter-pool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.db.postgres.user.findUnique.mockResolvedValue({ starterPoolGrantedAt: null })
    global.db.postgres.lithos.findMany.mockResolvedValue(STARTER_LITHOS)
    global.db.postgres.user.updateMany.mockResolvedValue({ count: 1 })
    global.db.postgres.collections.upsert.mockResolvedValue({})
  })

  describe('grantStarterPool', () => {
    it('gives every starter lithos in its configured quantity', async () => {
      const result = await grantStarterPool('user-1')

      expect(result).toEqual({ granted: true })
      expect(global.db.postgres.collections.upsert).toHaveBeenCalledTimes(2)
      expect(global.db.postgres.collections.upsert).toHaveBeenCalledWith({
        where: { userId_lithosId: { userId: 'user-1', lithosId: 'lithos-1' } },
        create: { userId: 'user-1', lithosId: 'lithos-1', quantity: 2 },
        update: { quantity: { increment: 2 } },
      })
    })

    it('sets the marker so the player is never served twice', async () => {
      await grantStarterPool('user-1')

      expect(global.db.postgres.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'user-1', starterPoolGrantedAt: null },
        data: { starterPoolGrantedAt: expect.any(Date) },
      })
    })

    it('skips a player who already received the pool', async () => {
      global.db.postgres.user.findUnique.mockResolvedValue({
        starterPoolGrantedAt: new Date('2026-01-01'),
      })

      const result = await grantStarterPool('user-1')

      expect(result).toEqual({ granted: false })
      expect(global.db.postgres.collections.upsert).not.toHaveBeenCalled()
      expect(global.db.postgres.user.updateMany).not.toHaveBeenCalled()
    })

    it('skips an unknown user', async () => {
      global.db.postgres.user.findUnique.mockResolvedValue(null)

      const result = await grantStarterPool('ghost')

      expect(result).toEqual({ granted: false })
      expect(global.db.postgres.collections.upsert).not.toHaveBeenCalled()
    })

    it('leaves the marker null when the pool is empty', async () => {
      global.db.postgres.lithos.findMany.mockResolvedValue([])

      const result = await grantStarterPool('user-1')

      expect(result).toEqual({ granted: false })
      expect(global.db.postgres.user.updateMany).not.toHaveBeenCalled()
      expect(global.db.postgres.collections.upsert).not.toHaveBeenCalled()
    })

    it('grants nothing when a concurrent call already claimed the marker', async () => {
      global.db.postgres.user.updateMany.mockResolvedValue({ count: 0 })

      const result = await grantStarterPool('user-1')

      expect(result).toEqual({ granted: false })
      expect(global.db.postgres.collections.upsert).not.toHaveBeenCalled()
    })

    it('propagates a database failure', async () => {
      global.db.postgres.collections.upsert.mockRejectedValue(new Error('db down'))

      await expect(grantStarterPool('user-1')).rejects.toThrow('db down')
    })
  })

  describe('grantStarterPoolSafely', () => {
    it('swallows and logs a failure so the caller can carry on', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      global.db.postgres.collections.upsert.mockRejectedValue(new Error('db down'))

      await expect(grantStarterPoolSafely('user-1')).resolves.toBeUndefined()
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })
})
