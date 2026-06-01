import { describe, it, expect } from 'vitest'
import { toStone, toElementGraph } from '~/app/game/engine/adapters'

describe('toStone', () => {
  it('maps a lithos API record to an engine stone, including the element name', () => {
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
      element: { id: 'fire', name: 'Fire' },
    }

    expect(toStone(litho)).toEqual({
      id: 'l1',
      name: 'Ember',
      sprite: '/img/ember.png',
      elementId: 'fire',
      elementName: 'Fire',
      spikeUp: 4,
      spikeDown: 1,
      spikeLeft: 2,
      spikeRight: 3,
    })
  })

  it('keeps element fields null when the lithos has no element', () => {
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
      element: null,
    }

    const stone = toStone(litho)
    expect(stone.elementId).toBeNull()
    expect(stone.elementName).toBeNull()
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
