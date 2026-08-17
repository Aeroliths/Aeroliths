import { describe, it, expect } from 'vitest'
import { levelForXp, levelsCrossed, validateCurve } from '~~/server/utils/progression'

const curve = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 250 },
  { level: 4, xpRequired: 500 },
]

describe('levelForXp', () => {
  it('starts a fresh account at level one', () => {
    expect(levelForXp(0, curve)).toBe(1)
  })

  it('stays on a level until the next threshold is reached', () => {
    expect(levelForXp(99, curve)).toBe(1)
    expect(levelForXp(100, curve)).toBe(2)
    expect(levelForXp(249, curve)).toBe(2)
  })

  it('caps at the highest level the curve defines', () => {
    expect(levelForXp(999_999, curve)).toBe(4)
  })

  it('falls back to level one on an empty curve', () => {
    expect(levelForXp(5_000, [])).toBe(1)
  })

  it('does not care about the row order', () => {
    const shuffled = [curve[3]!, curve[0]!, curve[2]!, curve[1]!]
    expect(levelForXp(250, shuffled)).toBe(3)
  })
})

describe('levelsCrossed', () => {
  it('lists every level gained, not just the last', () => {
    expect(levelsCrossed(1, 4)).toEqual([2, 3, 4])
  })

  it('lists nothing when the level did not move', () => {
    expect(levelsCrossed(3, 3)).toEqual([])
  })

  it('lists nothing when the level would go down', () => {
    // A harsher curve must never demote, and never claw rewards back.
    expect(levelsCrossed(5, 2)).toEqual([])
  })
})

describe('validateCurve', () => {
  it('accepts a well formed curve', () => {
    expect(validateCurve(curve)).toBeNull()
  })

  it('rejects a curve that does not start at level one', () => {
    expect(validateCurve([{ level: 2, xpRequired: 0 }])).toMatch(/level 1/i)
  })

  it('rejects a gap in the levels', () => {
    expect(
      validateCurve([
        { level: 1, xpRequired: 0 },
        { level: 3, xpRequired: 100 },
      ]),
    ).toMatch(/gap|consecutive/i)
  })

  it('rejects a duplicated level', () => {
    expect(
      validateCurve([
        { level: 1, xpRequired: 0 },
        { level: 1, xpRequired: 100 },
      ]),
    ).toMatch(/duplicate/i)
  })

  it('rejects thresholds that do not strictly increase', () => {
    expect(
      validateCurve([
        { level: 1, xpRequired: 0 },
        { level: 2, xpRequired: 100 },
        { level: 3, xpRequired: 100 },
      ]),
    ).toMatch(/increase/i)
  })

  it('rejects a first threshold above zero', () => {
    expect(validateCurve([{ level: 1, xpRequired: 50 }])).toMatch(/zero/i)
  })

  it('rejects a negative threshold', () => {
    expect(
      validateCurve([
        { level: 1, xpRequired: 0 },
        { level: 2, xpRequired: -10 },
      ]),
    ).toMatch(/negative|increase/i)
  })

  it('accepts an empty curve, which simply disables levelling', () => {
    expect(validateCurve([])).toBeNull()
  })
})
