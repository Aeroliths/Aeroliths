import { describe, it, expect } from 'vitest'
import { winRate, rankByXp } from '~~/server/utils/leaderboard'

describe('winRate', () => {
  it('is the share of played matches that were won', () => {
    expect(winRate({ userId: 'u', wins: 3, losses: 1, draws: 0 })).toBe(75)
  })

  it('counts draws as played', () => {
    expect(winRate({ userId: 'u', wins: 1, losses: 0, draws: 1 })).toBe(50)
  })

  it('is zero rather than a division by zero for a player who never played', () => {
    expect(winRate({ userId: 'u', wins: 0, losses: 0, draws: 0 })).toBe(0)
  })

  it('is a whole percentage', () => {
    expect(Number.isInteger(winRate({ userId: 'u', wins: 1, losses: 2, draws: 0 }))).toBe(true)
  })
})

describe('rankByXp', () => {
  it('puts the highest xp first', () => {
    const ranked = rankByXp([
      { xp: 10, username: 'low' },
      { xp: 90, username: 'high' },
    ])

    expect(ranked.map((p) => p.username)).toEqual(['high', 'low'])
  })

  it('breaks a tie on the username, so the order never wobbles', () => {
    const ranked = rankByXp([
      { xp: 50, username: 'zoe' },
      { xp: 50, username: 'adam' },
    ])

    expect(ranked.map((p) => p.username)).toEqual(['adam', 'zoe'])
  })

  it('leaves the input alone', () => {
    const players = [
      { xp: 1, username: 'a' },
      { xp: 2, username: 'b' },
    ]
    rankByXp(players)

    expect(players.map((p) => p.username)).toEqual(['a', 'b'])
  })
})
