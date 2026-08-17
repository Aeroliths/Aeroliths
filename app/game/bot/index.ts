import { greedyMove, searchMove, type Move } from './search'
import type { MatchState, Stone } from '~/game/engine/types'

export type { Move }

export type BotDifficulty = 'easy' | 'medium' | 'hard'

export interface ChooseMoveOptions {
  difficulty: BotDifficulty
  /** Public catalog, used to model the hidden opponent hand. */
  catalog: Stone[]
  /** Stone drawn by the Chaos rule, or null. */
  forcedHandIndex?: number | null
  /** Overrides the search budget. Tests raise it to remove timing flakiness. */
  timeBudgetMs?: number
}

/** Long enough to look ahead, short enough that a turn never feels stuck. */
const DEFAULT_TIME_BUDGET_MS = 700
const MEDIUM_DEPTH = 2
const HARD_MAX_DEPTH = 6

/** The move the bot plays, or null when it cannot play. */
export function chooseMove(state: MatchState, options: ChooseMoveOptions): Move | null {
  if (state.status !== 'playing') return null

  const forcedHandIndex = options.forcedHandIndex ?? null
  if (options.difficulty === 'easy') return greedyMove(state, forcedHandIndex)

  return searchMove(state, {
    catalog: options.catalog,
    forcedHandIndex,
    maxDepth: options.difficulty === 'medium' ? MEDIUM_DEPTH : HARD_MAX_DEPTH,
    timeBudgetMs: options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS,
  })
}
