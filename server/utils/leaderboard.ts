export interface BattleTally {
  userId: string
  wins: number
  losses: number
  draws: number
}

/** Share of played matches that ended in a win, as a whole percentage. */
export function winRate(tally: BattleTally): number {
  const played = tally.wins + tally.losses + tally.draws
  if (played === 0) return 0
  return Math.round((tally.wins / played) * 100)
}

/**
 * Highest XP first, ties broken on the username.
 *
 * The level is derived from the XP, so ordering on XP gives the same ranking
 * with finer granularity. The tie-break is what keeps two identical requests
 * from returning two different orders.
 */
export function rankByXp<T extends { xp: number; username: string }>(players: T[]): T[] {
  return [...players].sort((a, b) => b.xp - a.xp || a.username.localeCompare(b.username))
}
