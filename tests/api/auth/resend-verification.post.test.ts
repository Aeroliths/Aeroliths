import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/auth/resend-verification.post'

const event = {} as any
const DAY_MS = 24 * 60 * 60 * 1000

function storedUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    email: 'player@example.com',
    emailVerified: false,
    locale: 'fr',
    // Issued two hours ago, so a new request is allowed.
    verificationTokenExpiresAt: new Date(Date.now() + DAY_MS - 2 * 60 * 60 * 1000),
    ...overrides,
  }
}

describe('POST /api/auth/resend-verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.readBody.mockResolvedValue({ email: 'player@example.com' })
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser())
    global.db.postgres.user.update.mockResolvedValue({})
    global.sendVerificationEmail.mockResolvedValue(undefined)
  })

  it('sends a fresh link to an unverified account', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.sendVerificationEmail).toHaveBeenCalledTimes(1)
  })

  it('stores the token hashed, never in the clear', async () => {
    await handler(event)

    const [, rawToken] = global.sendVerificationEmail.mock.calls[0]!
    const stored = global.db.postgres.user.update.mock.calls[0]![0].data.verificationToken

    expect(stored).not.toBe(rawToken)
    expect(stored).toBe(global.hashToken(rawToken))
  })

  it('answers identically for an unknown account', async () => {
    const known = await handler(event)

    vi.clearAllMocks()
    global.readBody.mockResolvedValue({ email: 'nobody@example.com' })
    global.db.postgres.user.findUnique.mockResolvedValue(null)
    const unknown = await handler(event)

    expect(unknown).toEqual(known)
    expect(global.sendVerificationEmail).not.toHaveBeenCalled()
  })

  it('answers identically for an account already verified', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser({ emailVerified: true }))

    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.sendVerificationEmail).not.toHaveBeenCalled()
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('throttles a second request made right after the first', async () => {
    // Token issued seconds ago: its expiry is still almost a full day away.
    global.db.postgres.user.findUnique.mockResolvedValue(
      storedUser({ verificationTokenExpiresAt: new Date(Date.now() + DAY_MS - 5_000) }),
    )

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 429 })
    expect(global.sendVerificationEmail).not.toHaveBeenCalled()
  })

  it('writes the email in the account language', async () => {
    await handler(event)

    expect(global.sendVerificationEmail).toHaveBeenCalledWith(
      'player@example.com',
      expect.any(String),
      'fr',
    )
  })

  it('reports a failure to send instead of pretending it worked', async () => {
    global.sendVerificationEmail.mockRejectedValue(new Error('smtp down'))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('rejects a request with no email', async () => {
    global.readBody.mockResolvedValue({})

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })
})
