import { describe, it, expect } from 'vitest'
import { replayMatch, type ReplayInput } from '~~/server/utils/match-replay'
import type { Stone } from '~/game/engine/types'

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

/** A 3x3 match where A starts, holds 5 stones and B holds 4. */
function submission(overrides: Partial<ReplayInput> = {}): ReplayInput {
  return {
    size: 3,
    rules: { same: false, plus: false, combo: false, wall: false },
    handRule: 'none',
    openHands: false,
    startingPlayer: 'A',
    boardElements: [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
    elements: { strongAgainst: {} },
    hands: {
      A: [0, 1, 2, 3, 4].map((i) => stone(`a${i}`, 9)),
      B: [0, 1, 2, 3].map((i) => stone(`b${i}`, 1)),
    },
    // Fill the board in reading order, always playing the first stone in hand.
    moves: [
      { handIndex: 0, x: 0, y: 0 },
      { handIndex: 0, x: 1, y: 0 },
      { handIndex: 0, x: 2, y: 0 },
      { handIndex: 0, x: 0, y: 1 },
      { handIndex: 0, x: 1, y: 1 },
      { handIndex: 0, x: 2, y: 1 },
      { handIndex: 0, x: 0, y: 2 },
      { handIndex: 0, x: 1, y: 2 },
      { handIndex: 0, x: 2, y: 2 },
    ],
    ...overrides,
  }
}

describe('replayMatch', () => {
  it('replays a full match and reports the result from the submitter seat', () => {
    const outcome = replayMatch(submission())

    expect(outcome.result).toBe('win')
    expect(outcome.scoreSelf + outcome.scoreOpponent).toBe(9)
    expect(outcome.scoreSelf).toBeGreaterThan(outcome.scoreOpponent)
  })

  it('rejects a board size outside the supported range', () => {
    expect(() => replayMatch(submission({ size: 2 }))).toThrow(/board size/i)
    expect(() => replayMatch(submission({ size: 6 }))).toThrow(/board size/i)
  })

  it('rejects a hand that does not match the size the rules impose', () => {
    const input = submission()
    input.hands.A = input.hands.A.slice(0, 3)

    expect(() => replayMatch(input)).toThrow(/hand/i)
  })

  it('rejects a move list that does not fill the board', () => {
    const input = submission()
    input.moves = input.moves.slice(0, 8)

    expect(() => replayMatch(input)).toThrow(/unfinished/i)
  })

  it('rejects a move onto an occupied cell', () => {
    const input = submission()
    input.moves[1] = { handIndex: 0, x: 0, y: 0 }

    expect(() => replayMatch(input)).toThrow()
  })

  it('rejects a move outside the board', () => {
    const input = submission()
    input.moves[0] = { handIndex: 0, x: 9, y: 0 }

    expect(() => replayMatch(input)).toThrow()
  })

  it('rejects a hand index that does not exist', () => {
    const input = submission()
    input.moves[0] = { handIndex: 12, x: 0, y: 0 }

    expect(() => replayMatch(input)).toThrow()
  })

  it('rejects an element grid whose shape does not match the board', () => {
    expect(() => replayMatch(submission({ boardElements: [[null, null, null]] }))).toThrow(
      /element grid/i,
    )
  })

  it('reports a loss from the submitter seat when B wins', () => {
    const input = submission()
    input.hands.A = [0, 1, 2, 3, 4].map((i) => stone(`a${i}`, 1))
    input.hands.B = [0, 1, 2, 3].map((i) => stone(`b${i}`, 9))

    expect(replayMatch(input).result).toBe('loss')
  })
})
