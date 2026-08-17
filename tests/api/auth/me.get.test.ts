import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/auth/me.get'
import { createTestUser } from '../../utils/auth'

const event = {} as any

function storedUser(overrides: Record<string, any> = {}) {
  return {
    id: 'test-user-id',
    email: 'user@test.com',
    username: 'user',
    profilePicture: null,
    emailVerified: true,
    lastActiveAt: new Date('2026-08-01'),
    deletionRequestedAt: null,
    createdAt: new Date('2026-01-01'),
    xp: 120,
    level: 2,
    role: { id: 'role-1', name: 'user' },
    authentication: { tokenVersion: 0 },
    ...overrides,
  }
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue({ ...createTestUser(), tokenVersion: 0 })
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser())
    global.db.postgres.user.update.mockResolvedValue({})
    global.db.postgres.progressionLevel.findFirst.mockResolvedValue({ xpRequired: 250 })
  })

  it('returns the current user', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(result.data.id).toBe('test-user-id')
    expect(result.data.role.name).toBe('user')
  })

  it('returns the progression, with the next threshold resolved server side', async () => {
    const result = await handler(event)

    expect(result.data.xp).toBe(120)
    expect(result.data.level).toBe(2)
    // The curve table is admin-only, so the client is handed the number it
    // needs rather than the table it would have to read.
    expect(result.data.nextLevelXp).toBe(250)
  })

  it('reports no next threshold at the top of the curve', async () => {
    global.db.postgres.progressionLevel.findFirst.mockResolvedValue(null)

    const result = await handler(event)

    expect(result.data.nextLevelXp).toBeNull()
  })

  it('never returns the authentication row', async () => {
    const result = await handler(event)

    expect(result.data).not.toHaveProperty('authentication')
  })

  it('requires authentication', async () => {
    global.getAuthUser.mockImplementation(() => {
      throw { statusCode: 401, statusMessage: 'Unauthorized' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(global.db.postgres.user.findUnique).not.toHaveBeenCalled()
  })

  it('answers 404 when the account no longer exists', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(null)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('rejects a token issued before the last password change', async () => {
    // The stored version moved on; the token still carries the old one.
    global.getAuthUser.mockReturnValue({ ...createTestUser(), tokenVersion: 1 })
    global.db.postgres.user.findUnique.mockResolvedValue(
      storedUser({ authentication: { tokenVersion: 2 } }),
    )

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('refreshes the last active date', async () => {
    await handler(event)

    expect(global.db.postgres.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-user-id' },
        data: { lastActiveAt: expect.any(Date) },
      }),
    )
  })
})
