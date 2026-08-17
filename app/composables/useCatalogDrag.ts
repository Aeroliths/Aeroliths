import { ref, onBeforeUnmount } from 'vue'
import type { Player, Stone } from '~/game/engine/types'

export interface CatalogDrag {
  stone: Stone
  x: number
  y: number
}

/** Pointer travel below this many pixels counts as a click, not a drag. */
const DRAG_THRESHOLD = 6

/**
 * Drag a stone from the shared catalog onto a player column. Same pointer
 * pattern as the board: a Teleported ghost follows the cursor and the drop
 * target is resolved with document.elementFromPoint, so a column only has to
 * carry a data-hand-owner attribute to be droppable.
 *
 * `onDrop` receives the column the pointer was released over. Refusing a drop
 * (a full hand, for instance) is the caller's decision.
 */
export function useCatalogDrag(onDrop: (player: Player, stone: Stone) => void) {
  const drag = ref<CatalogDrag | null>(null)
  /** Column currently under the cursor, for the drop-target highlight. */
  const dragOverPlayer = ref<Player | null>(null)

  let startX = 0
  let startY = 0
  let pendingStone: Stone | null = null

  function playerAtPoint(x: number, y: number): Player | null {
    const zone = document.elementFromPoint(x, y)?.closest('[data-hand-owner]') as HTMLElement | null
    const owner = zone?.dataset.handOwner
    return owner === 'A' || owner === 'B' ? owner : null
  }

  function onPointerMove(e: PointerEvent) {
    if (!pendingStone) return
    if (!drag.value) {
      const moved = Math.hypot(e.clientX - startX, e.clientY - startY)
      if (moved < DRAG_THRESHOLD) return
      drag.value = { stone: pendingStone, x: e.clientX, y: e.clientY }
    } else {
      drag.value.x = e.clientX
      drag.value.y = e.clientY
    }
    dragOverPlayer.value = playerAtPoint(e.clientX, e.clientY)
  }

  function removeDragListeners() {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerCancel)
  }

  function endDrag() {
    removeDragListeners()
    drag.value = null
    dragOverPlayer.value = null
    pendingStone = null
  }

  function onPointerCancel() {
    endDrag()
  }

  function onPointerUp(e: PointerEvent) {
    if (drag.value && pendingStone) {
      const player = playerAtPoint(e.clientX, e.clientY)
      if (player) onDrop(player, pendingStone)
    }
    endDrag()
  }

  function onCatalogPointerDown(e: PointerEvent, stone: Stone) {
    e.preventDefault()
    startX = e.clientX
    startY = e.clientY
    pendingStone = stone
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
  }

  onBeforeUnmount(removeDragListeners)

  return { drag, dragOverPlayer, onCatalogPointerDown }
}
