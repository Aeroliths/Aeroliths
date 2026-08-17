export interface CurveEntry {
  level: number
  xpRequired: number
}

/** The level an XP total buys, given the configured curve. */
export function levelForXp(xp: number, curve: CurveEntry[]): number {
  let reached = 1
  for (const entry of curve) {
    if (xp >= entry.xpRequired && entry.level > reached) reached = entry.level
  }
  return reached
}

/**
 * Every level gained between two points, so a match that jumps several tiers
 * pays out all of them rather than only the last. Returns nothing when the
 * level would drop: a harsher curve must never demote or claw rewards back.
 */
export function levelsCrossed(previousLevel: number, newLevel: number): number[] {
  const crossed: number[] = []
  for (let level = previousLevel + 1; level <= newLevel; level++) crossed.push(level)
  return crossed
}

/**
 * Checks the curve as a whole. Each row can be individually sensible while the
 * sequence is broken, and a broken curve stalls progression for every player at
 * once, so this runs before anything is written.
 */
export function validateCurve(curve: CurveEntry[]): string | null {
  if (curve.length === 0) return null

  const sorted = [...curve].sort((a, b) => a.level - b.level)

  const seen = new Set<number>()
  for (const entry of sorted) {
    if (seen.has(entry.level)) return `Duplicate level: ${entry.level}`
    seen.add(entry.level)
  }

  if (sorted[0]!.level !== 1) return 'The curve must start at level 1'
  if (sorted[0]!.xpRequired !== 0) return 'Level 1 must require zero XP'

  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1]!
    const current = sorted[i]!
    if (current.level !== previous.level + 1) {
      return `Levels must be consecutive: gap between ${previous.level} and ${current.level}`
    }
    if (current.xpRequired <= previous.xpRequired) {
      return `XP thresholds must increase: level ${current.level} does not exceed level ${previous.level}`
    }
  }

  return null
}
