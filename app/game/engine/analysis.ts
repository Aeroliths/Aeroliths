import type { CaptureEvent, Player, TimelineEntry } from './types'

/** The player who made the move that produced this entry, or null for the initial entry. */
function moverOf(entry: TimelineEntry): Player | null {
  const lm = entry.state.lastMove
  if (!lm) return null
  return entry.state.board[lm.y]?.[lm.x]?.owner ?? null
}

export function matchHighlights(timeline: TimelineEntry[]): {
  biggestCapture: number
  biggestBy: Player | null
  same: number
  plus: number
  combo: number
} {
  let biggestCapture = 0
  let biggestBy: Player | null = null
  let same = 0
  let plus = 0
  let combo = 0

  for (const entry of timeline) {
    if (entry.events.length > biggestCapture) {
      biggestCapture = entry.events.length
      biggestBy = moverOf(entry)
    }
    for (const e of entry.events) {
      if (e.type === 'same') same++
      else if (e.type === 'plus') plus++
      else if (e.type === 'combo') combo++
    }
  }

  return { biggestCapture, biggestBy, same, plus, combo }
}

export function buildCaptureInfo(
  timeline: TimelineEntry[],
): Record<string, { type: CaptureEvent['type']; by: Player }> {
  const info: Record<string, { type: CaptureEvent['type']; by: Player }> = {}
  for (const entry of timeline) {
    const by = moverOf(entry)
    if (!by) continue
    for (const e of entry.events) {
      info[`${e.x}-${e.y}`] = { type: e.type, by }
    }
  }
  return info
}
