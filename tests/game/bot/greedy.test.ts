import { describe, it, expect } from 'vitest'
import { allowedHandIndices, legalMoves, greedyMove } from '~/game/bot/search'
import { createMatch } from '~/game/engine/match'
import type { MatchState, Stone } from '~/game/engine/types'

function stone(id: string, up: number, down: number, left: number, right: number): Stone {
  return { id, elementId: null, spikeUp: up, spikeDown: down, spikeLeft: left, spikeRight: right }
}

describe('allowedHandIndices', () => {
  it('collapses identical stones to a single index', () => {
    const twin = stone('twin', 5, 5, 5, 5)
    const state = createMatch({
      size: 3,
      hands: { A: [twin, twin, stone('other', 1, 1, 1, 1)], B: [] },
      startingPlayer: 'A',
    })

    expect(allowedHandIndices(state, null)).toEqual([0, 2])
  })

  it('allows only the first stone under the Order rule', () => {
    const state = createMatch({
      size: 3,
      hands: { A: [stone('a', 1, 1, 1, 1), stone('b', 2, 2, 2, 2)], B: [] },
      startingPlayer: 'A',
      handRule: 'order',
    })

    expect(allowedHandIndices(state, null)).toEqual([0])
  })

  it('allows only the drawn stone under the Chaos rule', () => {
    const state = createMatch({
      size: 3,
      hands: { A: [stone('a', 1, 1, 1, 1), stone('b', 2, 2, 2, 2)], B: [] },
      startingPlayer: 'A',
      handRule: 'chaos',
    })

    expect(allowedHandIndices(state, 1)).toEqual([1])
  })

  it('returns nothing when the hand is empty', () => {
    const state = createMatch({ size: 3, hands: { A: [], B: [] }, startingPlayer: 'A' })

    expect(allowedHandIndices(state, null)).toEqual([])
  })
})

describe('legalMoves', () => {
  it('pairs every allowed stone with every empty cell', () => {
    const state = createMatch({
      size: 2,
      hands: { A: [stone('a', 1, 1, 1, 1), stone('b', 2, 2, 2, 2)], B: [] },
      startingPlayer: 'A',
    })

    expect(legalMoves(state, null)).toHaveLength(2 * 4)
  })

  it('skips occupied cells', () => {
    const base = createMatch({
      size: 2,
      hands: { A: [stone('a', 1, 1, 1, 1)], B: [] },
      startingPlayer: 'A',
    })
    const state: MatchState = { ...base }
    state.board[0]![0] = { owner: 'B', stone: stone('placed', 1, 1, 1, 1) }

    expect(legalMoves(state, null)).toHaveLength(3)
  })
})

describe('greedyMove', () => {
  it('takes the largest immediate capture', () => {
    // B holds both top corners. Only the cell between them touches the two at
    // once, so the best move is unambiguous and the tie-break never decides it.
    const weak = stone('weak', 1, 1, 1, 1)
    const base = createMatch({
      size: 3,
      hands: { A: [stone('strong', 9, 9, 9, 9)], B: [] },
      startingPlayer: 'A',
    })
    const state: MatchState = { ...base }
    state.board[0]![0] = { owner: 'B', stone: weak }
    state.board[0]![2] = { owner: 'B', stone: weak }

    expect(greedyMove(state, null)).toEqual({ handIndex: 0, x: 1, y: 0 })
  })

  it('returns null when the hand is empty', () => {
    const state = createMatch({ size: 3, hands: { A: [], B: [] }, startingPlayer: 'A' })

    expect(greedyMove(state, null)).toBeNull()
  })
})
