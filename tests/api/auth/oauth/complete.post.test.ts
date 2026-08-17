import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/auth/oauth/complete.post'

const event = {} as any

const pendingSession = {
  provider: 'discord',
  providerAccountId: 'discord-42',
  email: 'player@example.com',
  displayName: 'Player',
  avatarUrl: 'https://cdn.example.com/avatar.png',
}

function accountRow() {
  return {
    id: 'user-1',
    email: 'player@example.com',
    username: 'player',
    profilePicture: null,
    emailVerified: true,
    lastActiveAt: new Date('2026-08-01'),
    deletionRequestedAt: null,
    createdAt: new Date('2026-01-01'),
    role: { id: 'role-1', name: 'user' },
  }
}

describe('POST /api/auth/oauth/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.rateLimit.mockReturnValue(undefined)
    global.readOAuthPending.mockReturnValue(pendingSession)
    global.readBody.mockResolvedValue({ username: 'player' })
    global.issueAuthSession.mockResolvedValue(undefined)
    global.db.postgres.oAuthAccount.findUnique.mockResolvedValue(null)
    global.db.postgres.oAuthAccount.create.mockResolvedValue({})
    global.db.postgres.user.findUnique.mockResolvedValue(null)
    global.db.postgres.role.findUnique.mockResolvedValue({ id: 'role-1', name: 'user' })
    global.db.postgres.user.create.mockResolvedValue({
      ...accountRow(),
      role: { id: 'role-1', name: 'user' },
    })
    global.db.postgres.lithos.count.mockResolvedValue(0)
  })

  it('creates the account and opens a session', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.user.create).toHaveBeenCalledTimes(1)
    expect(global.issueAuthSession).toHaveBeenCalledTimes(1)
    expect(global.clearOAuthPending).toHaveBeenCalledTimes(1)
  })

  it('trusts the provider and marks the email verified', async () => {
    await handler(event)

    const { data } = global.db.postgres.user.create.mock.calls[0]![0]
    expect(data.emailVerified).toBe(true)
    expect(data.email).toBe(pendingSession.email)
  })

  it('links the provider without creating a second account when the identity is known', async () => {
    global.db.postgres.oAuthAccount.findUnique.mockResolvedValue({
      user: { ...accountRow(), authentication: { tokenVersion: 2 } },
    })

    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.user.create).not.toHaveBeenCalled()
    expect(global.issueAuthSession).toHaveBeenCalledWith(
      event,
      expect.objectContaining({ tokenVersion: 2 }),
    )
  })

  it('links the provider to an account registered in the meantime', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue({
      ...accountRow(),
      authentication: { tokenVersion: 1 },
    })

    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.oAuthAccount.create).toHaveBeenCalledTimes(1)
    expect(global.db.postgres.user.create).not.toHaveBeenCalled()
  })

  it('refuses a username already taken', async () => {
    // No account for the email, but the chosen username belongs to someone.
    global.db.postgres.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'someone-else' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 409 })
    expect(global.db.postgres.user.create).not.toHaveBeenCalled()
  })

  it('refuses a request with no pending sign-in', async () => {
    global.readOAuthPending.mockReturnValue(null)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.user.create).not.toHaveBeenCalled()
  })

  it('enforces the username format', async () => {
    for (const username of ['ab', 'a'.repeat(31), 'has space', 'has/slash', '']) {
      vi.clearAllMocks()
      global.rateLimit.mockReturnValue(undefined)
      global.readOAuthPending.mockReturnValue(pendingSession)
      global.readBody.mockResolvedValue({ username })

      await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
      expect(global.db.postgres.user.create).not.toHaveBeenCalled()
    }
  })

  it('applies the rate limit before reading the pending session', async () => {
    global.rateLimit.mockImplementation(() => {
      throw { statusCode: 429, statusMessage: 'Too many requests' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 429 })
    expect(global.readOAuthPending).not.toHaveBeenCalled()
  })
})
