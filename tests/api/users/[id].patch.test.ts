import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/users/[id].patch'
import { createTestAdmin, createTestUser } from '../../utils/auth'

const event = {} as any

function storedUser(overrides: Record<string, any> = {}) {
  return {
    id: 'test-user-id',
    email: 'user@test.com',
    username: 'user',
    locale: 'en',
    profilePicture: null,
    role: { id: 'role-1', name: 'user' },
    ...overrides,
  }
}

/**
 * A database that hands back every column, secrets included. The handler must
 * narrow what it asks for; this stub proves it does not simply forward the row.
 */
function updatedRow(overrides: Record<string, any> = {}) {
  return {
    ...storedUser(),
    emailVerified: true,
    verificationToken: 'secret-verification-token',
    verificationTokenExpiresAt: new Date('2026-09-01'),
    resetToken: 'secret-reset-token',
    resetTokenExpiresAt: new Date('2026-09-01'),
    ...overrides,
  }
}

describe('PATCH /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestUser())
    global.getRouterParam.mockReturnValue('test-user-id')
    global.readBody.mockResolvedValue({ username: 'newname' })
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser())
    global.db.postgres.user.findFirst.mockResolvedValue(null)
    global.db.postgres.user.update.mockResolvedValue(updatedRow())
  })

  it('updates the caller own profile', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    const { data } = global.db.postgres.user.update.mock.calls[0]![0]
    expect(data.username).toBe('newname')
  })

  it('never asks the database for the verification or reset tokens', async () => {
    await handler(event)

    // Asserted on the query rather than the response: a mocked Prisma returns
    // whatever the stub says regardless of the projection, so only the query
    // can show that the handler narrows what it reads. Returning the whole row
    // would hand an admin editing a member that member's live reset token.
    const query = global.db.postgres.user.update.mock.calls[0]![0]

    expect(query.include).toBeUndefined()
    expect(query.select).toBeDefined()
    expect(Object.keys(query.select)).not.toContain('verificationToken')
    expect(Object.keys(query.select)).not.toContain('resetToken')
    expect(Object.keys(query.select)).toContain('username')
  })

  it('refuses to update another profile', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser({ id: 'someone-else' }))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('lets an admin update any profile', async () => {
    global.getAuthUser.mockReturnValue(createTestAdmin())
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser({ id: 'someone-else' }))

    const result = await handler(event)

    expect(result.success).toBe(true)
  })

  it('rejects a malformed email', async () => {
    global.readBody.mockResolvedValue({ email: 'not-an-email' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('rejects an email already used by someone else', async () => {
    global.readBody.mockResolvedValue({ email: 'taken@test.com' })
    global.db.postgres.user.findFirst.mockResolvedValue({ id: 'someone-else' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('rejects a malformed username', async () => {
    for (const username of ['ab', 'a'.repeat(31), 'has space']) {
      global.readBody.mockResolvedValue({ username })

      await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    }
  })

  it('rejects a username already taken', async () => {
    global.db.postgres.user.findFirst.mockResolvedValue({ id: 'someone-else' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('normalises an unknown locale to english', async () => {
    global.readBody.mockResolvedValue({ locale: 'klingon' })

    await handler(event)

    const { data } = global.db.postgres.user.update.mock.calls[0]![0]
    expect(data.locale).toBe('en')
  })

  it('rejects a request with nothing to update', async () => {
    global.readBody.mockResolvedValue({})

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('answers 404 for an unknown account', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(null)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('requires authentication', async () => {
    global.getAuthUser.mockImplementation(() => {
      throw { statusCode: 401, statusMessage: 'Unauthorized' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
  })
})
