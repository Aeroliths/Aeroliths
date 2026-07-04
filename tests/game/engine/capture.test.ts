import { describe, it, expect } from 'vitest'
import { createMatch, placeStone } from '~/app/game/engine/match'
import type { ElementGraph, MatchState, Stone } from '~/app/game/engine/types'

function stone(id: string, spikes: Partial<Stone> = {}): Stone {
  return {
    id,
    elementId: null,
    spikeUp: 0,
    spikeDown: 0,
    spikeLeft: 0,
    spikeRight: 0,
    ...spikes,
  }
}

/** Force a stone of `owner` onto the board for setup, without going through turns. */
function withStoneAt(state: MatchState, owner: 'A' | 'B', s: Stone, x: number, y: number): MatchState {
  const board = state.board.map((row) => row.slice())
  board[y]![x] = { owner, stone: s }
  return { ...state, board }
}

function ownerAt(state: MatchState, x: number, y: number) {
  return state.board[y]![x]?.owner
}

describe('capture by directional value', () => {
  it('captures an adjacent opponent stone when the facing value is higher', () => {
    // B's stone sits to the right of where A will play.
    let match = createMatch({ size: 3, hands: { A: [stone('a', { spikeRight: 5 })], B: [] } })
    match = withStoneAt(match, 'B', stone('b', { spikeLeft: 3 }), 1, 0)

    const next = placeStone(match, 0, 0, 0)

    expect(ownerAt(next, 1, 0)).toBe('A')
  })

  it('does not capture when the facing values are equal', () => {
    let match = createMatch({ size: 3, hands: { A: [stone('a', { spikeRight: 3 })], B: [] } })
    match = withStoneAt(match, 'B', stone('b', { spikeLeft: 3 }), 1, 0)

    const next = placeStone(match, 0, 0, 0)

    expect(ownerAt(next, 1, 0)).toBe('B')
  })

  it('does not capture when the facing value is lower', () => {
    let match = createMatch({ size: 3, hands: { A: [stone('a', { spikeRight: 2 })], B: [] } })
    match = withStoneAt(match, 'B', stone('b', { spikeLeft: 4 }), 1, 0)

    const next = placeStone(match, 0, 0, 0)

    expect(ownerAt(next, 1, 0)).toBe('B')
  })

  it('never flips the current player’s own adjacent stones', () => {
    let match = createMatch({ size: 3, hands: { A: [stone('a', { spikeRight: 9 })], B: [] } })
    match = withStoneAt(match, 'A', stone('ally', { spikeLeft: 1 }), 1, 0)

    const next = placeStone(match, 0, 0, 0)

    expect(ownerAt(next, 1, 0)).toBe('A')
  })

  it('captures on multiple sides at once', () => {
    // A plays in the centre with high values; opponents sit on right and below.
    let match = createMatch({
      size: 3,
      hands: { A: [stone('a', { spikeRight: 5, spikeDown: 5 })], B: [] },
    })
    match = withStoneAt(match, 'B', stone('right', { spikeLeft: 1 }), 2, 1)
    match = withStoneAt(match, 'B', stone('down', { spikeUp: 1 }), 1, 2)

    const next = placeStone(match, 0, 1, 1)

    expect(ownerAt(next, 2, 1)).toBe('A')
    expect(ownerAt(next, 1, 2)).toBe('A')
  })

  it('does not chain: a freshly captured stone cannot capture further stones', () => {
    // A captures the middle stone; the middle stone would beat the far stone,
    // but captures must not cascade.
    let match = createMatch({ size: 3, hands: { A: [stone('a', { spikeRight: 5 })], B: [] } })
    match = withStoneAt(match, 'B', stone('mid', { spikeLeft: 1, spikeRight: 9 }), 1, 0)
    match = withStoneAt(match, 'B', stone('far', { spikeLeft: 1 }), 2, 0)

    const next = placeStone(match, 0, 0, 0)

    expect(ownerAt(next, 1, 0)).toBe('A')
    expect(ownerAt(next, 2, 0)).toBe('B')
  })
})

describe('capture with element bonus', () => {
  // fire beats water: fire is strong against water.
  const elements: ElementGraph = { strongAgainst: { fire: ['water'], water: [] } }

  it('turns a tie into a capture when the attacker has the elemental advantage', () => {
    let match = createMatch({
      size: 3,
      elements,
      hands: { A: [stone('a', { spikeRight: 3, elementId: 'fire' })], B: [] },
    })
    match = withStoneAt(match, 'B', stone('b', { spikeLeft: 3, elementId: 'water' }), 1, 0)

    const next = placeStone(match, 0, 0, 0)

    expect(ownerAt(next, 1, 0)).toBe('A')
  })

  it('turns a win into a loss when the attacker has the elemental disadvantage', () => {
    let match = createMatch({
      size: 3,
      elements,
      hands: { A: [stone('a', { spikeRight: 4, elementId: 'water' })], B: [] },
    })
    match = withStoneAt(match, 'B', stone('b', { spikeLeft: 3, elementId: 'fire' }), 1, 0)

    // 4 - 1 (water is weak vs fire) = 3, not greater than 3 -> no capture.
    const next = placeStone(match, 0, 0, 0)

    expect(ownerAt(next, 1, 0)).toBe('B')
  })
})
