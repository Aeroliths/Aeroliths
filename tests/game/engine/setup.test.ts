import { describe, it, expect } from 'vitest'
import { generateBoardElements, randomHand, buildDraftPool } from '../../../app/game/engine/setup'
import type { Stone } from '../../../app/game/engine/types'

function stone(id: string): Stone {
  return { id, elementId: null, spikeUp: 1, spikeDown: 1, spikeLeft: 1, spikeRight: 1 }
}

// Deterministic RNG: cycles through the given values.
function seqRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]!
}

describe('generateBoardElements', () => {
  it('places exactly `count` distinct elemental cells', () => {
    const grid = generateBoardElements(3, ['fire', 'water'], 3, seqRng([0]))
    const filled = grid.flat().filter((c) => c !== null)
    expect(filled).toHaveLength(3)
    expect(grid.flat().every((c) => c === null || c === 'fire' || c === 'water')).toBe(true)
  })

  it('returns an all-null grid when no element ids', () => {
    const grid = generateBoardElements(3, [], 4)
    expect(grid.flat().every((c) => c === null)).toBe(true)
    expect(grid).toHaveLength(3)
    expect(grid[0]).toHaveLength(3)
  })

  it('clamps count to the number of cells', () => {
    const grid = generateBoardElements(2, ['fire'], 99)
    expect(grid.flat().filter((c) => c !== null)).toHaveLength(4)
  })
})

describe('randomHand', () => {
  it('returns `size` stones from the catalog', () => {
    const catalog = [stone('a'), stone('b'), stone('c')]
    const hand = randomHand(catalog, 2, seqRng([0]))
    expect(hand).toHaveLength(2)
    expect(catalog).toContain(hand[0])
  })

  it('repeats when the catalog is smaller than the requested size', () => {
    const catalog = [stone('only')]
    const hand = randomHand(catalog, 3, seqRng([0]))
    expect(hand).toHaveLength(3)
    expect(hand.every((s) => s.id === 'only')).toBe(true)
  })
})

describe('buildDraftPool', () => {
  it('returns `total` distinct stones when the catalog is large enough', () => {
    const catalog = [stone('a'), stone('b'), stone('c'), stone('d')]
    const pool = buildDraftPool(catalog, 3, seqRng([0]))
    expect(pool).toHaveLength(3)
    expect(new Set(pool.map((s) => s.id)).size).toBe(3)
  })

  it('falls back to repetition when the catalog is too small', () => {
    const catalog = [stone('a'), stone('b')]
    const pool = buildDraftPool(catalog, 3, seqRng([0]))
    expect(pool).toHaveLength(3)
  })
})
