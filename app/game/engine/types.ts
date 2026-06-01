// Pure game-engine types. No Vue, Pinia, Prisma or network imports allowed here:
// this module is reused as-is by the local hotseat UI, the bot, and (later) the
// server-authoritative online mode.

export type Player = 'A' | 'B'

export interface Stone {
  id: string
  name?: string
  sprite?: string
  /** Element id, or null for elementless stones. Drives the +1/-1 combat bonus. */
  elementId: string | null
  /** Human-readable element name, for display (tooltips). Null when elementless. */
  elementName?: string | null
  spikeUp: number
  spikeDown: number
  spikeLeft: number
  spikeRight: number
}

export interface PlacedStone {
  stone: Stone
  owner: Player
}

/** A board cell: a placed stone or null when empty. */
export type Cell = PlacedStone | null

/**
 * Element advantage graph. `strongAgainst[x]` lists the element ids that element
 * `x` beats. Weakness is the inverse (x is weak against y iff y is strong
 * against x), so a single map is enough.
 */
export interface ElementGraph {
  strongAgainst: Record<string, string[]>
}

export interface MatchConfig {
  /** Board is size x size. */
  size: number
  hands: Record<Player, Stone[]>
  elements?: ElementGraph
  startingPlayer?: Player
}

export interface MatchState {
  size: number
  /** board[y][x] */
  board: Cell[][]
  hands: Record<Player, Stone[]>
  current: Player
  elements: ElementGraph
  status: 'playing' | 'finished'
  winner: Player | 'draw' | null
}
