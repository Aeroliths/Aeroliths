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
  /** Element icon/logo sprite URL, for display. Null when elementless. */
  elementSprite?: string | null
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

export interface CaptureRules {
  same: boolean
  plus: boolean
  combo: boolean
  /** Wall: board edges count as a value-10 neighbour for Same/Plus. */
  wall: boolean
}

/** How the active player draws/selects a stone each turn. */
export type HandRule = 'none' | 'order' | 'chaos'

export type Edge = 'up' | 'down' | 'left' | 'right'

export interface CaptureEvent {
  x: number
  y: number
  type: 'basic' | 'same' | 'plus' | 'combo'
  /** Edge of the duel that caused the capture (for UI highlighting). */
  edge: Edge
  /** Element bonus applied to the attack; only meaningful for `basic`. */
  elementDelta: -1 | 0 | 1
}

export interface MatchConfig {
  /** Board is size x size. */
  size: number
  hands: Record<Player, Stone[]>
  elements?: ElementGraph
  startingPlayer?: Player
  rules?: CaptureRules
  /** Per-cell element id (boardElements[y][x]); null = neutral. */
  boardElements?: (string | null)[][]
  /** Seconds per turn; 0 = no timer. */
  turnSeconds?: number
  /** Order/Chaos hand constraint; 'none' = free choice. */
  handRule?: HandRule
  /** Both hands visible to both players. */
  openHands?: boolean
  /** Replay a fresh round from controlled stones when a game ends in a draw. */
  suddenDeath?: boolean
}

export interface MatchState {
  size: number
  /** board[y][x] */
  board: Cell[][]
  hands: Record<Player, Stone[]>
  current: Player
  elements: ElementGraph
  rules: CaptureRules
  /** Per-cell element id (boardElements[y][x]); null = neutral. */
  boardElements: (string | null)[][]
  /** Seconds per turn; 0 = no timer. */
  turnSeconds: number
  /** Order/Chaos hand constraint; 'none' = free choice. */
  handRule: HandRule
  /** Both hands visible to both players. */
  openHands: boolean
  /** Replay a fresh round from controlled stones when a game ends in a draw. */
  suddenDeath: boolean
  lastMove: { x: number; y: number } | null
  status: 'playing' | 'finished'
  winner: Player | 'draw' | null
}

/** One move's resulting state plus the captures it produced (UI history). */
export interface TimelineEntry {
  state: MatchState
  events: CaptureEvent[]
}
