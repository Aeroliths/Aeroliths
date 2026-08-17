import { describe, it, expect } from 'vitest'
import { searchMove, legalMoves } from '~/game/bot/search'
import { evaluate } from '~/game/bot/evaluate'
import { createMatch, placeStoneWithEvents } from '~/game/engine/match'
import type { MatchState, Player, Stone } from '~/game/engine/types'

function stone(id: string, up: number, down: number, left: number, right: number): Stone {
  return { id, elementId: null, spikeUp: up, spikeDown: down, spikeLeft: left, spikeRight: right }
}

/**
 * Reference implementation: plain minimax, no pruning, no iterative deepening,
 * no clock. Agreeing with it is a stronger statement than any single hand-built
 * trap position, because a search that prunes wrongly or deepens wrongly
 * diverges from it immediately.
 */
function plainMinimax(state: MatchState, bot: Player, depth: number): number {
  if (state.status === 'finished' || depth === 0) return evaluate(state, bot)
  const moves = legalMoves(state, null)
  if (moves.length === 0) return evaluate(state, bot)

  const scores = moves.map((move) => {
    const { state: next } = placeStoneWithEvents(state, move.handIndex, move.x, move.y)
    return plainMinimax(next, bot, depth - 1)
  })
  return state.current === bot ? Math.max(...scores) : Math.min(...scores)
}

function plainBestMove(state: MatchState, depth: number) {
  const bot = state.current
  const moves = legalMoves(state, null)
  let best = moves[0]!
  let bestScore = -Infinity
  for (const move of moves) {
    const { state: next } = placeStoneWithEvents(state, move.handIndex, move.x, move.y)
    const score = plainMinimax(next, bot, depth - 1)
    if (score > bestScore) {
      bestScore = score
      best = move
    }
  }
  return best
}

// Open hands, so the modelled opponent hand is the real one and the reference
// implementation sees exactly the same position as the search under test.
const openMatch = () =>
  createMatch({
    size: 3,
    hands: {
      A: [
        stone('a1', 6, 2, 6, 2),
        stone('a2', 2, 6, 2, 6),
        stone('a3', 4, 4, 4, 4),
        stone('a4', 3, 7, 3, 7),
        stone('a5', 5, 5, 5, 5),
      ],
      B: [
        stone('b1', 7, 3, 7, 3),
        stone('b2', 3, 7, 3, 7),
        stone('b3', 5, 1, 5, 1),
        stone('b4', 1, 5, 1, 5),
      ],
    },
    startingPlayer: 'A',
    openHands: true,
  })

describe('searchMove', () => {
  it('returns the same move as plain minimax at depth two', () => {
    const state = openMatch()

    const pruned = searchMove(state, {
      catalog: [],
      forcedHandIndex: null,
      maxDepth: 2,
      timeBudgetMs: 60_000,
    })

    expect(pruned).toEqual(plainBestMove(state, 2))
  })

  it('returns the same move as plain minimax at depth three', () => {
    const state = openMatch()

    const pruned = searchMove(state, {
      catalog: [],
      forcedHandIndex: null,
      maxDepth: 3,
      timeBudgetMs: 60_000,
    })

    expect(pruned).toEqual(plainBestMove(state, 3))
  })

  it('honours the Chaos constraint at the root', () => {
    const state = createMatch({
      size: 3,
      hands: { A: [stone('a1', 1, 1, 1, 1), stone('a2', 9, 9, 9, 9)], B: [] },
      startingPlayer: 'A',
      handRule: 'chaos',
    })

    const move = searchMove(state, {
      catalog: [],
      forcedHandIndex: 0,
      maxDepth: 2,
      timeBudgetMs: 60_000,
    })

    expect(move?.handIndex).toBe(0)
  })

  it('returns within its time budget on a 5x5 board', () => {
    const hand = (prefix: string, count: number) =>
      Array.from({ length: count }, (_, i) => stone(`${prefix}${i}`, 1 + (i % 9), 9 - (i % 9), 5, 5))
    const state = createMatch({
      size: 5,
      hands: { A: hand('a', 13), B: hand('b', 12) },
      startingPlayer: 'A',
    })

    const startedAt = Date.now()
    const move = searchMove(state, {
      catalog: [stone('c', 9, 9, 9, 9)],
      forcedHandIndex: null,
      maxDepth: 6,
      timeBudgetMs: 300,
    })
    const elapsed = Date.now() - startedAt

    expect(move).not.toBeNull()
    expect(elapsed).toBeLessThan(3000)
  })

  it('returns null when no move is available', () => {
    const state = createMatch({ size: 3, hands: { A: [], B: [] }, startingPlayer: 'A' })

    expect(
      searchMove(state, { catalog: [], forcedHandIndex: null, maxDepth: 2, timeBudgetMs: 100 }),
    ).toBeNull()
  })
})
