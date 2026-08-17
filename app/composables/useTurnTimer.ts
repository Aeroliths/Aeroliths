import { ref, onBeforeUnmount } from 'vue'

/**
 * Per-turn countdown. `onExpire` fires once when the clock reaches zero, and
 * the timer stops itself first, so the handler is free to start a new turn.
 */
export function useTurnTimer(onExpire: () => void) {
  /** Seconds left in the current turn. */
  const remaining = ref(0)
  let timerId: ReturnType<typeof setInterval> | null = null

  function stop() {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  /** Restart the countdown. A duration of zero or less just stops the clock. */
  function arm(seconds: number) {
    stop()
    if (seconds <= 0) return
    remaining.value = seconds
    timerId = setInterval(() => {
      remaining.value -= 1
      if (remaining.value <= 0) {
        stop()
        onExpire()
      }
    }, 1000)
  }

  onBeforeUnmount(stop)

  return { remaining, arm, stop }
}
