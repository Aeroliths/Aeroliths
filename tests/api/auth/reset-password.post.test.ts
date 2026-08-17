import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/auth/reset-password.post'

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn(async () => 'new-hash') },
}))

const event = {} as any
const RAW_TOKEN = 'a-valid-raw-token'
const STRONG_PASSWORD = 'Str0ng-Passw0rd!'

function storedUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    email: 'player@example.com',
    resetToken: global.hashToken(RAW_TOKEN),
    resetTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    authentication: { password: 'old-hash', tokenVersion: 4 },
    ...overrides,
  }
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.rateLimit.mockReturnValue(undefined)
    global.readBody.mockResolvedValue({
      token: RAW_TOKEN,
      email: 'player@example.com',
      password: STRONG_PASSWORD,
    })
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser())
    global.db.postgres.user.update.mockResolvedValue({})
    global.db.postgres.authentication.update.mockResolvedValue({})
  })

  it('resets the password when the token matches', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.authentication.update).toHaveBeenCalledTimes(1)
  })

  it('invalidates every existing session', async () => {
    await handler(event)

    // Without the token version bump, sessions opened before the reset keep
    // working, which is the whole point of resetting a password.
    const { data } = global.db.postgres.authentication.update.mock.calls[0]![0]
    expect(data.tokenVersion).toEqual({ increment: 1 })
  })

  it('stores the new password hashed', async () => {
    await handler(event)

    const { data } = global.db.postgres.authentication.update.mock.calls[0]![0]
    expect(data.password).toBe('new-hash')
    expect(data.password).not.toBe(STRONG_PASSWORD)
  })

  it('consumes the token so it cannot be replayed', async () => {
    await handler(event)

    const { data } = global.db.postgres.user.update.mock.calls[0]![0]
    expect(data).toMatchObject({ resetToken: null, resetTokenExpiresAt: null })
  })

  it('refuses a token that does not match the stored hash', async () => {
    global.readBody.mockResolvedValue({
      token: 'not-the-right-token',
      email: 'player@example.com',
      password: STRONG_PASSWORD,
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.authentication.update).not.toHaveBeenCalled()
  })

  it('refuses an expired token and clears it', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(
      storedUser({ resetTokenExpiresAt: new Date(Date.now() - 1000) }),
    )

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.authentication.update).not.toHaveBeenCalled()
    expect(global.db.postgres.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { resetToken: null, resetTokenExpiresAt: null } }),
    )
  })

  it('refuses an account with no reset pending', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(
      storedUser({ resetToken: null, resetTokenExpiresAt: null }),
    )

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.authentication.update).not.toHaveBeenCalled()
  })

  it('refuses an unknown account', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(null)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('enforces password strength', async () => {
    global.readBody.mockResolvedValue({
      token: RAW_TOKEN,
      email: 'player@example.com',
      password: 'short',
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.user.findUnique).not.toHaveBeenCalled()
  })

  it('rejects a request missing a field', async () => {
    global.readBody.mockResolvedValue({ email: 'player@example.com' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('applies the rate limit before touching the database', async () => {
    global.rateLimit.mockImplementation(() => {
      throw { statusCode: 429, statusMessage: 'Too many requests' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 429 })
    expect(global.db.postgres.user.findUnique).not.toHaveBeenCalled()
  })
})
