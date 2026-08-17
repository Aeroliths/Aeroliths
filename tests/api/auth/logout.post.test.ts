import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/auth/logout.post'

const event = {} as any

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clears the auth cookie', async () => {
    const result = await handler(event)

    expect(result).toEqual({ success: true })
    expect(global.deleteCookie).toHaveBeenCalledWith(event, 'auth_token', expect.any(Object))
  })

  it('clears it with the same attributes it was set with', async () => {
    // A cookie deleted on a different path or without httpOnly is not deleted
    // at all: the browser keeps the original and the session survives.
    await handler(event)

    const [, , options] = global.deleteCookie.mock.calls[0]!
    expect(options).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' })
  })

  it('needs neither a session nor the database', async () => {
    // Logging out must work for an expired or forged token too, otherwise a
    // user holding a bad cookie can never get rid of it.
    handler(event)

    expect(global.getAuthUser).not.toHaveBeenCalled()
    expect(global.db.postgres.user.findUnique).not.toHaveBeenCalled()
  })
})
