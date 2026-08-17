import { ref, watch, onBeforeUnmount, type Ref } from 'vue'
import { chooseMove, type BotDifficulty } from '~/game/bot'
import type { MatchState, Player, Stone } from '~/game/engine/types'

/** The bot always sits in the second seat; the human keeps player A. */
export const BOT_PLAYER: Player = 'B'

/** Long enough for the reply to read as a move rather than a glitch. */
const THINKING_DELAY_MS = 450

export interface BotOpponentOptions {
  match: Ref<MatchState | null>
  /** False while the opponent is a human. */
  enabled: Ref<boolean>
  difficulty: Ref<BotDifficulty>
  /** Public catalog, used to model the hidden human hand. */
  catalog: Ref<Stone[]>
  /** Stone drawn by the Chaos rule, or null. */
  forcedHandIndex: Ref<number | null>
  /** True while a replay is running: the bot must stay out of it. */
  suspended: Ref<boolean>
  onMove: (handIndex: number, x: number, y: number) => void
}

/**
 * Plays for the bot whenever the turn comes round to it. The move is computed
 * after a short delay so the player sees it happen, and any pending move is
 * dropped when the position changes underneath, which is what undo, reset and
 * replay all do.
 */
export function useBotOpponent(options: BotOpponentOptions) {
  const thinking = ref(false)
  let pending: ReturnType<typeof setTimeout> | null = null

  function cancel() {
    if (pending !== null) {
      clearTimeout(pending)
      pending = null
    }
    thinking.value = false
  }

  function itIsTheBotsTurn(): boolean {
    const state = options.match.value
    return (
      options.enabled.value &&
      !options.suspended.value &&
      state !== null &&
      state.status === 'playing' &&
      state.current === BOT_PLAYER
    )
  }

  watch(
    () => [
      options.match.value?.current,
      options.match.value?.status,
      options.match.value?.lastMove,
      options.enabled.value,
      options.suspended.value,
    ],
    () => {
      cancel()
      if (!itIsTheBotsTurn()) return

      thinking.value = true
      pending = setTimeout(() => {
        pending = null
        thinking.value = false
        // Re-check: the position may have moved on during the delay.
        if (!itIsTheBotsTurn()) return

        const move = chooseMove(options.match.value!, {
          difficulty: options.difficulty.value,
          catalog: options.catalog.value,
          forcedHandIndex: options.forcedHandIndex.value,
        })
        if (move) options.onMove(move.handIndex, move.x, move.y)
      }, THINKING_DELAY_MS)
    },
    { immediate: true, deep: true },
  )

  onBeforeUnmount(cancel)

  return { thinking }
}
