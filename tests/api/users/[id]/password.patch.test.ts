import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/users/[id]/password.patch'
import { createTestAdmin, createTestUser } from '../../../utils/auth'

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(async () => true),
    hash: vi.fn(async () => 'new-hash'),
  },
}))

import bcrypt from 'bcrypt'

const event = {} as any
const compare = bcrypt.compare as unknown as ReturnType<typeof vi.fn>
const STRONG_PASSWORD = 'Str0ng-Passw0rd!'

function storedUser(overrides: Record<string, any> = {}) {
  return {
    id: 'test-user-id',
    email: 'user@test.com',
    authentication: { password: 'old-hash', tokenVersion: 4 },
    role: { id: 'role-1', name: 'user' },
    ...overrides,
  }
}

describe('PATCH /api/users/[id]/password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.rateLimit.mockReturnValue(undefined)
    global.getAuthUser.mockReturnValue(createTestUser())
    global.getRouterParam.mockReturnValue('test-user-id')
    global.readBody.mockResolvedValue({
      currentPassword: 'old password',
      newPassword: STRONG_PASSWORD,
    })
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser())
    global.db.postgres.authentication.update.mockResolvedValue({})
    compare.mockResolvedValue(true)
  })

  it('changes the password of the caller', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.authentication.update).toHaveBeenCalledTimes(1)
  })

  it('invalidates every existing session', async () => {
    await handler(event)

    const { data } = global.db.postgres.authentication.update.mock.calls[0]![0]
    expect(data.tokenVersion).toEqual({ increment: 1 })
  })

  it('stores the new password hashed', async () => {
    await handler(event)

    const { data } = global.db.postgres.authentication.update.mock.calls[0]![0]
    expect(data.password).toBe('new-hash')
    expect(data.password).not.toBe(STRONG_PASSWORD)
  })

  it('refuses to change another user password', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser({ id: 'someone-else' }))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(global.db.postgres.authentication.update).not.toHaveBeenCalled()
  })

  it('requires the current password when changing your own', async () => {
    global.readBody.mockResolvedValue({ newPassword: STRONG_PASSWORD })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.authentication.update).not.toHaveBeenCalled()
  })

  it('refuses a wrong current password', async () => {
    compare.mockResolvedValue(false)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(global.db.postgres.authentication.update).not.toHaveBeenCalled()
  })

  it('lets an admin reset any password without knowing the old one', async () => {
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.getRouterParam.mockReturnValue('someone-else')
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser({ id: 'someone-else' }))
    global.readBody.mockResolvedValue({ newPassword: STRONG_PASSWORD })

    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(compare).not.toHaveBeenCalled()
  })

  it('enforces password strength', async () => {
    global.readBody.mockResolvedValue({ currentPassword: 'old password', newPassword: 'short' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.user.findUnique).not.toHaveBeenCalled()
  })

  it('rejects a request with no new password', async () => {
    global.readBody.mockResolvedValue({ currentPassword: 'old password' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('answers 404 for an unknown account', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(null)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('answers 404 when the account has no authentication row', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser({ authentication: null }))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('requires authentication', async () => {
    global.getAuthUser.mockImplementation(() => {
      throw { statusCode: 401, statusMessage: 'Unauthorized' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(global.db.postgres.authentication.update).not.toHaveBeenCalled()
  })

  it('applies the rate limit before anything else', async () => {
    global.rateLimit.mockImplementation(() => {
      throw { statusCode: 429, statusMessage: 'Too many requests' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 429 })
    expect(global.getAuthUser).not.toHaveBeenCalled()
  })
})
