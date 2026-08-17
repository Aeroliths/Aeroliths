import { ref } from 'vue'
import type { MatchState } from '~/game/engine/types'

const SAVE_KEY = 'aeroliths.localMatch'

/**
 * Keeps the local match in localStorage so a reload can offer to resume it.
 * Knows nothing about the match lifecycle: the caller decides when to save.
 */
export function useMatchPersistence() {
  /** A match found on disk that is still in progress, or null. */
  const resumable = ref<MatchState | null>(null)

  function save(state: MatchState) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state))
    } catch {
      /* quota */
    }
  }

  function clear() {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {
      /* ignore */
    }
  }

  /** Look for a saved match and expose it through `resumable`. */
  function check() {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as MatchState
      if (saved && saved.status === 'playing') resumable.value = saved
    } catch {
      clear()
    }
  }

  /** Turn down the offer: forget the saved match for good. */
  function discard() {
    resumable.value = null
    clear()
  }

  return { resumable, save, clear, check, discard }
}
