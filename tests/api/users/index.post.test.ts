import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/users/index.post'

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn(async () => 'hashed-password') },
}))

const event = {} as any

const VALID = {
  email: 'player@example.com',
  username: 'player',
  password: 'Str0ng-Passw0rd!',
  captchaToken: 'token',
}

function createdUser() {
  return {
    id: 'user-1',
    email: VALID.email,
    username: VALID.username,
    locale: 'en',
    emailVerified: false,
    verificationToken: 'stored-hash',
    createdAt: new Date('2026-08-01'),
    role: { id: 'role-1', name: 'user' },
  }
}

describe('POST /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.rateLimit.mockReturnValue(undefined)
    global.verifyCaptcha.mockResolvedValue(undefined)
    global.validateEmailTrust.mockResolvedValue(null)
    global.resolveRequestLocale.mockReturnValue('en')
    global.readBody.mockResolvedValue({ ...VALID })
    global.db.postgres.role.findUnique.mockResolvedValue({ id: 'role-1', name: 'user' })
    global.db.postgres.user.findFirst.mockResolvedValue(null)
    global.db.postgres.user.create.mockResolvedValue(createdUser())
    global.db.postgres.lithos.count.mockResolvedValue(0)
    global.sendVerificationEmail.mockResolvedValue(undefined)
  })

  it('creates the account', async () => {
    const result = await handler(event)

    expect(result.success).toBe(true)
    expect(global.db.postgres.user.create).toHaveBeenCalledTimes(1)
  })

  it('creates it unverified', async () => {
    await handler(event)

    const { data } = global.db.postgres.user.create.mock.calls[0]![0]
    expect(data.emailVerified).toBe(false)
  })

  it('stores the password hashed and never returns it', async () => {
    const result = await handler(event)

    const { data } = global.db.postgres.user.create.mock.calls[0]![0]
    expect(data.authentication.create.password).toBe('hashed-password')
    expect(JSON.stringify(result)).not.toContain(VALID.password)
    expect(result.data).not.toHaveProperty('authentication')
  })

  it('stores the verification token hashed and emails only the raw one', async () => {
    await handler(event)

    const { data } = global.db.postgres.user.create.mock.calls[0]![0]
    const [, rawToken] = global.sendVerificationEmail.mock.calls[0]!

    expect(data.verificationToken).toBe(global.hashToken(rawToken))
    expect(data.verificationToken).not.toBe(rawToken)
  })

  it('never returns the verification token', async () => {
    const result = await handler(event)

    expect(result.data).not.toHaveProperty('verificationToken')
  })

  it('drops the starter lithos into the new collection', async () => {
    // The real helper runs here, against the mocked database.
    global.db.postgres.user.findUnique.mockResolvedValue({ starterPoolGrantedAt: null })
    global.db.postgres.lithos.findMany.mockResolvedValue([
      { id: 'lithos-1', starterQuantity: 2 },
    ])
    global.db.postgres.user.updateMany.mockResolvedValue({ count: 1 })
    global.db.postgres.collections.upsert.mockResolvedValue({})

    await handler(event)

    expect(global.db.postgres.collections.upsert).toHaveBeenCalledTimes(1)
  })

  it('still registers the account when the starter pool cannot be granted', async () => {
    global.db.postgres.user.findUnique.mockRejectedValue(new Error('database hiccup'))

    const result = await handler(event)

    // The marker stays null, so the admin backfill picks the player up later.
    expect(result.success).toBe(true)
  })

  it('still registers the account when the email cannot be sent', async () => {
    global.sendVerificationEmail.mockRejectedValue(new Error('smtp down'))

    const result = await handler(event)

    expect(result.success).toBe(true)
  })

  it('applies the rate limit and the captcha before touching the database', async () => {
    global.rateLimit.mockImplementation(() => {
      throw { statusCode: 429, statusMessage: 'Too many requests' }
    })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 429 })

    vi.clearAllMocks()
    global.rateLimit.mockReturnValue(undefined)
    global.readBody.mockResolvedValue({ ...VALID })
    global.verifyCaptcha.mockRejectedValue({ statusCode: 400, statusMessage: 'Captcha failed' })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })

    expect(global.db.postgres.user.create).not.toHaveBeenCalled()
  })

  it('rejects a malformed email', async () => {
    global.readBody.mockResolvedValue({ ...VALID, email: 'not-an-email' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.user.create).not.toHaveBeenCalled()
  })

  it('rejects a disposable email', async () => {
    global.validateEmailTrust.mockResolvedValue('Disposable email addresses are not allowed')

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.user.create).not.toHaveBeenCalled()
  })

  it('rejects a malformed username', async () => {
    for (const username of ['ab', 'a'.repeat(31), 'has space', 'has/slash']) {
      global.readBody.mockResolvedValue({ ...VALID, username })

      await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    }
    expect(global.db.postgres.user.create).not.toHaveBeenCalled()
  })

  it('rejects a weak password', async () => {
    global.readBody.mockResolvedValue({ ...VALID, password: 'short' })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    expect(global.db.postgres.user.create).not.toHaveBeenCalled()
  })

  it('rejects an email already registered', async () => {
    global.db.postgres.user.findFirst.mockResolvedValue({
      email: VALID.email,
      username: 'someone-else',
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 409 })
    expect(global.db.postgres.user.create).not.toHaveBeenCalled()
  })

  it('rejects a username already taken', async () => {
    global.db.postgres.user.findFirst.mockResolvedValue({
      email: 'someone@else.com',
      username: VALID.username,
    })

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 409 })
    expect(global.db.postgres.user.create).not.toHaveBeenCalled()
  })

  it('records the locale the visitor is browsing in', async () => {
    global.resolveRequestLocale.mockReturnValue('fr')

    await handler(event)

    const { data } = global.db.postgres.user.create.mock.calls[0]![0]
    expect(data.locale).toBe('fr')
    expect(global.sendVerificationEmail).toHaveBeenCalledWith(
      VALID.email,
      expect.any(String),
      'fr',
    )
  })
})
