import type { MatchState, Player, Stone } from '~/game/engine/types'

function spikeSum(stone: Stone): number {
  return stone.spikeUp + stone.spikeDown + stone.spikeLeft + stone.spikeRight
}

/**
 * The hand the bot is allowed to assume its opponent holds.
 *
 * With open hands it is the real one, because the human sees it too. Otherwise
 * the bot knows only two public facts: how many stones are left, which anyone
 * can count from the board, and what the shared catalog contains, since both
 * players draw from it on screen. It then assumes the worst plausible case, the
 * strongest stone in the catalog repeated, so it never gets lucky by
 * underestimating an opponent it cannot see.
 *
 * An empty catalog yields an empty hand: the search stops at that ply rather
 * than inventing data.
 */
export function modelOpponentHand(
  state: MatchState,
  opponent: Player,
  catalog: Stone[],
): Stone[] {
  const real = state.hands[opponent]
  if (state.openHands) return real
  if (catalog.length === 0) return []

  const strongest = catalog.reduce((best, stone) =>
    spikeSum(stone) > spikeSum(best) ? stone : best,
  )
  return Array.from({ length: real.length }, () => strongest)
}
