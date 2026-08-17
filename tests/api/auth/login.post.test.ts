import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/auth/login.post'

vi.mock('bcrypt', () => ({
  default: { compare: vi.fn() },
}))

import bcrypt from 'bcrypt'

const event = {} as any
const compare = bcrypt.compare as unknown as ReturnType<typeof vi.fn>

function storedUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    email: 'player@example.com',
    username: 'player',
    profilePicture: null,
    emailVerified: true,
    lastActiveAt: new Date('2026-08-01'),
    deletionRequestedAt: null,
    createdAt: new Date('2026-01-01'),
    // Fields that must never reach the client.
    verificationToken: 'secret-verification-token',
    resetToken: 'secret-reset-token',
    authentication: { password: 'hashed', tokenVersion: 3 },
    role: { id: 'role-1', name: 'user' },
    ...overrides,
  }
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.rateLimit.mockReturnValue(undefined)
    global.verifyCaptcha.mockResolvedValue(undefined)
    global.issueAuthSession.mockResolvedValue(undefined)
    global.readBody.mockResolvedValue({
      email: 'player@example.com',
      password: 'correct horse',
      captchaToken: 'token',
    })
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser())
    compare.mockResolvedValue(true)
  })

  it('signs the user in and opens a session', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(result.data.user.id).toBe('user-1')
    expect(global.issueAuthSession).toHaveBeenCalledTimes(1)
  })

  it('passes the stored token version to the session', async () => {
    await handler(event)

    expect(global.issueAuthSession).toHaveBeenCalledWith(
      event,
      expect.objectContaining({ tokenVersion: 3 }),
    )
  })

  it('never returns the password or the internal tokens', async () => {
    const result = await handler(event)

    const serialized = JSON.stringify(result)
    expect(serialized).not.toContain('hashed')
    expect(serialized).not.toContain('secret-verification-token')
    expect(serialized).not.toContain('secret-reset-token')
    expect(result.data.user).not.toHaveProperty('authentication')
  })

  it('applies the rate limit before touching the database', async () => {
    global.rateLimit.mockImplementation(() => {
      throw { statusCode: 429, statusMessage: 'Too many requests' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 429 })
    expect(global.db.postgres.user.findUnique).not.toHaveBeenCalled()
  })

  it('verifies the captcha before touching the database', async () => {
    global.verifyCaptcha.mockRejectedValue({ statusCode: 400, statusMessage: 'Captcha failed' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.user.findUnique).not.toHaveBeenCalled()
  })

  it('rejects a request with no credentials', async () => {
    global.readBody.mockResolvedValue({ captchaToken: 'token' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('answers the same way for an unknown account and a wrong password', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(null)
    const unknownAccount = await handler(event).catch((error) => error)

    global.db.postgres.user.findUnique.mockResolvedValue(storedUser())
    compare.mockResolvedValue(false)
    const wrongPassword = await handler(event).catch((error) => error)

    // Distinguishable answers would let an attacker enumerate accounts.
    expect(unknownAccount.statusCode).toBe(401)
    expect(wrongPassword.statusCode).toBe(401)
    expect(unknownAccount.message).toBe(wrongPassword.message)
    expect(global.issueAuthSession).not.toHaveBeenCalled()
  })

  it('refuses an account whose email is not verified', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser({ emailVerified: false }))

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'EMAIL_NOT_VERIFIED',
    })
    expect(global.issueAuthSession).not.toHaveBeenCalled()
  })

  it('refuses an account with no authentication row', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser({ authentication: null }))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(global.issueAuthSession).not.toHaveBeenCalled()
  })
})
