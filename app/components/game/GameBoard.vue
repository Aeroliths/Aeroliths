<template>
  <div class="game-board">
    <!-- Status bar -->
    <div class="status-bar">
      <div class="score" :class="{ active: state.current === 'A' && state.status === 'playing' }">
        <span class="player-dot dot-a" />
        <span class="player-label">Player 1</span>
        <span class="score-value">{{ score.A }}</span>
      </div>

      <div class="status-center">
        <span v-if="state.status === 'playing'" class="turn">
          {{ state.current === 'A' ? 'Player 1' : 'Player 2' }} to play
        </span>
      </div>

      <div class="score" :class="{ active: state.current === 'B' && state.status === 'playing' }">
        <span class="score-value">{{ score.B }}</span>
        <span class="player-label">Player 2</span>
        <span class="player-dot dot-b" />
      </div>
    </div>

    <!-- Board grid -->
    <div
      class="grid"
      :style="{ gridTemplateColumns: `repeat(${state.size}, 1fr)` }"
    >
      <template v-for="(row, y) in state.board" :key="y">
        <button
          v-for="(cell, x) in row"
          :key="`${x}-${y}`"
          class="cell"
          :class="[
            cell ? `owner-${cell.owner}` : 'empty',
            {
              placeable: !cell && canPlace,
              capturing: captured.has(`${x}-${y}`),
              'preview-capture': previewKeys.has(`${x}-${y}`),
            },
          ]"
          :data-cx="x"
          :data-cy="y"
          :disabled="!!cell || !canPlace || state.status === 'finished'"
          @mouseenter="showPreview(x, y)"
          @mouseleave="clearPreview"
          @click="$emit('placeAt', x, y)"
        >
          <GameStone v-if="cell" :stone="cell.stone" :owner="cell.owner" />
        </button>
      </template>
    </div>

    <!-- Current player's hand -->
    <div v-if="state.status === 'playing'" class="hand">
      <div class="hand-label">{{ state.current === 'A' ? 'Player 1' : 'Player 2' }} hand</div>
      <div class="hand-cards">
        <button
          v-for="(stone, i) in state.hands[state.current]"
          :key="stone.id + '-' + i"
          class="hand-card"
          :class="[
            `owner-${state.current}`,
            { selected: i === selectedHandIndex, dragging: drag?.index === i },
          ]"
          @pointerdown="onPointerDown($event, i)"
          @dragstart.prevent
        >
          <GameStone :stone="stone" :owner="state.current" />
        </button>
        <div v-if="state.hands[state.current].length === 0" class="empty-hand">No Lithos left</div>
      </div>
    </div>

    <!-- Floating Lithos that follows the cursor while dragging -->
    <Teleport to="body">
      <div
        v-if="drag"
        class="drag-ghost"
        :style="{ left: `${drag.x}px`, top: `${drag.y}px` }"
      >
        <div class="ghost-card" :class="`owner-${state.current}`">
          <GameStone :stone="drag.stone" :owner="state.current" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import GameStone from './GameStone.vue'
import { getScore, previewCaptures } from '~/game/engine/match'
import type { MatchState, Stone } from '~/game/engine/types'

const props = defineProps<{
  state: MatchState
  selectedHandIndex: number | null
}>()

const emit = defineEmits<{
  (e: 'selectHand', index: number): void
  (e: 'placeAt', x: number, y: number): void
}>()

const score = computed(() => getScore(props.state))
const canPlace = computed(
  () => props.selectedHandIndex !== null && props.state.status === 'playing'
)

/* ---------- Hover preview of would-be captures ---------- */

const previewKeys = ref<Set<string>>(new Set())

function showPreview(x: number, y: number) {
  if (props.selectedHandIndex === null || props.state.status !== 'playing') {
    previewKeys.value = new Set()
    return
  }
  const events = previewCaptures(props.state, props.selectedHandIndex, x, y)
  previewKeys.value = new Set(events.map((e) => `${e.x}-${e.y}`))
}

function clearPreview() {
  previewKeys.value = new Set()
}

/* ---------- Custom drag & drop (so the full Lithos follows the cursor) ---------- */

interface DragState {
  index: number
  stone: Stone
  x: number
  y: number
}

const drag = ref<DragState | null>(null)
const DRAG_THRESHOLD = 6
let startX = 0
let startY = 0
let pendingIndex: number | null = null

function onPointerDown(e: PointerEvent, index: number) {
  if (props.state.status !== 'playing') return
  e.preventDefault()
  startX = e.clientX
  startY = e.clientY
  pendingIndex = index
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerCancel)
}

function onPointerMove(e: PointerEvent) {
  if (pendingIndex === null) return

  if (!drag.value) {
    const moved = Math.hypot(e.clientX - startX, e.clientY - startY)
    if (moved < DRAG_THRESHOLD) return
    const stone = props.state.hands[props.state.current][pendingIndex]
    if (!stone) return
    emit('selectHand', pendingIndex) // enables placeable cells
    drag.value = { index: pendingIndex, stone, x: e.clientX, y: e.clientY }
  } else {
    drag.value.x = e.clientX
    drag.value.y = e.clientY
  }

  const el = document.elementFromPoint(e.clientX, e.clientY)
  const cellEl = el?.closest('[data-cx]') as HTMLElement | null
  if (cellEl) showPreview(Number(cellEl.dataset.cx), Number(cellEl.dataset.cy))
}

function removeDragListeners() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerCancel)
}

function onPointerCancel() {
  removeDragListeners()
  drag.value = null
  pendingIndex = null
  clearPreview()
}

