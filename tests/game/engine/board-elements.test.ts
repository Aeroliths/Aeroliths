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

function neutralElements(size: number): (string | null)[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null))
}

describe('resolveCaptures - elemental cells', () => {
  it('wins a capture thanks to the +1 cell bonus on the attacker', () => {
    const board = emptyBoard(3)
    board[0][1] = { owner: 'B', stone: stone({ id: 'b', spikeLeft: 5 }) }
    const placed = stone({ id: 'a', elementId: 'fire', spikeRight: 5 }) // 5 vs 5 normally = tie
    const be = neutralElements(3)
    be[0][0] = 'fire' // attacker sits on a matching fire cell -> +1

    const { board: next, events } = resolveCaptures(board, 0, 0, placed, 'A', NO_ELEMENTS, NO_RULES, be)

    expect(next[0][1]!.owner).toBe('A') // 5 + 1 > 5
    expect(events[0]).toMatchObject({ x: 1, y: 0, type: 'basic', elementDelta: 1 })
  })

  it('loses a capture due to the -1 cell bonus on the attacker', () => {
    const board = emptyBoard(3)
    board[0][1] = { owner: 'B', stone: stone({ id: 'b', spikeLeft: 5 }) }
    const placed = stone({ id: 'a', elementId: 'fire', spikeRight: 6 }) // 6 vs 5 normally wins
    const be = neutralElements(3)
    be[0][0] = 'water' // attacker mismatches -> -1, so 5 vs 5 = no capture

    const { board: next, events } = resolveCaptures(board, 0, 0, placed, 'A', NO_ELEMENTS, NO_RULES, be)

    expect(next[0][1]!.owner).toBe('B')
    expect(events).toEqual([])
  })

  it('adds the defender cell bonus to the defence', () => {
    const board = emptyBoard(3)
    board[0][1] = { owner: 'B', stone: stone({ id: 'b', elementId: 'fire', spikeLeft: 5 }) }
    const placed = stone({ id: 'a', spikeRight: 6 }) // 6 vs 5 normally wins
    const be = neutralElements(3)
    be[0][1] = 'fire' // defender matches -> +1 defence, 6 vs 6 = no capture

    const { board: next } = resolveCaptures(board, 0, 0, placed, 'A', NO_ELEMENTS, NO_RULES, be)

    expect(next[0][1]!.owner).toBe('B')
  })

  it('Same ignores cell bonuses (raw values)', () => {
    const board = emptyBoard(3)
    board[0][1] = { owner: 'B', stone: stone({ id: 'top', spikeDown: 4 }) }
    board[1][2] = { owner: 'B', stone: stone({ id: 'right', spikeLeft: 6 }) }
    const placed = stone({ id: 'a', elementId: 'fire', spikeUp: 4, spikeRight: 6, spikeDown: 9, spikeLeft: 9 })
    const be = neutralElements(3)
    be[1][1] = 'water' // would be -1 for Basic, but Same uses raw and still matches

    const { board: next } = resolveCaptures(board, 1, 1, placed, 'A', NO_ELEMENTS, { same: true, plus: false, combo: false }, be)

    expect(next[0][1]!.owner).toBe('A')
    expect(next[1][2]!.owner).toBe('A')
  })
})
