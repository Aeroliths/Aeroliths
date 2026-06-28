import type {
  Cell,
  CaptureEvent,
  CaptureRules,
  Edge,
  ElementGraph,
  MatchState,
  MatchConfig,
  Player,
  Stone,
} from './types'

function isStrongAgainst(elements: ElementGraph, a: string | null, b: string | null): boolean {
  if (!a || !b) return false
  return (elements.strongAgainst[a] ?? []).includes(b)
}

/** Element-adjusted attack value: +1 with the advantage, -1 with the disadvantage. */
function elementBonus(elements: ElementGraph, attacker: Stone, defender: Stone): number {
  let bonus = 0
  if (isStrongAgainst(elements, attacker.elementId, defender.elementId)) bonus += 1
  if (isStrongAgainst(elements, defender.elementId, attacker.elementId)) bonus -= 1
  return bonus
}

/** The four neighbours and which spike of each stone faces the other across the edge. */
const ADJACENCY = [
  { dx: 1, dy: 0, attackerSide: 'spikeRight', defenderSide: 'spikeLeft', edge: 'right' },
  { dx: -1, dy: 0, attackerSide: 'spikeLeft', defenderSide: 'spikeRight', edge: 'left' },
  { dx: 0, dy: -1, attackerSide: 'spikeUp', defenderSide: 'spikeDown', edge: 'up' },
  { dx: 0, dy: 1, attackerSide: 'spikeDown', defenderSide: 'spikeUp', edge: 'down' },
] as const

function emptyBoard(size: number): Cell[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null))
}

function other(player: Player): Player {
  return player === 'A' ? 'B' : 'A'
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)))
}

export function createMatch(config: MatchConfig): MatchState {
  const { size, hands, elements, startingPlayer, rules } = config

  return {
    size,
    board: emptyBoard(size),
    hands: { A: [...hands.A], B: [...hands.B] },
    current: startingPlayer ?? 'A',
    elements: elements ?? { strongAgainst: {} },
    rules: rules ?? { same: false, plus: false, combo: false },
    lastMove: null,
    status: 'playing',
    winner: null,
  }
}

/**
 * Resolve all captures triggered by `stone` placed at (x, y) by `player`.
 * Pure: returns a fresh board plus the capture events. Task 1 = Basic only.
 */
export function resolveCaptures(
  board: Cell[][],
  x: number,
  y: number,
  stone: Stone,
  player: Player,
  elements: ElementGraph,
  rules: CaptureRules,
): { board: Cell[][]; events: CaptureEvent[] } {
  const size = board.length
  const next = cloneBoard(board)
  const events: CaptureEvent[] = []

  for (const { dx, dy, attackerSide, defenderSide, edge } of ADJACENCY) {
    const nx = x + dx
    const ny = y + dy
    if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue

    const neighbour = next[ny]![nx]
    if (!neighbour || neighbour.owner === player) continue

    const delta = elementBonus(elements, stone, neighbour.stone)
    if (stone[attackerSide] + delta > neighbour.stone[defenderSide]) {
      next[ny]![nx] = { ...neighbour, owner: player }
      events.push({ x: nx, y: ny, type: 'basic', edge, elementDelta: delta as -1 | 0 | 1 })
    }
  }

  return { board: next, events }
}

/**
 * Play the hand stone at `handIndex` on cell (x, y) for the current player.
 * Returns a new state, leaving the input untouched. Throws on illegal moves.
 */
export function placeStone(state: MatchState, handIndex: number, x: number, y: number): MatchState {
  const player = state.current
  const hand = state.hands[player]

  const stone = hand[handIndex]
  if (!stone) {
    throw new Error(`No stone at hand index ${handIndex}`)
  }

  if (x < 0 || y < 0 || x >= state.size || y >= state.size) {
    throw new Error(`Coordinates (${x}, ${y}) are off the board`)
  }

  if (state.board[y]![x]) {
    throw new Error(`Cell (${x}, ${y}) is already occupied`)
  }

  const placedBoard = cloneBoard(state.board)
  placedBoard[y]![x] = { owner: player, stone }

  const { board } = resolveCaptures(placedBoard, x, y, stone, player, state.elements, state.rules)

  const hands: Record<Player, typeof hand> = {
    A: [...state.hands.A],
    B: [...state.hands.B],
  }
  hands[player] = hand.filter((_, i) => i !== handIndex)

  const next: MatchState = {
    ...state,
    board,
    hands,
    current: other(player),
    lastMove: { x, y },
  }

  if (isBoardFull(next)) {
    next.status = 'finished'
    next.winner = decideWinner(next)
    next.current = player
  }

  return next
}

/** Cells controlled by each player. */
export function getScore(state: MatchState): Record<Player, number> {
  const score: Record<Player, number> = { A: 0, B: 0 }
  for (const row of state.board) {
    for (const cell of row) {
      if (cell) score[cell.owner] += 1
    }
  }
  return score
}

export function isBoardFull(state: MatchState): boolean {
  return state.board.every((row) => row.every((cell) => cell !== null))
}

function decideWinner(state: MatchState): Player | 'draw' {
  const { A, B } = getScore(state)
  if (A > B) return 'A'
  if (B > A) return 'B'
  return 'draw'
}
