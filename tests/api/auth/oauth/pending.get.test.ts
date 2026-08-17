import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '~~/server/api/auth/oauth/pending.get'

const event = {} as any

describe('GET /api/auth/oauth/pending', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports no session in progress', () => {
    global.readOAuthPending.mockReturnValue(null)

    expect(handler(event)).toEqual({ pending: false })
  })

  it('never leaks anything beyond the discriminant when idle', () => {
    global.readOAuthPending.mockReturnValue(null)

    expect(Object.keys(handler(event) as object)).toEqual(['pending'])
  })

  it('describes a session in progress', () => {
    global.readOAuthPending.mockReturnValue({
      provider: 'discord',
      providerAccountId: 'discord-42',
      email: 'Player@Example.com',
      displayName: 'Player Name',
    })

    expect(handler(event)).toMatchObject({
      pending: true,
      provider: 'discord',
      email: 'Player@Example.com',
    })
  })

  it('suggests a username derived from the display name', () => {
    global.readOAuthPending.mockReturnValue({
      provider: 'discord',
      providerAccountId: 'discord-42',
      email: 'player@example.com',
      displayName: 'Player Name!',
    })

    const result = handler(event) as any

    expect(result.suggestedUsername).toMatch(/^[a-z0-9_-]+$/)
  })

  it('falls back to the email local part when there is no display name', () => {
    global.readOAuthPending.mockReturnValue({
      provider: 'discord',
      providerAccountId: 'discord-42',
      email: 'someplayer@example.com',
      displayName: '',
    })

    expect((handler(event) as any).suggestedUsername).toBe('someplayer')
  })

  it('suggests nothing rather than something too short to accept', () => {
    global.readOAuthPending.mockReturnValue({
      provider: 'discord',
      providerAccountId: 'discord-42',
      email: 'ab@example.com',
      displayName: 'x!',
    })

    // The completion endpoint rejects anything under three characters, so a
    // shorter suggestion would prefill a field that cannot be submitted.
    expect((handler(event) as any).suggestedUsername).toBe('')
  })

  it('never exposes the provider account id', () => {
    global.readOAuthPending.mockReturnValue({
      provider: 'discord',
      providerAccountId: 'discord-42',
      email: 'player@example.com',
      displayName: 'Player',
    })

    expect(JSON.stringify(handler(event))).not.toContain('discord-42')
  })
})
