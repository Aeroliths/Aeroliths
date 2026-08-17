import { describe, it, expect } from 'vitest'
import { createMatch, suddenDeathHands } from '~/game/engine/match'
import type { MatchState, Player, Stone } from '~/game/engine/types'

function stone(id: string): Stone {
  return { id, elementId: null, spikeUp: 0, spikeDown: 0, spikeLeft: 0, spikeRight: 0 }
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

describe('suddenDeathHands', () => {
  it('rebuilds each hand from the stones that player controls on the board', () => {
    let match = createMatch({ size: 2, hands: { A: [], B: [] } })
    match = setOwners(match, [
      ['A', 'B'],
      ['B', 'A'],
    ])

    const hands = suddenDeathHands(match)

    expect(hands.A.map((s) => s.id).sort()).toEqual(['0-0', '1-1'])
    expect(hands.B.map((s) => s.id).sort()).toEqual(['0-1', '1-0'])
  })

  it('preserves the total stone count of the board', () => {
    let match = createMatch({ size: 4, hands: { A: [], B: [] } })
    match = setOwners(match, [
      ['A', 'A', 'B', 'B'],
      ['A', 'A', 'B', 'B'],
      ['A', 'B', 'A', 'B'],
      ['B', 'A', 'B', 'A'],
    ])

    const hands = suddenDeathHands(match)

    expect(hands.A.length + hands.B.length).toBe(16)
  })
})
