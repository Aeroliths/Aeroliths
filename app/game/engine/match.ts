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

/** +1 when the stone matches the cell's element, -1 when the cell has an element
 *  the stone doesn't match (or the stone is elementless), 0 on a neutral cell. */
function cellBonus(boardElements: (string | null)[][], x: number, y: number, stone: Stone): -1 | 0 | 1 {
  const cell = boardElements[y]?.[x] ?? null
  if (cell === null) return 0
  return stone.elementId === cell ? 1 : -1
}

const clampDelta = (n: number): -1 | 0 | 1 => (n > 0 ? 1 : n < 0 ? -1 : 0)

function emptyElements(size: number): (string | null)[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null))
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
  const { size, hands, elements, startingPlayer, rules, boardElements, turnSeconds } = config

  return {
    size,
    board: emptyBoard(size),
    hands: { A: [...hands.A], B: [...hands.B] },
    current: startingPlayer ?? 'A',
    elements: elements ?? { strongAgainst: {} },
    rules: rules ?? { same: false, plus: false, combo: false },
    boardElements: boardElements ?? emptyElements(size),
    turnSeconds: turnSeconds ?? 0,
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
  boardElements: (string | null)[][] = [],
): { board: Cell[][]; events: CaptureEvent[] } {
  const size = board.length
  const next = cloneBoard(board)
  const events: CaptureEvent[] = []
  const capturedKeys = new Set<string>()
  const comboQueue: { x: number; y: number }[] = []

  // Snapshot the four sides against the board *before* any flip.
  const sides = ADJACENCY.map(({ dx, dy, attackerSide, defenderSide, edge }) => {
    const nx = x + dx
    const ny = y + dy
    const inBounds = nx >= 0 && ny >= 0 && nx < size && ny < size
    const neighbour = inBounds ? next[ny]![nx] : null
    return {
      nx,
      ny,
      edge,
      neighbour,
      attack: stone[attackerSide],
      defend: neighbour ? neighbour.stone[defenderSide] : null,
    }
  })

  const capture = (nx: number, ny: number, edge: Edge, type: CaptureEvent['type'], delta: -1 | 0 | 1) => {
    const key = `${nx}-${ny}`
    if (capturedKeys.has(key)) return
    const cell = next[ny]![nx]!
    next[ny]![nx] = { ...cell, owner: player }
    capturedKeys.add(key)
    events.push({ x: nx, y: ny, type, edge, elementDelta: delta })
  }

  // Basic (element matchup + cell bonuses apply). The placed stone's cell bonus is constant.
  const attackerCell = cellBonus(boardElements, x, y, stone)
  for (const s of sides) {
    if (!s.neighbour || s.neighbour.owner === player || s.defend === null) continue
    const matchup = elementBonus(elements, stone, s.neighbour.stone)
    const defenderCell = cellBonus(boardElements, s.nx, s.ny, s.neighbour.stone)
    const effAttack = s.attack + matchup + attackerCell
    const effDefend = s.defend + defenderCell
    if (effAttack > effDefend) capture(s.nx, s.ny, s.edge, 'basic', clampDelta(matchup + attackerCell))
  }

  // Same (raw values; allied sides count toward the threshold).
  if (rules.same) {
    const matching = sides.filter((s) => s.neighbour && s.defend === s.attack)
    if (matching.length >= 2) {
      for (const s of matching) {
        if (s.neighbour!.owner !== player) {
          capture(s.nx, s.ny, s.edge, 'same', 0)
          comboQueue.push({ x: s.nx, y: s.ny })
        }
      }
    }
  }

  // Plus (raw values; group sides by edge-sum, capture enemies in any group of size >= 2).
  if (rules.plus) {
    const present = sides.filter((s) => s.neighbour && s.defend !== null)
    const sums = new Map<number, typeof present>()
    for (const s of present) {
      const sum = s.attack + (s.defend as number)
      const list = sums.get(sum) ?? []
      list.push(s)
      sums.set(sum, list)
    }
    for (const group of sums.values()) {
      if (group.length < 2) continue
      for (const s of group) {
        if (s.neighbour!.owner !== player) {
          capture(s.nx, s.ny, s.edge, 'plus', 0)
          comboQueue.push({ x: s.nx, y: s.ny })
        }
      }
    }
  }

  // Combo: each Same/Plus-flipped stone runs a Basic-only pass on its neighbours; cascades.
  if (rules.combo) {
    while (comboQueue.length > 0) {
      const { x: cx, y: cy } = comboQueue.shift()!
      const cell = next[cy]![cx]!
      const cAttackerCell = cellBonus(boardElements, cx, cy, cell.stone)
      for (const { dx, dy, attackerSide, defenderSide, edge } of ADJACENCY) {
        const nx = cx + dx
        const ny = cy + dy
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue
        const neighbour = next[ny]![nx]
        if (!neighbour || neighbour.owner === player) continue
        if (capturedKeys.has(`${nx}-${ny}`)) continue
        const matchup = elementBonus(elements, cell.stone, neighbour.stone)
        const defenderCell = cellBonus(boardElements, nx, ny, neighbour.stone)
        if (cell.stone[attackerSide] + matchup + cAttackerCell > neighbour.stone[defenderSide] + defenderCell) {
          capture(nx, ny, edge, 'combo', clampDelta(matchup + cAttackerCell))
          comboQueue.push({ x: nx, y: ny })
        }
      }
    }
  }

  return { board: next, events }
}

