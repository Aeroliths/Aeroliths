import { ref } from 'vue'
import type { CaptureRules, HandRule, Player } from '~/game/engine/types'

export interface MatchSubmission {
  difficulty: string
  size: number
  rules: CaptureRules
  handRule: HandRule
  openHands: boolean
  startingPlayer: Player
  boardElements: (string | null)[][]
  /** Lithos identifiers only. The server reads the values from its own tables. */
  hands: Record<Player, string[]>
  moves: { handIndex: number; x: number; y: number }[]
}

/**
 * Sends a finished bot match for validation. Nothing about the outcome is sent:
 * the server replays the moves and decides both the winner and the reward.
 */
export function useMatchSubmission() {
  const lastAward = ref<number | null>(null)
  const cappedToday = ref(false)
  const failed = ref(false)

  async function submit(payload: MatchSubmission) {
    failed.value = false
    try {
      const response = await $fetch<{ data: { xpAwarded: number; cappedToday: boolean } }>(
        '/api/matches',
        { method: 'POST', body: payload },
      )
      lastAward.value = response.data.xpAwarded
      cappedToday.value = response.data.cappedToday
    } catch {
      // A rejected or unreachable submission must never break the end screen:
      // the match was played, only the reward is lost.
      failed.value = true
      lastAward.value = null
      cappedToday.value = false
    }
  }

  return { submit, lastAward, cappedToday, failed }
}
