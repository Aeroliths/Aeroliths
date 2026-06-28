import { describe, it, expect } from 'vitest'
import {
  createMatch,
  placeStone,
  placeStoneWithEvents,
  previewCaptures,
  handSizeFor,
  decideWinner,
} from '~/app/game/engine/match'
import type { CaptureRules, MatchState, Stone } from '~/app/game/engine/types'

const RULES: CaptureRules = { same: false, plus: false, combo: false }

function stone(id: string, spikes: Partial<Stone> = {}): Stone {
  return {
    id,
    elementId: null,
    spikeUp: 1,
    spikeDown: 1,
    spikeLeft: 1,
    spikeRight: 1,
    ...spikes,
  }
}

describe('createMatch', () => {
  it('creates an empty NxN board with the given size', () => {
    const match = createMatch({
      size: 3,
      hands: { A: [stone('a1')], B: [stone('b1')] },
    })

    expect(match.size).toBe(3)
    expect(match.board).toHaveLength(3)
    expect(match.board.every((row) => row.length === 3)).toBe(true)
    expect(match.board.flat().every((cell) => cell === null)).toBe(true)
  })

  it('starts with player A by default and status playing', () => {
    const match = createMatch({
      size: 3,
      hands: { A: [stone('a1')], B: [stone('b1')] },
    })

    expect(match.current).toBe('A')
    expect(match.status).toBe('playing')
    expect(match.winner).toBeNull()
  })
})

describe('placeStone', () => {
  it('places the chosen hand stone on an empty cell owned by the current player', () => {
    const match = createMatch({
      size: 3,
      hands: { A: [stone('a1')], B: [stone('b1')] },
    })

    const next = placeStone(match, 0, 1, 2)

    expect(next.board[2]![1]).toEqual({ owner: 'A', stone: stone('a1') })
  })

  it('removes the played stone from the hand and passes the turn', () => {
    const match = createMatch({
      size: 3,
      hands: { A: [stone('a1'), stone('a2')], B: [stone('b1')] },
    })

    const next = placeStone(match, 0, 0, 0)

    expect(next.hands.A).toEqual([stone('a2')])
    expect(next.current).toBe('B')
  })

  it('does not mutate the original state', () => {
    const match = createMatch({
      size: 3,
      hands: { A: [stone('a1')], B: [stone('b1')] },
    })

    placeStone(match, 0, 0, 0)

    expect(match.board[0]![0]).toBeNull()
    expect(match.hands.A).toHaveLength(1)
    expect(match.current).toBe('A')
  })

  it('throws when the target cell is already occupied', () => {
    const match = createMatch({
      size: 3,
      hands: { A: [stone('a1')], B: [stone('b1')] },
    })

    const next = placeStone(match, 0, 0, 0)

    expect(() => placeStone(next, 0, 0, 0)).toThrow(/occupied/i)
  })

  it('throws when the hand index is out of range', () => {
    const match = createMatch({
      size: 3,
      hands: { A: [stone('a1')], B: [stone('b1')] },
    })

    expect(() => placeStone(match, 5, 0, 0)).toThrow(/hand/i)
  })

  it('throws when the coordinates are off the board', () => {
    const match = createMatch({
      size: 3,
      hands: { A: [stone('a1')], B: [stone('b1')] },
    })

    expect(() => placeStone(match, 0, 3, 0)).toThrow(/board/i)
  })
})

describe('previewCaptures', () => {
  it('matches the captures that placeStone actually performs', () => {
    const attacker = stone('a', { spikeRight: 5 })
    const state = createMatch({
      size: 3,
      hands: { A: [attacker], B: [stone('b', { spikeLeft: 3 })] },
      rules: RULES,
      startingPlayer: 'B',
    })
    // B plays the defender at (1,0) first.
    const afterB = placeStone(state, 0, 1, 0)
    // Now A is to move; preview placing the attacker at (0,0).
    const preview = previewCaptures(afterB, 0, 0, 0)
    const real = placeStone(afterB, 0, 0, 0)

    expect(preview).toEqual([{ x: 1, y: 0, type: 'basic', edge: 'right', elementDelta: 0 }])
    expect(real.board[0][1]!.owner).toBe('A')
  })

  it('returns [] for an occupied cell', () => {
    const state = createMatch({
      size: 3,
      hands: { A: [stone('a')], B: [stone('b')] },
      rules: RULES,
    })
    const after = placeStone(state, 0, 0, 0)
    expect(previewCaptures(after, 0, 0, 0)).toEqual([])
  })
})

describe('handSizeFor', () => {
  it('gives the non-starter the extra stone on odd boards', () => {
    expect(handSizeFor(3, 'A', 'A')).toBe(4) // starter A: floor(9/2)=4
    expect(handSizeFor(3, 'B', 'A')).toBe(5) // non-starter B: ceil(9/2)=5
    expect(handSizeFor(3, 'B', 'B')).toBe(4) // starter B
    expect(handSizeFor(3, 'A', 'B')).toBe(5) // non-starter A
  })

  it('splits evenly on even boards', () => {
    expect(handSizeFor(4, 'A', 'A')).toBe(8)
    expect(handSizeFor(4, 'B', 'A')).toBe(8)
  })
})

describe('decideWinner tie-break', () => {
  // 2x2 board, owned 2-2, so the cell count is tied and the spike sum decides.
  function tiedState(aTotalEdge: number, bTotalEdge: number): MatchState {
    const a = { owner: 'A' as const, stone: stone('a', { spikeUp: aTotalEdge, spikeDown: aTotalEdge, spikeLeft: aTotalEdge, spikeRight: aTotalEdge }) }
    const b = { owner: 'B' as const, stone: stone('b', { spikeUp: bTotalEdge, spikeDown: bTotalEdge, spikeLeft: bTotalEdge, spikeRight: bTotalEdge }) }
    return {
      size: 2,
      board: [[a, b], [b, a]],
      hands: { A: [], B: [] },
      current: 'A',
      elements: { strongAgainst: {} },
      rules: RULES,
      lastMove: null,
      status: 'playing',
      winner: null,
    }
  }

  it('breaks a 2-2 game by total spike values', () => {
    expect(decideWinner(tiedState(3, 1))).toBe('A') // A: 12 each cell, B: 4 each
    expect(decideWinner(tiedState(1, 3))).toBe('B')
  })

  it('returns draw when cells and spike totals are equal', () => {
    expect(decideWinner(tiedState(2, 2))).toBe('draw')
  })
})

describe('placeStoneWithEvents', () => {
  it('returns the same state as placeStone plus the capture events', () => {
    const attacker = stone('a', { spikeRight: 5 })
    const base = createMatch({
      size: 3,
      hands: { A: [attacker], B: [stone('b', { spikeLeft: 3 })] },
      rules: RULES,
      startingPlayer: 'B',
    })
    const afterB = placeStone(base, 0, 1, 0)
    const { state, events } = placeStoneWithEvents(afterB, 0, 0, 0)
    expect(state.board[0][1]!.owner).toBe('A')
    expect(events).toEqual([{ x: 1, y: 0, type: 'basic', edge: 'right', elementDelta: 0 }])
  })
})
