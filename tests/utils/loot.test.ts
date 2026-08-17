import { describe, it, expect } from 'vitest'
import { drawLoot } from '~~/server/utils/loot'

/** Deterministic generator cycling through the given values. */
function sequence(values: number[]) {
  let index = 0
  return () => values[index++ % values.length]!
}

describe('drawLoot', () => {
  it('returns null on an empty table', () => {
    expect(drawLoot([])).toBeNull()
  })

  it('always returns the only entry', () => {
    expect(drawLoot([{ lithosId: 'a', weight: 1 }], sequence([0, 0.5, 0.999]))).toBe('a')
  })

  it('splits the range in proportion to the weights', () => {
    const entries = [
      { lithosId: 'common', weight: 3 },
      { lithosId: 'rare', weight: 1 },
    ]

    // Total weight 4: anything below 0.75 falls in the first bucket.
    expect(drawLoot(entries, () => 0)).toBe('common')
    expect(drawLoot(entries, () => 0.74)).toBe('common')
    expect(drawLoot(entries, () => 0.76)).toBe('rare')
  })

  it('can still hand out a heavily outweighed entry', () => {
    const entries = [
      { lithosId: 'common', weight: 99 },
      { lithosId: 'legendary', weight: 1 },
    ]

    expect(drawLoot(entries, () => 0.999)).toBe('legendary')
  })

  it('ignores entries with no weight', () => {
    const entries = [
      { lithosId: 'disabled', weight: 0 },
      { lithosId: 'active', weight: 5 },
    ]

    expect(drawLoot(entries, () => 0)).toBe('active')
    expect(drawLoot(entries, () => 0.999)).toBe('active')
  })

  it('returns null when every weight is zero', () => {
    expect(drawLoot([{ lithosId: 'a', weight: 0 }])).toBeNull()
  })

  it('never falls through the end of the table', () => {
    // A generator returning exactly 1 would overshoot a naive accumulation.
    expect(
      drawLoot([{ lithosId: 'a', weight: 1 }, { lithosId: 'b', weight: 1 }], () => 1),
    ).toBe('b')
  })

  it('honours the weights over many draws', () => {
    const entries = [
      { lithosId: 'common', weight: 9 },
      { lithosId: 'rare', weight: 1 },
    ]
    let common = 0
    for (let i = 0; i < 1000; i++) {
      if (drawLoot(entries, () => i / 1000) === 'common') common++
    }

    expect(common).toBeGreaterThan(850)
    expect(common).toBeLessThan(950)
  })
})
