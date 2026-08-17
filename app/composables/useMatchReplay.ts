import { ref, computed, onBeforeUnmount, type Ref } from 'vue'
import type { MatchState, TimelineEntry } from '~/game/engine/types'

/** One timeline step per second while the replay plays on its own. */
const AUTO_STEP_MS = 1000

/**
 * Walks the recorded timeline of a finished match. `state` and `events` follow
 * the cursor, so the board can be rendered read-only from them.
 *
 * Stopping the turn clock before starting a replay is the caller's job: this
 * composable only knows about the timeline.
 */
export function useMatchReplay(timeline: Ref<TimelineEntry[]>, match: Ref<MatchState | null>) {
  const replaying = ref(false)
  const index = ref(0)
  let autoTimer: ReturnType<typeof setInterval> | null = null

  const state = computed(() => timeline.value[index.value]?.state ?? match.value)
  const events = computed(() => timeline.value[index.value]?.events ?? [])

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer)
      autoTimer = null
    }
  }

  function start() {
    replaying.value = true
    index.value = 0
  }

  function stop() {
    replaying.value = false
    stopAuto()
  }

  function step(delta: number) {
    index.value = Math.min(timeline.value.length - 1, Math.max(0, index.value + delta))
  }

  /** Play or pause the automatic walk through the timeline. */
  function auto() {
    if (autoTimer) {
      stopAuto()
      return
    }
    autoTimer = setInterval(() => {
      if (index.value >= timeline.value.length - 1) {
        stopAuto()
        return
      }
      index.value += 1
    }, AUTO_STEP_MS)
  }

  onBeforeUnmount(stopAuto)

  return { replaying, index, state, events, start, stop, step, auto }
}
