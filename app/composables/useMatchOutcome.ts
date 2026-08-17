import { ref, computed, watch, type Ref } from 'vue'
import { getScore } from '~/game/engine/match'
import { matchHighlights, buildCaptureInfo } from '~/game/engine/analysis'
import type { MatchState, TimelineEntry } from '~/game/engine/types'

/** Duration of the end-of-game score count-up. */
const SCORE_ANIMATION_MS = 600

/**
 * Everything the end-of-game panel reads: the final score, the result label,
 * the notable captures, and a score that counts up once the game is over.
 */
export function useMatchOutcome(match: Ref<MatchState | null>, timeline: Ref<TimelineEntry[]>) {
  const { t } = useI18n()

  const finalScore = computed(() => (match.value ? getScore(match.value) : { A: 0, B: 0 }))

  const resultTitle = computed(() => {
    const winner = match.value?.winner
    if (winner === 'draw') return t('play.localMatch.draw')
    if (winner === 'A') return t('play.localMatch.player1Wins')
    if (winner === 'B') return t('play.localMatch.player2Wins')
    return ''
  })

  const resultClass = computed(() => {
    const winner = match.value?.winner
    return winner === 'draw' ? 'is-draw' : `is-${winner}`
  })

  const highlights = computed(() => matchHighlights(timeline.value))
  const captureInfo = computed(() => buildCaptureInfo(timeline.value))

  /** The score shown in the end panel, counting up from zero. */
  const animScore = ref({ A: 0, B: 0 })

  watch(
    () => match.value?.status,
    (status) => {
      if (status !== 'finished') return
      const target = finalScore.value
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      if (reduce) {
        animScore.value = { ...target }
        return
      }
      const startedAt = performance.now()
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / SCORE_ANIMATION_MS)
        animScore.value = { A: Math.round(target.A * progress), B: Math.round(target.B * progress) }
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    },
  )

  return { finalScore, resultTitle, resultClass, highlights, captureInfo, animScore }
}
