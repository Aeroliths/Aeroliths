import { describe, it, expect } from 'vitest'
import { modelOpponentHand } from '~/game/bot/opponent-model'
import { createMatch } from '~/game/engine/match'
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

const catalog = [stone('weak', 1), stone('strong', 9), stone('middling', 5)]

function match(openHands: boolean) {
  return createMatch({
    size: 3,
    hands: { A: [stone('a1', 3), stone('a2', 3)], B: [stone('secret', 7), stone('other', 2)] },
    openHands,
  })
}

describe('modelOpponentHand', () => {
  it('returns the real hand when hands are open', () => {
    const state = match(true)

    expect(modelOpponentHand(state, 'B', catalog)).toEqual(state.hands.B)
  })

  it('keeps the hand size but never the hidden contents', () => {
    const state = match(false)

    const modelled = modelOpponentHand(state, 'B', catalog)

    expect(modelled).toHaveLength(state.hands.B.length)
    expect(modelled.map((s) => s.id)).not.toContain('secret')
  })

  it('assumes the strongest stone in the catalog', () => {
    const state = match(false)

    const modelled = modelOpponentHand(state, 'B', catalog)

    expect(modelled.every((s) => s.id === 'strong')).toBe(true)
  })

  it('returns an empty hand when the catalog is empty', () => {
    const state = match(false)

    expect(modelOpponentHand(state, 'B', [])).toEqual([])
  })
})