function onPointerUp(e: PointerEvent) {
  removeDragListeners()

  if (drag.value) {
    const target = document.elementFromPoint(e.clientX, e.clientY)
    const cellEl = target?.closest('[data-cx]') as HTMLElement | null
    if (cellEl) {
      const x = Number(cellEl.dataset.cx)
      const y = Number(cellEl.dataset.cy)
      if (!props.state.board[y]?.[x]) emit('placeAt', x, y)
    }
    drag.value = null
  } else if (pendingIndex !== null) {
    // No movement: treat as a click to select the Lithos.
    emit('selectHand', pendingIndex)
  }

  pendingIndex = null
  clearPreview()
}

onBeforeUnmount(removeDragListeners)

/* ---------- Capture animation ---------- */

const captured = ref<Set<string>>(new Set())
let prevOwners: (string | null)[][] = []

watch(
  () => props.state.board,
  (board) => {
    const justCaptured: string[] = []
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        const owner = cell?.owner ?? null
        const before = prevOwners[y]?.[x] ?? null
        // A flip: the cell was owned by someone and now belongs to the other player.
        if (owner && before && owner !== before) justCaptured.push(`${x}-${y}`)
      })
    })

    prevOwners = board.map((row) => row.map((cell) => cell?.owner ?? null))

    if (justCaptured.length > 0) {
      const next = new Set(captured.value)
      justCaptured.forEach((k) => next.add(k))
      captured.value = next
      setTimeout(() => {
        const cleared = new Set(captured.value)
        justCaptured.forEach((k) => cleared.delete(k))
        captured.value = cleared
      }, 600)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.game-board {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: center;
}

/* ---- Status bar ---- */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 520px;
  gap: 1rem;
}

.score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: var(--bg-glass-light);
  border: 1px solid var(--color-border-light);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.score.active {
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
}

.player-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-a { background: var(--owner-a, #3b82f6); }
.dot-b { background: var(--owner-b, #ef4444); }

.player-label {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.score-value {
  font-size: var(--font-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  min-width: 1.2ch;
  text-align: center;
}

.status-center {
  flex: 1;
  text-align: center;
}

.turn {
  font-size: var(--font-base);
  color: var(--color-text-primary);
  font-weight: var(--font-semibold);
}

.result {
  font-size: var(--font-xl);
  font-weight: var(--font-bold);
  color: var(--color-primary, #6366f1);
}

/* ---- Grid ---- */
.grid {
  display: grid;
  gap: 0.5rem;
  width: 100%;
  max-width: 520px;
  aspect-ratio: 1;
  perspective: 700px;
}

.cell {
  position: relative;
  aspect-ratio: 1;
  min-width: 0;
  min-height: 0;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  background: var(--bg-glass-light);
  padding: 0;
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* The Lithos fills the cell but is taken out of flow, so its image size can
   never feed back into the cell/row height. This keeps every cell an exact
   square (from aspect-ratio) whether or not it holds a stone — the board
   stays the same size before and after a Lithos is placed. */
.cell > * {
  position: absolute;
  inset: 0;
}

.cell.placeable {
  cursor: pointer;
  border-style: dashed;
  border-color: var(--color-primary, #6366f1);
}

.cell.placeable:hover {
  background: rgba(99, 102, 241, 0.12);
}

.cell.preview-capture {
  box-shadow: inset 0 0 0 2px #22c55e, 0 0 12px rgba(34, 197, 94, 0.45);
}

.owner-A { border-color: var(--owner-a, #3b82f6); }
.owner-B { border-color: var(--owner-b, #ef4444); }

/* Capture: the Lithos flips over to its new owner with a glow. */
.cell.capturing {
  z-index: 1;
  animation: lithos-captured 0.6s ease;
}

@keyframes lithos-captured {
  0% { transform: rotateY(0deg) scale(1); box-shadow: none; }
  50% { transform: rotateY(180deg) scale(1.14); box-shadow: 0 0 22px rgba(99, 102, 241, 0.75); }
  100% { transform: rotateY(360deg) scale(1); box-shadow: none; }
}

/* ---- Hand ---- */
.hand {
  width: 100%;
  max-width: 520px;
}

.hand-label {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.hand-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.hand-card {
  width: 76px;
  height: 76px;
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-border-light);
  background: var(--bg-glass-medium);
  padding: 0;
  cursor: grab;
  touch-action: none;
  transition: transform 0.12s, border-color 0.12s, opacity 0.12s;
}

.hand-card:active { cursor: grabbing; }
.hand-card:hover { transform: translateY(-3px); }
.hand-card.selected { border-color: var(--color-primary, #6366f1); transform: translateY(-3px); }
.hand-card.owner-A { border-color: var(--owner-a, #3b82f6); }
.hand-card.owner-B { border-color: var(--owner-b, #ef4444); }
.hand-card.selected { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3); }

/* The picked-up card is dimmed in place while its clone follows the cursor. */
.hand-card.dragging { opacity: 0.35; transform: none; }

.empty-hand {
  color: var(--color-text-muted);
  font-size: var(--font-sm);
  padding: 0.5rem;
}

/* ---- Drag ghost ---- */
.drag-ghost {
  position: fixed;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2000;
}

.ghost-card {
  width: 86px;
  height: 86px;
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-primary, #6366f1);
  background: var(--bg-glass-medium);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.45);
  animation: lithos-pickup 0.16s ease-out;
}

.ghost-card.owner-A { border-color: var(--owner-a, #3b82f6); }
.ghost-card.owner-B { border-color: var(--owner-b, #ef4444); }

@keyframes lithos-pickup {
  0% { transform: scale(0.7) rotate(-6deg); opacity: 0.4; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .cell.capturing { animation: none; box-shadow: 0 0 18px rgba(99, 102, 241, 0.6); }
  .ghost-card { animation: none; }
}
</style>