/**
 * Events the given move would produce, without mutating state.
 * Returns [] when the move is illegal (bad index, out of bounds, occupied).
 */
export function previewCaptures(
  state: MatchState,
  handIndex: number,
  x: number,
  y: number,
): CaptureEvent[] {
  const stone = state.hands[state.current][handIndex]
  if (!stone) return []
  if (x < 0 || y < 0 || x >= state.size || y >= state.size) return []
  if (state.board[y]![x]) return []

  const placedBoard = cloneBoard(state.board)
  placedBoard[y]![x] = { owner: state.current, stone }
  const { events } = resolveCaptures(
    placedBoard,
    x,
    y,
    stone,
    state.current,
    state.elements,
    state.rules,
    state.boardElements,
  )
  return events
}

/**
 * Play the hand stone at `handIndex` on cell (x, y) for the current player.
 * Returns the new state and the capture events, leaving the input untouched.
 * Throws on illegal moves.
 */
export function placeStoneWithEvents(
  state: MatchState,
  handIndex: number,
  x: number,
  y: number,
): { state: MatchState; events: CaptureEvent[] } {
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

  const { board, events } = resolveCaptures(placedBoard, x, y, stone, player, state.elements, state.rules, state.boardElements)

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

  return { state: next, events }
}

/** Convenience wrapper returning only the next state. */
export function placeStone(state: MatchState, handIndex: number, x: number, y: number): MatchState {
  return placeStoneWithEvents(state, handIndex, x, y).state
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

/** The starter plays first and so receives one fewer stone on odd boards. */
export function handSizeFor(size: number, player: Player, startingPlayer: Player): number {
  const cells = size * size
  return player === startingPlayer ? Math.floor(cells / 2) : Math.ceil(cells / 2)
}

function spikeTotal(state: MatchState, player: Player): number {
  let total = 0
  for (const row of state.board) {
    for (const cell of row) {
      if (cell && cell.owner === player) {
        total += cell.stone.spikeUp + cell.stone.spikeDown + cell.stone.spikeLeft + cell.stone.spikeRight
      }
    }
  }
  return total
}

export function decideWinner(state: MatchState): Player | 'draw' {
  const { A, B } = getScore(state)
  if (A > B) return 'A'
  if (B > A) return 'B'
  const sa = spikeTotal(state, 'A')
  const sb = spikeTotal(state, 'B')
  if (sa > sb) return 'A'
  if (sb > sa) return 'B'
  return 'draw'
}
