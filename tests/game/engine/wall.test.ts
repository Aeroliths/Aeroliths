import { describe, it, expect } from 'vitest'
import { createMatch, placeStone } from '~/game/engine/match'
import type { CaptureRules, MatchState, Stone } from '~/game/engine/types'

function stone(id: string, spikes: Partial<Stone> = {}): Stone {
  return { id, elementId: null, spikeUp: 0, spikeDown: 0, spikeLeft: 0, spikeRight: 0, ...spikes }
}

function withStoneAt(state: MatchState, owner: 'A' | 'B', s: Stone, x: number, y: number): MatchState {
  const board = state.board.map((row) => row.slice())
  board[y]![x] = { owner, stone: s }
  return { ...state, board }
}

function ownerAt(state: MatchState, x: number, y: number) {
  return state.board[y]![x]?.owner
}

const sameWall: CaptureRules = { same: true, plus: false, combo: false, wall: true }
const plusWall: CaptureRules = { same: false, plus: true, combo: false, wall: true }
const sameNoWall: CaptureRules = { same: true, plus: false, combo: false, wall: false }

describe('Wall rule — Same', () => {
  it('the two board edges of a corner count as value-10 matches', () => {
    // A plays the top-left corner. Its up/left spikes are 10, facing the walls.
    // Its right spike (3) ties the enemy's left spike (3): one real Same match.
    // Same needs two; the two walls supply them, so the enemy flips.
    let match = createMatch({
      size: 3,
      rules: sameWall,
      hands: { A: [stone('a', { spikeUp: 10, spikeLeft: 10, spikeRight: 3 })], B: [] },
    })
    match = withStoneAt(match, 'B', stone('b', { spikeLeft: 3 }), 1, 0)

    const next = placeStone(match, 0, 0, 0)

    expect(ownerAt(next, 1, 0)).toBe('A')
  })

  it('does not flip without the Wall rule (only one real Same side)', () => {
    let match = createMatch({
      size: 3,
      rules: sameNoWall,
      hands: { A: [stone('a', { spikeUp: 10, spikeLeft: 10, spikeRight: 3 })], B: [] },
    })
    match = withStoneAt(match, 'B', stone('b', { spikeLeft: 3 }), 1, 0)

    const next = placeStone(match, 0, 0, 0)

    expect(ownerAt(next, 1, 0)).toBe('B')
  })

  it('a non-10 spike facing a wall does not count as a Same match', () => {
    // Right spike is 9, not 10, so the right wall is not a match; only the down
    // neighbour ties — one match, no Same.
    let match = createMatch({
      size: 3,
      rules: sameWall,
      hands: { A: [stone('a', { spikeRight: 9, spikeDown: 4 })], B: [] },
    })
    // Place at top-right corner (2,0): up + right face walls.
    match = withStoneAt(match, 'B', stone('b', { spikeUp: 4 }), 2, 1)

    const next = placeStone(match, 0, 2, 0)

    expect(ownerAt(next, 2, 1)).toBe('B')
  })
})

describe('Wall rule — Plus', () => {
  it('a wall contributes 10 to the edge sum', () => {
    // Corner (0,0): up spike 5 -> wall sum 15. Right spike 5 vs enemy left 10 -> sum 15.
    // Two sides sum to 15 -> Plus flips the enemy. Basic does not (5 < 10).
    let match = createMatch({
      size: 3,
      rules: plusWall,
      hands: { A: [stone('a', { spikeUp: 5, spikeRight: 5 })], B: [] },
    })
    match = withStoneAt(match, 'B', stone('b', { spikeLeft: 10 }), 1, 0)

    const next = placeStone(match, 0, 0, 0)

    expect(ownerAt(next, 1, 0)).toBe('A')
  })
})
