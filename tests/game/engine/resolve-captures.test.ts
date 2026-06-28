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

describe('resolveCaptures - same', () => {
  const SAME_ONLY: CaptureRules = { same: true, plus: false, combo: false }

  it('captures two enemies whose opposite edges equal the placed edges (raw)', () => {
    const board = emptyBoard(3)
    // Place A at (1,1) with up=4, right=6.
    // Enemy above (1,0) has down=4; enemy right (2,1) has left=6 → both match.
    board[0][1] = { owner: 'B', stone: stone({ id: 'top', spikeDown: 4 }) }
    board[1][2] = { owner: 'B', stone: stone({ id: 'right', spikeLeft: 6 }) }
    const placed = stone({ id: 'a', spikeUp: 4, spikeRight: 6, spikeDown: 9, spikeLeft: 9 })

    const { board: next, events } = resolveCaptures(board, 1, 1, placed, 'A', NO_ELEMENTS, SAME_ONLY)

    expect(next[0][1]!.owner).toBe('A')
    expect(next[1][2]!.owner).toBe('A')
    const sames = events.filter((e) => e.type === 'same').map((e) => `${e.x}-${e.y}`).sort()
    expect(sames).toEqual(['1-0', '2-1'])
  })

  it('an allied matching side counts toward the threshold of 2', () => {
    const board = emptyBoard(3)
    // Ally above with down=4 (matches up=4) supplies the 2nd matching side;
    // single enemy on the right with left=6 (matches right=6) is captured.
    board[0][1] = { owner: 'A', stone: stone({ id: 'ally', spikeDown: 4 }) }
    board[1][2] = { owner: 'B', stone: stone({ id: 'enemy', spikeLeft: 6 }) }
    const placed = stone({ id: 'a', spikeUp: 4, spikeRight: 6, spikeDown: 9, spikeLeft: 9 })

    const { board: next, events } = resolveCaptures(board, 1, 1, placed, 'A', NO_ELEMENTS, SAME_ONLY)

    expect(next[1][2]!.owner).toBe('A')
    expect(next[0][1]!.owner).toBe('A') // ally unchanged
    expect(events.filter((e) => e.type === 'same')).toHaveLength(1)
  })

  it('does nothing with only one matching side', () => {
    const board = emptyBoard(3)
    board[1][2] = { owner: 'B', stone: stone({ id: 'enemy', spikeLeft: 6 }) }
    const placed = stone({ id: 'a', spikeRight: 6, spikeUp: 9, spikeDown: 9, spikeLeft: 9 })

    const { events } = resolveCaptures(board, 1, 1, placed, 'A', NO_ELEMENTS, SAME_ONLY)

    expect(events.filter((e) => e.type === 'same')).toHaveLength(0)
  })
})

describe('resolveCaptures - plus', () => {
  const PLUS_ONLY: CaptureRules = { same: false, plus: true, combo: false }

  it('captures two enemies sharing the same edge-sum', () => {
    const board = emptyBoard(3)
    // Place A at (1,1) up=2 right=3. Top enemy down=4 (sum 6); right enemy left=3 (sum 6).
    board[0][1] = { owner: 'B', stone: stone({ id: 'top', spikeDown: 4 }) }
    board[1][2] = { owner: 'B', stone: stone({ id: 'right', spikeLeft: 3 }) }
    const placed = stone({ id: 'a', spikeUp: 2, spikeRight: 3, spikeDown: 1, spikeLeft: 1 })

    const { board: next, events } = resolveCaptures(board, 1, 1, placed, 'A', NO_ELEMENTS, PLUS_ONLY)

    expect(next[0][1]!.owner).toBe('A')
    expect(next[1][2]!.owner).toBe('A')
    expect(events.filter((e) => e.type === 'plus')).toHaveLength(2)
  })

  it('does nothing when no two sums match', () => {
    const board = emptyBoard(3)
    board[0][1] = { owner: 'B', stone: stone({ id: 'top', spikeDown: 4 }) } // sum 6
    board[1][2] = { owner: 'B', stone: stone({ id: 'right', spikeLeft: 9 }) } // sum 12
    const placed = stone({ id: 'a', spikeUp: 2, spikeRight: 3, spikeDown: 1, spikeLeft: 1 })

    const { events } = resolveCaptures(board, 1, 1, placed, 'A', NO_ELEMENTS, PLUS_ONLY)

    expect(events.filter((e) => e.type === 'plus')).toHaveLength(0)
  })
})

describe('resolveCaptures - combo', () => {
  const SAME_COMBO: CaptureRules = { same: true, plus: false, combo: true }

  it('a Same-flipped stone then basic-captures its own weaker enemy neighbour', () => {
    const board = emptyBoard(3)
    // A placed at (0,0): right=4 (matches B top-left enemy) and down=4 (matches another) -> Same.
    // The Same-flipped stone at (1,0) has right=9 and beats enemy at (2,0) left=1 via combo.
    board[0][1] = { owner: 'B', stone: stone({ id: 'b1', spikeLeft: 4, spikeRight: 9 }) }
    board[1][0] = { owner: 'B', stone: stone({ id: 'b2', spikeUp: 4 }) }
    board[0][2] = { owner: 'B', stone: stone({ id: 'b3', spikeLeft: 1 }) }
    const placed = stone({ id: 'a', spikeRight: 4, spikeDown: 4, spikeUp: 1, spikeLeft: 1 })

    const { board: next, events } = resolveCaptures(board, 0, 0, placed, 'A', NO_ELEMENTS, SAME_COMBO)

    expect(next[0][1]!.owner).toBe('A') // captured by Same
    expect(next[1][0]!.owner).toBe('A') // captured by Same
    expect(next[0][2]!.owner).toBe('A') // captured by Combo from b1's right=9 > 1
    expect(events.some((e) => e.type === 'combo' && e.x === 2 && e.y === 0)).toBe(true)
  })

  it('combo does not run when rules.combo is false', () => {
    const board = emptyBoard(3)
    board[0][1] = { owner: 'B', stone: stone({ id: 'b1', spikeLeft: 4, spikeRight: 9 }) }
    board[1][0] = { owner: 'B', stone: stone({ id: 'b2', spikeUp: 4 }) }
    board[0][2] = { owner: 'B', stone: stone({ id: 'b3', spikeLeft: 1 }) }
    const placed = stone({ id: 'a', spikeRight: 4, spikeDown: 4, spikeUp: 1, spikeLeft: 1 })

    const { board: next } = resolveCaptures(board, 0, 0, placed, 'A', NO_ELEMENTS, {
      same: true, plus: false, combo: false,
    })

    expect(next[0][2]!.owner).toBe('B') // no cascade
  })
})
