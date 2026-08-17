import { describe, it, expect, vi, beforeEach } from 'vitest'
import createChest from '~~/server/api/admin/chests/index.post'
import deleteChest from '~~/server/api/admin/chests/[id].delete'
import saveLoot from '~~/server/api/admin/chests/[id]/loot.put'
import { createTestAdmin, createTestUser } from '../../../utils/auth'

const event = {} as any

describe('admin chest management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.requireRole.mockReturnValue(undefined)
    global.getRouterParam.mockReturnValue('chest-1')
    global.readBody.mockResolvedValue({ name: 'Wooden chest' })
    global.db.postgres.chestType.create.mockResolvedValue({ id: 'chest-1' })
    global.db.postgres.chestType.delete.mockResolvedValue({})
    global.db.postgres.userChest.findMany.mockResolvedValue([])
    global.db.postgres.levelReward.findMany.mockResolvedValue([])
    global.db.postgres.lootEntry.deleteMany.mockResolvedValue({ count: 0 })
    global.db.postgres.lootEntry.create.mockResolvedValue({})
  })

  it('creates a chest type', async () => {
    const result = await createChest(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.chestType.create).toHaveBeenCalledTimes(1)
  })

  it('refuses a chest type with no name', async () => {
    global.readBody.mockResolvedValue({ name: '  ' })

    await expect(createChest(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('refuses a non admin', async () => {
    global.getAuthUser.mockReturnValue(createTestUser())
    global.requireRole.mockImplementation(() => {
      throw { statusCode: 403, statusMessage: 'Forbidden' }
    })

    await expect(createChest(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(global.db.postgres.chestType.create).not.toHaveBeenCalled()
  })

  it('deletes an unused chest type', async () => {
    const result = await deleteChest(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.chestType.delete).toHaveBeenCalledTimes(1)
  })

  it('refuses to delete a type players are holding', async () => {
    global.db.postgres.userChest.findMany.mockResolvedValue([{ id: 'held' }])

    // Deleting it would take chests out of players' hands.
    await expect(deleteChest(event)).rejects.toMatchObject({ statusCode: 409 })
    expect(global.db.postgres.chestType.delete).not.toHaveBeenCalled()
  })

  it('refuses to delete a type a reward tier points at', async () => {
    global.db.postgres.levelReward.findMany.mockResolvedValue([{ level: 2 }])

    await expect(deleteChest(event)).rejects.toMatchObject({ statusCode: 409 })
    expect(global.db.postgres.chestType.delete).not.toHaveBeenCalled()
  })

  it('replaces the loot table of a type', async () => {
    global.readBody.mockResolvedValue({
      entries: [
        { lithosId: 'l-1', weight: 3 },
        { lithosId: 'l-2', weight: 1 },
      ],
    })

    const result = await saveLoot(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.lootEntry.deleteMany).toHaveBeenCalledTimes(1)
    expect(global.db.postgres.lootEntry.create).toHaveBeenCalledTimes(2)
  })

  it('refuses a weight below one', async () => {
    global.readBody.mockResolvedValue({ entries: [{ lithosId: 'l-1', weight: 0 }] })

    await expect(saveLoot(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.lootEntry.deleteMany).not.toHaveBeenCalled()
  })

  it('refuses the same lithos twice in one table', async () => {
    global.readBody.mockResolvedValue({
      entries: [
        { lithosId: 'l-1', weight: 1 },
        { lithosId: 'l-1', weight: 2 },
      ],
    })

    await expect(saveLoot(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('accepts an empty table, which empties the chest', async () => {
    global.readBody.mockResolvedValue({ entries: [] })

    const result = await saveLoot(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.lootEntry.create).not.toHaveBeenCalled()
  })
})
