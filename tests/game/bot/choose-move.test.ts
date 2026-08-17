import { describe, it, expect } from 'vitest'
import { chooseMove } from '~/game/bot'
import { createMatch } from '~/game/engine/match'
import type { MatchState, Stone } from '~/game/engine/types'

function stone(id: string, up: number, down: number, left: number, right: number): Stone {
  return { id, elementId: null, spikeUp: up, spikeDown: down, spikeLeft: left, spikeRight: right }
}

const catalog = [stone('c1', 5, 5, 5, 5), stone('c2', 8, 2, 8, 2)]

/** B to move, A holding the hidden hand under test. */
function position(hiddenHand: Stone[], openHands = false): MatchState {
  const base = createMatch({
    size: 3,
    hands: { A: hiddenHand, B: [stone('b1', 6, 6, 6, 6), stone('b2', 3, 9, 3, 9)] },
    startingPlayer: 'B',
    openHands,
  })
  const state: MatchState = { ...base }
  state.board[0]![0] = { owner: 'A', stone: stone('weak', 1, 1, 1, 1) }
  return state
}

const decoy = [stone('z1', 9, 9, 9, 9), stone('z2', 9, 9, 9, 9)]
const honest = [stone('y1', 1, 1, 1, 1), stone('y2', 1, 1, 1, 1)]

describe('chooseMove', () => {
  it('returns null once the match is over', () => {
    const state: MatchState = { ...position(honest), status: 'finished' }

    expect(chooseMove(state, { difficulty: 'hard', catalog })).toBeNull()
  })

  it('produces a legal move at every difficulty', () => {
    const state = position(honest)

    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const move = chooseMove(state, { difficulty, catalog })

      expect(move).not.toBeNull()
      expect(state.board[move!.y]![move!.x]).toBeNull()
      expect(move!.handIndex).toBeLessThan(state.hands.B.length)
    }
  })

  // The fairness decision, expressed as a property. It breaks the day someone
  // points the search at the full state out of convenience.
  it('ignores the hidden opponent hand at every difficulty', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const withDecoy = chooseMove(position(decoy), { difficulty, catalog, timeBudgetMs: 60_000 })
      const withHonest = chooseMove(position(honest), { difficulty, catalog, timeBudgetMs: 60_000 })

      expect(withDecoy).toEqual(withHonest)
    }
  })

  it('uses the hidden hand once hands are open', () => {
    const withDecoy = chooseMove(position(decoy, true), {
      difficulty: 'hard',
      catalog,
      timeBudgetMs: 60_000,
    })
    const withHonest = chooseMove(position(honest, true), {
      difficulty: 'hard',
      catalog,
      timeBudgetMs: 60_000,
    })

    expect(withDecoy).not.toEqual(withHonest)
  })
})
