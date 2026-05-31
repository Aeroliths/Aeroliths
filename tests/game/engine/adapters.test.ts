import { describe, it, expect } from 'vitest'
import { toStone, toElementGraph } from '~/app/game/engine/adapters'

describe('toStone', () => {
  it('maps a lithos API record to an engine stone', () => {
    const litho = {
      id: 'l1',
      name: 'Ember',
      sprite: '/img/ember.png',
      spikeUp: 4,
      spikeDown: 1,
      spikeLeft: 2,
      spikeRight: 3,
      rarity: 'common',
      elementId: 'fire',
    }

    expect(toStone(litho)).toEqual({
      id: 'l1',
      name: 'Ember',
      sprite: '/img/ember.png',
      elementId: 'fire',
      spikeUp: 4,
      spikeDown: 1,
      spikeLeft: 2,
      spikeRight: 3,
    })
  })

  it('keeps elementId null when the lithos has no element', () => {
    const litho = {
      id: 'l2',
      name: 'Plain',
      sprite: '',
      spikeUp: 1,
      spikeDown: 1,
      spikeLeft: 1,
      spikeRight: 1,
      rarity: 'common',
      elementId: null,
    }

    expect(toStone(litho).elementId).toBeNull()
  })
})

describe('toElementGraph', () => {
  it('builds a strongAgainst map from the elements API records', () => {
    const elements = [
      { id: 'fire', strengthsFrom: [{ strongAgainst: { id: 'air' } }, { strongAgainst: { id: 'earth' } }] },
      { id: 'water', strengthsFrom: [{ strongAgainst: { id: 'fire' } }] },
      { id: 'air', strengthsFrom: [] },
    ]

    expect(toElementGraph(elements)).toEqual({
      strongAgainst: {
        fire: ['air', 'earth'],
        water: ['fire'],
        air: [],
      },
    })
  })
})
