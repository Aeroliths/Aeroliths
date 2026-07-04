import { describe, it, expect } from 'vitest'
import { createMatch, placeStone, placeStoneWithEvents } from '../../../app/game/engine/match'
import { matchHighlights, buildCaptureInfo } from '../../../app/game/engine/analysis'
import type { CaptureRules, Stone, TimelineEntry } from '../../../app/game/engine/types'

const RULES: CaptureRules = { same: false, plus: false, combo: false, wall: false }

function stone(id: string, s: Partial<Stone> = {}): Stone {
  return {
    id,
    elementId: null,
    spikeUp: s.spikeUp ?? 1,
    spikeDown: s.spikeDown ?? 1,
    spikeLeft: s.spikeLeft ?? 1,
    spikeRight: s.spikeRight ?? 1,
  }
}

// Build a 2-move timeline: B places a weak stone, then A captures it.
function sampleTimeline(): TimelineEntry[] {
  const base = createMatch({
    size: 3,
    hands: { A: [stone('a', { spikeRight: 5 })], B: [stone('b', { spikeLeft: 3 })] },
    rules: RULES,
    startingPlayer: 'B',
  })
  const t0: TimelineEntry = { state: base, events: [] }
  const afterB = placeStone(base, 0, 1, 0)
  const t1: TimelineEntry = { state: afterB, events: [] }
  const { state: afterA, events } = placeStoneWithEvents(afterB, 0, 0, 0)
  const t2: TimelineEntry = { state: afterA, events }
  return [t0, t1, t2]
}

describe('matchHighlights', () => {
  it('reports the biggest capture and its mover', () => {
    const h = matchHighlights(sampleTimeline())
    expect(h.biggestCapture).toBe(1)
    expect(h.biggestBy).toBe('A')
    expect(h.same).toBe(0)
    expect(h.plus).toBe(0)
    expect(h.combo).toBe(0)
  })

  it('returns zeros for an empty/initial-only timeline', () => {
    const base = createMatch({ size: 3, hands: { A: [], B: [] }, rules: RULES })
    const h = matchHighlights([{ state: base, events: [] }])
    expect(h).toEqual({ biggestCapture: 0, biggestBy: null, same: 0, plus: 0, combo: 0 })
  })
})

describe('buildCaptureInfo', () => {
  it('maps each captured cell to its last capture type and mover', () => {
    const info = buildCaptureInfo(sampleTimeline())
    expect(info['1-0']).toEqual({ type: 'basic', by: 'A' })
  })
})
