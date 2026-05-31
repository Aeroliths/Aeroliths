import { describe, it, expect } from 'vitest'
import { createMatch, placeStone, getScore } from '~/app/game/engine/match'
import type { MatchState, Player, Stone } from '~/app/game/engine/types'

function stone(id: string, spikes: Partial<Stone> = {}): Stone {
  return { id, elementId: null, spikeUp: 0, spikeDown: 0, spikeLeft: 0, spikeRight: 0, ...spikes }
}

function setOwners(state: MatchState, owners: (Player | null)[][]): MatchState {
  const board = state.board.map((row, y) =>
    row.map((_, x) => {
      const o = owners[y]![x]
      return o ? { owner: o, stone: stone(`${x}-${y}`) } : null
    })
  )
  return { ...state, board }
}

describe('getScore', () => {
  it('counts how many cells each player controls', () => {
    let match = createMatch({ size: 3, hands: { A: [], B: [] } })
    match = setOwners(match, [
      ['A', 'A', 'B'],
      [null, 'A', 'B'],
      [null, null, null],
    ])

    expect(getScore(match)).toEqual({ A: 3, B: 2 })
  })
})

describe('end of game', () => {
  it('finishes and declares the majority owner the winner when the last cell is filled', () => {
    // One empty cell at (2, 2). A controls 5, B controls 3; A plays the last cell.
    let match = createMatch({ size: 3, hands: { A: [stone('a', { spikeRight: 0 })], B: [] } })
    match = setOwners(match, [
      ['A', 'A', 'A'],
      ['A', 'A', 'B'],
      ['B', 'B', null],
    ])

    const next = placeStone(match, 0, 2, 2)

    expect(next.status).toBe('finished')
    expect(next.winner).toBe('A')
  })

  it('declares a draw when control is tied on a full board', () => {
    // 2x2, neutral stones, ends 2-2.
    let match = createMatch({
      size: 2,
      hands: { A: [stone('a1'), stone('a2')], B: [stone('b1'), stone('b2')] },
    })

    match = placeStone(match, 0, 0, 0) // A -> (0,0)
    match = placeStone(match, 0, 1, 0) // B -> (1,0)
    match = placeStone(match, 0, 0, 1) // A -> (0,1)
    match = placeStone(match, 0, 1, 1) // B -> (1,1)

    expect(match.status).toBe('finished')
    expect(getScore(match)).toEqual({ A: 2, B: 2 })
    expect(match.winner).toBe('draw')
  })

  it('keeps status playing while empty cells remain', () => {
    const match = createMatch({ size: 3, hands: { A: [stone('a')], B: [] } })
    const next = placeStone(match, 0, 0, 0)
    expect(next.status).toBe('playing')
    expect(next.winner).toBeNull()
  })
})
