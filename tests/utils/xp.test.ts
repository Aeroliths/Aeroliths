import { describe, it, expect } from 'vitest'
import { computeXp, applyDailyCap, DAILY_XP_CAP } from '~~/server/utils/xp'

describe('computeXp', () => {
  it('pays a win more than a draw, and a draw more than a loss', () => {
    const base = { difficulty: 'easy', size: 3 } as const

    const win = computeXp({ ...base, result: 'win' })
    const draw = computeXp({ ...base, result: 'draw' })
    const loss = computeXp({ ...base, result: 'loss' })

    expect(win).toBeGreaterThan(draw)
    expect(draw).toBeGreaterThan(loss)
  })

  it('still pays something for a loss, so playing up is never punished', () => {
    expect(computeXp({ result: 'loss', difficulty: 'hard', size: 5 })).toBeGreaterThan(0)
  })

  it('scales with difficulty', () => {
    const easy = computeXp({ result: 'win', difficulty: 'easy', size: 3 })
    const hard = computeXp({ result: 'win', difficulty: 'hard', size: 3 })

    expect(hard).toBeGreaterThan(easy)
  })

  it('scales with board size', () => {
    const small = computeXp({ result: 'win', difficulty: 'easy', size: 3 })
    const large = computeXp({ result: 'win', difficulty: 'easy', size: 5 })

    expect(large).toBeGreaterThan(small)
  })

  it('returns whole numbers', () => {
    for (const size of [3, 4, 5] as const) {
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        for (const result of ['win', 'draw', 'loss'] as const) {
          expect(Number.isInteger(computeXp({ result, difficulty, size }))).toBe(true)
        }
      }
    }
  })
})

describe('applyDailyCap', () => {
  it('grants the full amount when the day is untouched', () => {
    expect(applyDailyCap(100, 0)).toBe(100)
  })

  it('grants only what is left of the cap', () => {
    expect(applyDailyCap(100, DAILY_XP_CAP - 30)).toBe(30)
  })

  it('grants nothing once the cap is reached', () => {
    expect(applyDailyCap(100, DAILY_XP_CAP)).toBe(0)
    expect(applyDailyCap(100, DAILY_XP_CAP + 500)).toBe(0)
  })

  it('never returns a negative grant', () => {
    expect(applyDailyCap(0, DAILY_XP_CAP + 1)).toBe(0)
  })
})
