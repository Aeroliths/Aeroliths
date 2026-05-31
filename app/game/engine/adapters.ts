import type { ElementGraph, Stone } from './types'

/** Shape of a lithos record as returned by `/api/lithos`. */
export interface LithosRecord {
  id: string
  name: string
  sprite: string
  spikeUp: number
  spikeDown: number
  spikeLeft: number
  spikeRight: number
  elementId: string | null
}

/** Shape of an element record as returned by `/api/elements`. */
export interface ElementRecord {
  id: string
  strengthsFrom: { strongAgainst: { id: string } }[]
}

export function toStone(litho: LithosRecord): Stone {
  return {
    id: litho.id,
    name: litho.name,
    sprite: litho.sprite,
    elementId: litho.elementId,
    spikeUp: litho.spikeUp,
    spikeDown: litho.spikeDown,
    spikeLeft: litho.spikeLeft,
    spikeRight: litho.spikeRight,
  }
}

export function toElementGraph(elements: ElementRecord[]): ElementGraph {
  const strongAgainst: Record<string, string[]> = {}
  for (const element of elements) {
    strongAgainst[element.id] = element.strengthsFrom.map((s) => s.strongAgainst.id)
  }
  return { strongAgainst }
}
