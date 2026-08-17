import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/auth/forgot-password.post'

const event = {} as any

const storedUser = {
  id: 'user-1',
  email: 'player@example.com',
  username: 'player',
  locale: 'fr',
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.rateLimit.mockReturnValue(undefined)
    global.readBody.mockResolvedValue({ email: 'player@example.com' })
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser)
    global.db.postgres.user.update.mockResolvedValue({})
    global.sendPasswordResetEmail.mockResolvedValue(undefined)
  })

  it('sends a reset link to a known account', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.sendPasswordResetEmail).toHaveBeenCalledTimes(1)
  })

  it('answers identically for an unknown account', async () => {
    const known = await handler(event)

    vi.clearAllMocks()
    global.rateLimit.mockReturnValue(undefined)
    global.readBody.mockResolvedValue({ email: 'nobody@example.com' })
    global.db.postgres.user.findUnique.mockResolvedValue(null)
    const unknown = await handler(event)

    // Any difference here turns the endpoint into an account enumerator.
    expect(unknown).toEqual(known)
    expect(global.sendPasswordResetEmail).not.toHaveBeenCalled()
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('stores the token hashed, never in the clear', async () => {
    await handler(event)

    const [, rawToken] = global.sendPasswordResetEmail.mock.calls[0]!.slice(1)
    const stored = global.db.postgres.user.update.mock.calls[0]![0].data.resetToken

    expect(stored).not.toBe(rawToken)
    expect(stored).toBe(global.hashToken(rawToken))
  })

  it('gives the token an expiry in the near future', async () => {
    await handler(event)

    const { resetTokenExpiresAt } = global.db.postgres.user.update.mock.calls[0]![0].data
    const minutesAhead = (resetTokenExpiresAt.getTime() - Date.now()) / 60_000

    expect(minutesAhead).toBeGreaterThan(0)
    expect(minutesAhead).toBeLessThanOrEqual(60)
  })

  it('writes the email in the account language', async () => {
    await handler(event)

    expect(global.sendPasswordResetEmail).toHaveBeenCalledWith(
      storedUser.email,
      storedUser.username,
      expect.any(String),
      'fr',
    )
  })

  it('applies the rate limit before touching the database', async () => {
    global.rateLimit.mockImplementation(() => {
      throw { statusCode: 429, statusMessage: 'Too many requests' }
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 429 })
    expect(global.db.postgres.user.findUnique).not.toHaveBeenCalled()
  })

  it('rejects a request with no email', async () => {
    global.readBody.mockResolvedValue({})

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })
})
