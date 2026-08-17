import { createMatch, placeStoneWithEvents, getScore, handSizeFor } from '~/game/engine/match'
import type { CaptureRules, ElementGraph, HandRule, Player, Stone } from '~/game/engine/types'
import type { MatchResult } from './xp'

const MIN_SIZE = 3
const MAX_SIZE = 5

export interface ReplayInput {
  size: number
  rules: CaptureRules
  handRule: HandRule
  openHands: boolean
  startingPlayer: Player
  boardElements: (string | null)[][]
  elements: ElementGraph
  /** Stones resolved from the database, never from the request. */
  hands: Record<Player, Stone[]>
  moves: { handIndex: number; x: number; y: number }[]
}

export interface ReplayOutcome {
  result: MatchResult
  scoreSelf: number
  scoreOpponent: number
}

/**
 * Replays a submitted match through the engine and reports what actually
 * happened. The submitting player holds seat A.
 *
 * Throws on anything the engine would refuse, and on the shape checks the
 * engine does not perform. The caller turns a throw into a rejected request:
 * a submission is either wholly valid or wholly discarded.
 */
export function replayMatch(input: ReplayInput): ReplayOutcome {
  const { size, startingPlayer, hands, moves, boardElements } = input

  if (!Number.isInteger(size) || size < MIN_SIZE || size > MAX_SIZE) {
    throw new Error(`Unsupported board size: ${size}`)
  }

  for (const player of ['A', 'B'] as const) {
    const expected = handSizeFor(size, player, startingPlayer)
    if (hands[player].length !== expected) {
      throw new Error(`Hand ${player} holds ${hands[player].length} stones, expected ${expected}`)
    }
  }

  if (boardElements.length !== size || boardElements.some((row) => row.length !== size)) {
    throw new Error('Element grid does not match the board')
  }

  let state = createMatch({
    size,
    hands,
    elements: input.elements,
    rules: input.rules,
    startingPlayer,
    boardElements,
    handRule: input.handRule,
    openHands: input.openHands,
  })

  for (const move of moves) {
    if (state.status !== 'playing') {
      throw new Error('Move played after the match ended')
    }
    // Throws on an occupied cell, an out-of-bounds coordinate or a missing hand
    // slot. Letting it propagate is the point.
    state = placeStoneWithEvents(state, move.handIndex, move.x, move.y).state
  }

  if (state.status !== 'finished') {
    throw new Error('Submitted match is unfinished')
  }

  const score = getScore(state)
  const result: MatchResult =
    state.winner === 'draw' ? 'draw' : state.winner === 'A' ? 'win' : 'loss'

  return { result, scoreSelf: score.A!, scoreOpponent: score.B! }
}
