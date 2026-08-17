import { placeStoneWithEvents, previewCaptures } from '~/game/engine/match'
import { evaluate } from './evaluate'
import { modelOpponentHand } from './opponent-model'
import type { MatchState, Player, Stone } from '~/game/engine/types'

export interface Move {
  handIndex: number
  x: number
  y: number
}

/** Two stones with the same values produce the same outcome anywhere. */
function stoneKey(stone: Stone): string {
  return [
    stone.elementId ?? '',
    stone.spikeUp,
    stone.spikeDown,
    stone.spikeLeft,
    stone.spikeRight,
  ].join(':')
}

/**
 * Hand indices the current player may use, honouring Order and Chaos.
 *
 * Without a rule constraint, identical stones collapse to their first index.
 * Auto-fill cycles through a small catalog, so hands routinely hold the same
 * stone several times and the branching factor drops sharply for free.
 */
export function allowedHandIndices(state: MatchState, forcedHandIndex: number | null): number[] {
  const hand = state.hands[state.current]
  if (hand.length === 0) return []
  if (state.handRule === 'order') return [0]
  if (state.handRule === 'chaos' && forcedHandIndex !== null && forcedHandIndex < hand.length) {
    return [forcedHandIndex]
  }

  const seen = new Set<string>()
  const indices: number[] = []
  hand.forEach((stone, index) => {
    const key = stoneKey(stone)
    if (seen.has(key)) return
    seen.add(key)
    indices.push(index)
  })
  return indices
}

/** Every allowed stone paired with every empty cell. */
export function legalMoves(state: MatchState, forcedHandIndex: number | null): Move[] {
  const moves: Move[] = []
  const indices = allowedHandIndices(state, forcedHandIndex)
  if (indices.length === 0) return moves

  state.board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) return
      for (const handIndex of indices) moves.push({ handIndex, x, y })
    })
  })
  return moves
}

/**
 * The move capturing the most stones right now, ignoring the reply.
 * Ties go to the first move in scan order, which keeps the easy bot
 * deterministic and therefore testable.
 */
export function greedyMove(state: MatchState, forcedHandIndex: number | null): Move | null {
  let best: Move | null = null
  let bestCaptures = -1

  for (const move of legalMoves(state, forcedHandIndex)) {
    const captures = previewCaptures(state, move.handIndex, move.x, move.y).length
    if (captures > bestCaptures) {
      bestCaptures = captures
      best = move
    }
  }
  return best
}

export interface SearchOptions {
  /** Public catalog, used to model the hidden opponent hand. */
  catalog: Stone[]
  /** Stone drawn by the Chaos rule, or null. Applies at the root only. */
  forcedHandIndex: number | null
  maxDepth: number
  timeBudgetMs: number
}

/** The state as the bot is allowed to picture it: opponent hand replaced by the model. */
function asSeenByBot(state: MatchState, bot: Player, catalog: Stone[]): MatchState {
  const opponent: Player = bot === 'A' ? 'B' : 'A'
  return {
    ...state,
    hands: { ...state.hands, [opponent]: modelOpponentHand(state, opponent, catalog) },
  }
}

function minimax(
  state: MatchState,
  bot: Player,
  depth: number,
  alpha: number,
  beta: number,
  deadline: number,
): number {
  if (state.status === 'finished' || depth === 0 || Date.now() > deadline) {
    return evaluate(state, bot)
  }

  const moves = legalMoves(state, null)
  if (moves.length === 0) return evaluate(state, bot)

  const maximising = state.current === bot
  let best = maximising ? -Infinity : Infinity

  for (const move of moves) {
    const { state: next } = placeStoneWithEvents(state, move.handIndex, move.x, move.y)
    const score = minimax(next, bot, depth - 1, alpha, beta, deadline)

    if (maximising) {
      if (score > best) best = score
      if (best > alpha) alpha = best
    } else {
      if (score < best) best = score
      if (best < beta) beta = best
    }
    if (beta <= alpha) break
  }

  return best
}

/**
 * Best move for the current player, searched with alpha-beta pruning and
 * iterative deepening. Only a fully completed depth updates the answer, so a
 * search cut off by the budget still returns a coherent move rather than the
 * half-explored best of an abandoned pass.
 */
export function searchMove(state: MatchState, options: SearchOptions): Move | null {
  const bot = state.current
  const modelled = asSeenByBot(state, bot, options.catalog)
  const moves = legalMoves(modelled, options.forcedHandIndex)
  if (moves.length === 0) return null

  const deadline = Date.now() + options.timeBudgetMs
  let bestMove = moves[0]!

  for (let depth = 1; depth <= options.maxDepth; depth++) {
    let depthBest = moves[0]!
    let depthScore = -Infinity
    let completed = true

    for (const move of moves) {
      if (Date.now() > deadline) {
        completed = false
        break
      }
      const { state: next } = placeStoneWithEvents(modelled, move.handIndex, move.x, move.y)
      const score = minimax(next, bot, depth - 1, -Infinity, Infinity, deadline)
      if (score > depthScore) {
        depthScore = score
        depthBest = move
      }
    }

    if (!completed) break
    bestMove = depthBest
  }

  return bestMove
}
