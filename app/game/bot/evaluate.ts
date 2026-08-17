import { getScore } from '~/game/engine/match'
import type { MatchState, Player } from '~/game/engine/types'

/**
 * One controlled cell outranks any spike advantage. The largest board is 5x5
 * and spikes are small integers, so the spike difference cannot approach this
 * weight and cells always decide first, exactly as decideWinner does.
 */
const CELL_WEIGHT = 100_000

/** Sum of the four spikes of every stone the player controls. */
function spikeTotal(state: MatchState, player: Player): number {
  let total = 0
  for (const row of state.board) {
    for (const cell of row) {
      if (cell && cell.owner === player) {
        total +=
          cell.stone.spikeUp + cell.stone.spikeDown + cell.stone.spikeLeft + cell.stone.spikeRight
      }
    }
  }
  return total
}

/**
 * Score of a position from `player`'s point of view, positive when ahead.
 *
 * Mirrors decideWinner: cells decide, the spike total breaks a tie. The search
 * therefore optimises exactly what the game rewards, rather than a proxy that
 * would drift from the real win condition.
 */
export function evaluate(state: MatchState, player: Player): number {
  const opponent: Player = player === 'A' ? 'B' : 'A'
  const score = getScore(state)
  const cells = score[player]! - score[opponent]!
  const spikes = spikeTotal(state, player) - spikeTotal(state, opponent)
  return cells * CELL_WEIGHT + spikes
}
