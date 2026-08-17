import { describe, it, expect } from 'vitest'
import { evaluate } from '~/game/bot/evaluate'
import { createMatch } from '~/game/engine/match'
import type { MatchState, Stone } from '~/game/engine/types'

function stone(id: string, value: number): Stone {
  return {
    id,
    elementId: null,
    spikeUp: value,
    spikeDown: value,
    spikeLeft: value,
    spikeRight: value,
  }
}

function boardOf(owners: (('A' | 'B') | null)[][], value = 5): MatchState {
  const base = createMatch({
    size: owners.length,
    hands: { A: [], B: [] },
  })
  const board = owners.map((row) =>
    row.map((owner) => (owner ? { owner, stone: stone(`${owner}-x`, value) } : null)),
  )
  return { ...base, board }
}

describe('evaluate', () => {
  it('is positive when the player controls more cells', () => {
    const state = boardOf([
      ['A', 'A'],
      ['B', null],
    ])

    expect(evaluate(state, 'A')).toBeGreaterThan(0)
    expect(evaluate(state, 'B')).toBeLessThan(0)
  })

  it('is symmetric between the two players', () => {
    const state = boardOf([
      ['A', 'A'],
      ['B', null],
    ])

    expect(evaluate(state, 'A')).toBe(-evaluate(state, 'B'))
  })

  it('falls back to the spike total when the cell counts are equal', () => {
    const state: MatchState = boardOf([
      ['A', 'B'],
      [null, null],
    ])
    state.board[0]![0] = { owner: 'A', stone: stone('strong', 9) }
    state.board[0]![1] = { owner: 'B', stone: stone('weak', 1) }

    expect(evaluate(state, 'A')).toBeGreaterThan(0)
  })

  it('ranks one extra cell above any spike advantage', () => {
    const cellAhead = boardOf(
      [
        ['A', 'A'],
        ['B', null],
      ],
      1,
    )
    const spikesAhead: MatchState = boardOf([
      ['A', 'B'],
      [null, null],
    ])
    spikesAhead.board[0]![0] = { owner: 'A', stone: stone('strong', 10) }
    spikesAhead.board[0]![1] = { owner: 'B', stone: stone('weak', 1) }

    expect(evaluate(cellAhead, 'A')).toBeGreaterThan(evaluate(spikesAhead, 'A'))
  })
})
