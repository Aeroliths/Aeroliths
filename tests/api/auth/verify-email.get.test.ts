import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/auth/verify-email.get'

const event = {} as any
const RAW_TOKEN = 'a-valid-raw-token'

function storedUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    email: 'player@example.com',
    emailVerified: false,
    verificationToken: global.hashToken(RAW_TOKEN),
    verificationTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    ...overrides,
  }
}

describe('GET /api/auth/verify-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getQuery.mockReturnValue({ token: RAW_TOKEN, email: 'player@example.com' })
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser())
    global.db.postgres.user.update.mockResolvedValue({})
  })

  it('verifies the account and consumes the token', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    const { data } = global.db.postgres.user.update.mock.calls[0]![0]
    expect(data).toMatchObject({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    })
  })

  it('refuses a token that does not match the stored hash', async () => {
    global.getQuery.mockReturnValue({ token: 'wrong-token', email: 'player@example.com' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('refuses an expired token', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(
      storedUser({ verificationTokenExpiresAt: new Date(Date.now() - 1000) }),
    )

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('is idempotent on an account already verified', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser({ emailVerified: true }))

    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('refuses an unknown account', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(null)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects a request missing the token or the email', async () => {
    global.getQuery.mockReturnValue({ email: 'player@example.com' })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })

    global.getQuery.mockReturnValue({ token: RAW_TOKEN })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })
})
