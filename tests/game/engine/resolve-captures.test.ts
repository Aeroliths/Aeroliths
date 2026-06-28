import { describe, it, expect } from 'vitest'
import { resolveCaptures } from '../../../app/game/engine/match'
import type { Cell, CaptureRules, ElementGraph, Stone } from '../../../app/game/engine/types'

const NO_RULES: CaptureRules = { same: false, plus: false, combo: false }
const NO_ELEMENTS: ElementGraph = { strongAgainst: {} }

function stone(p: Partial<Stone> & { id: string }): Stone {
  return {
    id: p.id,
    elementId: p.elementId ?? null,
    spikeUp: p.spikeUp ?? 1,
    spikeDown: p.spikeDown ?? 1,
    spikeLeft: p.spikeLeft ?? 1,
    spikeRight: p.spikeRight ?? 1,
  }
}

function emptyBoard(size: number): Cell[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null))
}

describe('resolveCaptures - basic', () => {
  it('captures a weaker adjacent enemy on the contested edge', () => {
    const board = emptyBoard(3)
    // Enemy B at (1,0) with left=3; we place A at (0,0) with right=5.
    board[0][1] = { owner: 'B', stone: stone({ id: 'b', spikeLeft: 3 }) }
    const placed = stone({ id: 'a', spikeRight: 5 })

    const { board: next, events } = resolveCaptures(board, 0, 0, placed, 'A', NO_ELEMENTS, NO_RULES)

    expect(next[0][1]!.owner).toBe('A')
    expect(events).toEqual([
      { x: 1, y: 0, type: 'basic', edge: 'right', elementDelta: 0 },
    ])
  })

  it('does not capture on a tie', () => {
    const board = emptyBoard(3)
    board[0][1] = { owner: 'B', stone: stone({ id: 'b', spikeLeft: 5 }) }
    const placed = stone({ id: 'a', spikeRight: 5 })

    const { board: next, events } = resolveCaptures(board, 0, 0, placed, 'A', NO_ELEMENTS, NO_RULES)

    expect(next[0][1]!.owner).toBe('B')
    expect(events).toEqual([])
  })

  it('applies the +1 element bonus and records elementDelta', () => {
    const board = emptyBoard(3)
    board[0][1] = { owner: 'B', stone: stone({ id: 'b', elementId: 'wind', spikeLeft: 5 }) }
    const placed = stone({ id: 'a', elementId: 'fire', spikeRight: 5 })
    const elements: ElementGraph = { strongAgainst: { fire: ['wind'] } }

    const { board: next, events } = resolveCaptures(board, 0, 0, placed, 'A', elements, NO_RULES)

    expect(next[0][1]!.owner).toBe('A') // 5 + 1 > 5
    expect(events).toEqual([
      { x: 1, y: 0, type: 'basic', edge: 'right', elementDelta: 1 },
    ])
  })
})
