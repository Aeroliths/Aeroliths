export type MatchResult = 'win' | 'loss' | 'draw'
export type BotDifficulty = 'easy' | 'medium' | 'hard'

export interface XpInput {
  result: MatchResult
  difficulty: BotDifficulty
  size: number
}

/**
 * Every balance figure lives here, in one readable place, ready to move into
 * the admin table in the next sub-lot.
 */
const BASE_BY_RESULT: Record<MatchResult, number> = {
  win: 100,
  draw: 40,
  // A loss still pays: otherwise the cheapest way to earn is to farm the easy
  // bot, and taking on the hard one becomes a punishment.
  loss: 15,
}

// Deliberately gentle. Difficulty is the one field the server cannot verify,
// so it must not be where the money is.
const MULTIPLIER_BY_DIFFICULTY: Record<BotDifficulty, number> = {
  easy: 1,
  medium: 1.25,
  hard: 1.5,
}

const MULTIPLIER_BY_SIZE: Record<number, number> = {
  3: 1,
  4: 1.15,
  5: 1.3,
}

/** Ceiling on what a single day can yield, whatever the client claims. */
export const DAILY_XP_CAP = 600

export function computeXp({ result, difficulty, size }: XpInput): number {
  const base = BASE_BY_RESULT[result]
  const difficultyMultiplier = MULTIPLIER_BY_DIFFICULTY[difficulty]
  const sizeMultiplier = MULTIPLIER_BY_SIZE[size] ?? 1
  return Math.round(base * difficultyMultiplier * sizeMultiplier)
}

/** What is actually granted once today's earnings are taken into account. */
export function applyDailyCap(earned: number, awardedToday: number): number {
  const remaining = DAILY_XP_CAP - awardedToday
  if (remaining <= 0) return 0
  return Math.min(earned, remaining)
}
