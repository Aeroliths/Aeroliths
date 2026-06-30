<template>
  <div class="local-match">
    <!-- ========== SETUP ========== -->
    <div v-if="phase === 'setup'" class="setup">
      <div class="setup-controls">
        <label class="size-picker">
          Board size
          <select v-model.number="size">
            <option :value="3">3 x 3</option>
            <option :value="4">4 x 4</option>
            <option :value="5">5 x 5</option>
          </select>
        </label>
        <div class="rule-toggles">
          <label><input type="checkbox" v-model="rules.same" /> Same</label>
          <label><input type="checkbox" v-model="rules.plus" /> Plus</label>
          <label><input type="checkbox" v-model="rules.combo" /> Combo</label>
          <label><input type="checkbox" v-model="elementalCells" /> Elemental cells</label>
        </div>
        <label class="size-picker">
          First player
          <select v-model="startingChoice">
            <option value="random">Random</option>
            <option value="A">Player 1</option>
            <option value="B">Player 2</option>
          </select>
        </label>
        <label class="size-picker">
          Turn timer
          <select v-model.number="turnSeconds">
            <option :value="0">Off</option>
            <option :value="10">10s</option>
            <option :value="20">20s</option>
            <option :value="30">30s</option>
          </select>
        </label>
      </div>

      <div class="hand-modes">
        <button class="ghost-btn sm" @click="fillRandom">Random</button>
        <button class="ghost-btn sm" @click="fillMirror">Mirror</button>
        <button class="ghost-btn sm" @click="startDraft">Draft</button>
      </div>

      <div v-if="draftActive" class="draft">
        <div class="draft-head">
          <span>Draft — <strong>{{ draftTurn === 'A' ? 'Player 1' : 'Player 2' }}</strong> to pick</span>
          <button class="ghost-btn sm" @click="cancelDraft">Cancel draft</button>
        </div>
        <div class="draft-pool">
          <button
            v-for="(stone, i) in draftPool"
            :key="stone.id + '-' + i"
            class="catalog-card"
            @click="pickDraft(i)"
          >
            <GameStone :stone="stone" />
            <span class="catalog-name">{{ stone.name }}</span>
          </button>
        </div>
      </div>

      <!-- Both players side by side: drop Lithos from the shared catalog. -->
      <div class="players">
        <div
          v-for="p in (['A', 'B'] as const)"
          :key="p"
          class="player-col"
          :class="[`owner-${p}`, { 'drop-target': dragOverPlayer === p, full: handFull(p) }]"
          :data-hand-owner="p"
        >
          <div class="player-col-header">
            <span class="player-name">{{ p === 'A' ? 'Player 1' : 'Player 2' }}</span>
            <span class="player-count">{{ hands[p].length }}/{{ handSize(p) }}</span>
            <button class="ghost-btn sm" @click="autoFill(p)">Auto-fill</button>
            <button class="ghost-btn sm" @click="hands[p] = []">Clear</button>
          </div>

          <div class="player-hand">
            <button
              v-for="(stone, i) in hands[p]"
              :key="stone.id + '-' + i"
              class="mini-card"
              :class="`owner-${p}`"
              title="Remove"
              @click="removeFromHand(p, i)"
            >
              <GameStone :stone="stone" />
            </button>
            <div v-if="hands[p].length === 0" class="drop-hint">Drag Lithos here</div>
          </div>
        </div>
      </div>

      <p class="hint">
        Drag Lithos from the catalog into each player's column.
        Click a Lithos in a hand to remove it.
      </p>

      <!-- Shared catalog -->
      <div v-if="loading" class="empty">Loading Lithos...</div>
      <div v-else class="catalog">
        <button
          v-for="stone in catalog"
          :key="stone.id"
          class="catalog-card"
          :class="{ dragging: drag?.stone.id === stone.id }"
          @pointerdown="onCatalogPointerDown($event, stone)"
          @dragstart.prevent
        >
          <GameStone :stone="stone" />
          <span class="catalog-name">{{ stone.name }}</span>
        </button>
      </div>

      <button class="start-btn" :disabled="!canStart" @click="start">
        Start game
      </button>

      <!-- Floating Lithos that follows the cursor while dragging from the catalog -->
      <Teleport to="body">
        <div
          v-if="drag"
          class="drag-ghost"
          :style="{ left: `${drag.x}px`, top: `${drag.y}px` }"
        >
          <div class="ghost-card">
            <GameStone :stone="drag.stone" />
          </div>
        </div>
      </Teleport>
    </div>

    <!-- ========== PLAY ========== -->
    <div v-else-if="match" class="play">
      <GameBoard
        :state="match"
        :selected-hand-index="selectedHandIndex"
        :last-events="lastEvents"
        :element-sprites="elementSprites"
        :seconds-left="match.turnSeconds > 0 && match.status === 'playing' ? remaining : undefined"
        @select-hand="selectHand"
        @place-at="play"
      />
      <div v-if="match.status !== 'finished'" class="play-actions">
        <button class="ghost-btn" :disabled="!canUndo" @click="undo">Undo</button>
        <button class="ghost-btn" @click="reset">Edit config</button>
      </div>

      <!-- End-of-game overlay: position:absolute inside .play (which is
           position:relative). No Teleport, scoped styles, so it renders
           reliably and is not trapped by .play-container's backdrop-filter. -->
      <div v-if="match.status === 'finished'" class="end-overlay" @click.self="reset">
        <div class="end-modal" role="dialog" aria-modal="true">
          <div class="end-result" :class="resultClass">{{ resultTitle }}</div>
          <div class="end-score">
            <span class="es-a">Player 1 : {{ finalScore.A }}</span>
            <span class="es-sep">/</span>
            <span class="es-b">Player 2 : {{ finalScore.B }}</span>
          </div>
          <div class="end-actions">
            <button class="end-btn end-btn-primary" @click="playAgain">Play again</button>
            <button class="end-btn" @click="reset">Edit config</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import GameBoard from './GameBoard.vue'
import GameStone from './GameStone.vue'
import { createMatch, placeStoneWithEvents, getScore, handSizeFor, randomMove } from '~/game/engine/match'
import { generateBoardElements, randomHand, buildDraftPool } from '~/game/engine/setup'
import { toStone, toElementGraph, type LithosRecord, type ElementRecord } from '~/game/engine/adapters'
import type { CaptureEvent, CaptureRules, ElementGraph, MatchState, Player, Stone, TimelineEntry } from '~/game/engine/types'

type Phase = 'setup' | 'play'

const emit = defineEmits<{
  (e: 'activeChange', active: boolean): void
}>()

const phase = ref<Phase>('setup')
const loading = ref(true)
const size = ref(3)

const rules = ref<CaptureRules>({ same: false, plus: false, combo: false })
const startingChoice = ref<'A' | 'B' | 'random'>('random')
const elementalCells = ref(false)
const turnSeconds = ref(0)
const remaining = ref(0)
const replaying = ref(false)
let timerId: ReturnType<typeof setInterval> | null = null
const elementSprites = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const s of catalog.value) {
    if (s.elementId && s.elementSprite) map[s.elementId] = s.elementSprite
  }
  return map
})

function resolveStartingPlayer(): Player {
  if (startingChoice.value === 'random') return Math.random() < 0.5 ? 'A' : 'B'
  return startingChoice.value
}

const catalog = ref<Stone[]>([])
const elements = ref<ElementGraph>({ strongAgainst: {} })
const hands = ref<Record<Player, Stone[]>>({ A: [], B: [] })

const match = ref<MatchState | null>(null)
const selectedHandIndex = ref<number | null>(null)
const timeline = ref<TimelineEntry[]>([])
const canUndo = computed(() => timeline.value.length > 1 && match.value?.status === 'playing')
const lastEvents = ref<CaptureEvent[]>([])

const finalScore = computed(() => (match.value ? getScore(match.value) : { A: 0, B: 0 }))
const resultTitle = computed(() => {
  const w = match.value?.winner
  if (w === 'draw') return "It's a draw!"
  if (w === 'A') return 'Player 1 wins!'
  if (w === 'B') return 'Player 2 wins!'
  return ''
})
const resultClass = computed(() => {
  const w = match.value?.winner
  return w === 'draw' ? 'is-draw' : `is-${w}`
})

const cellCount = computed(() => size.value * size.value)
function handSize(player: Player): number {
  // While the starter is random, size both hands to the larger half so either
  // assignment is valid; hands are trimmed to the real sizes when the game starts.
  if (startingChoice.value === 'random') return Math.ceil(cellCount.value / 2)
  return handSizeFor(size.value, player, startingChoice.value)
}
function handFull(player: Player): boolean {
  return hands.value[player].length >= handSize(player)
}
const canStart = computed(() => handFull('A') && handFull('B'))

function addToHand(player: Player, stone: Stone) {
  if (handFull(player)) return
  hands.value[player].push(stone)
}
function removeFromHand(player: Player, index: number) {
  hands.value[player].splice(index, 1)
}
function autoFill(player: Player) {
  while (!handFull(player) && catalog.value.length > 0) {
    const pick = catalog.value[hands.value[player].length % catalog.value.length]!
    hands.value[player].push(pick)
  }
}

/* ---------- Hand modes: Random / Mirror / Draft ---------- */

function fillRandom() {
  if (catalog.value.length === 0) return
  hands.value.A = randomHand(catalog.value, handSize('A'))
  hands.value.B = randomHand(catalog.value, handSize('B'))
}

function fillMirror() {
  if (catalog.value.length === 0) return
  const a = randomHand(catalog.value, handSize('A'))
  hands.value.A = a
  hands.value.B = a.slice(0, handSize('B'))
}

const draftActive = ref(false)
const draftPool = ref<Stone[]>([])
const draftTurn = ref<Player>('A')

function startDraft() {
  if (catalog.value.length === 0) return
  hands.value.A = []
  hands.value.B = []
  draftPool.value = buildDraftPool(catalog.value, handSize('A') + handSize('B'))
  draftTurn.value = 'A'
  draftActive.value = true
}

function nextDraftTurn() {
  if (handFull('A') && handFull('B')) { draftActive.value = false; return }
  const other: Player = draftTurn.value === 'A' ? 'B' : 'A'
  draftTurn.value = handFull(other) ? draftTurn.value : other
}

function pickDraft(i: number) {
  if (!draftActive.value || handFull(draftTurn.value)) return
  const [stone] = draftPool.value.splice(i, 1)
  if (stone) hands.value[draftTurn.value].push(stone)
  nextDraftTurn()
}

function cancelDraft() {
  draftActive.value = false
  draftPool.value = []
  hands.value.A = []
  hands.value.B = []
}

/* ---------- Drag a Lithos from the catalog onto a player column ----------
   Same pointer-based pattern as GameBoard: a Teleported ghost follows the
   cursor, and the drop target is resolved via document.elementFromPoint. */

interface CatalogDrag {
  stone: Stone
  x: number
  y: number
}

const drag = ref<CatalogDrag | null>(null)
const dragOverPlayer = ref<Player | null>(null)
const DRAG_THRESHOLD = 6
let startX = 0
let startY = 0
let pendingStone: Stone | null = null

function onCatalogPointerDown(e: PointerEvent, stone: Stone) {
  e.preventDefault()
  startX = e.clientX
  startY = e.clientY
  pendingStone = stone
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerCancel)
}

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
    if (player && !handFull(player)) addToHand(player, pendingStone)
  }
  endDrag()
}

onBeforeUnmount(removeDragListeners)
onBeforeUnmount(stopTimer)

function start() {
  if (!canStart.value) return
  const startingPlayer = resolveStartingPlayer()
  const handA = [...hands.value.A].slice(0, handSizeFor(size.value, 'A', startingPlayer))
  const handB = [...hands.value.B].slice(0, handSizeFor(size.value, 'B', startingPlayer))
  const boardElements = elementalCells.value
    ? generateBoardElements(size.value, Object.keys(elements.value.strongAgainst))
    : undefined
  match.value = createMatch({
    size: size.value,
    hands: { A: handA, B: handB },
    elements: elements.value,
    rules: { ...rules.value },
    startingPlayer,
    boardElements,
    turnSeconds: turnSeconds.value,
  })
  timeline.value = [{ state: match.value, events: [] }]
  selectedHandIndex.value = null
  lastEvents.value = []
  phase.value = 'play'
  emit('activeChange', true)
  armTimer()
}

function reset() {
  match.value = null
  selectedHandIndex.value = null
  phase.value = 'setup'
  emit('activeChange', false)
}

function selectHand(index: number) {
  selectedHandIndex.value = index
}

function undo() {
  if (timeline.value.length <= 1) return
  timeline.value.pop()
  match.value = timeline.value[timeline.value.length - 1]!.state
  selectedHandIndex.value = null
  lastEvents.value = []
  armTimer()
}

function playAgain() {
  // Re-run start() with the same hands/rules/starter already in the setup state.
  start()
}

function playAt(handIndex: number, x: number, y: number) {
  if (!match.value || match.value.status !== 'playing') return
  const { state, events } = placeStoneWithEvents(match.value, handIndex, x, y)
  match.value = state
  lastEvents.value = events
  timeline.value.push({ state, events })
  selectedHandIndex.value = null
}

function play(x: number, y: number) {
  if (selectedHandIndex.value === null) return
  playAt(selectedHandIndex.value, x, y)
}

/* ---------- Turn timer ---------- */

function stopTimer() {
  if (timerId !== null) { clearInterval(timerId); timerId = null }
}

function armTimer() {
  stopTimer()
  if (!match.value || match.value.turnSeconds <= 0 || match.value.status !== 'playing' || replaying.value) return
  remaining.value = match.value.turnSeconds
  timerId = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) {
      stopTimer()
      const mv = match.value ? randomMove(match.value) : null
      if (mv) playAt(mv.handIndex, mv.x, mv.y)
    }
  }, 1000)
}

watch(
  () => [match.value?.current, match.value?.status] as const,
  () => {
    if (match.value?.status === 'playing') armTimer()
    else stopTimer()
  },
)

async function loadData() {
  loading.value = true
  try {
    const [lithosRes, elementsRes] = await Promise.all([
      $fetch<{ data: LithosRecord[] }>('/api/lithos'),
      $fetch<{ data: ElementRecord[] }>('/api/elements'),
    ])
    catalog.value = lithosRes.data.map(toStone)
    elements.value = toElementGraph(elementsRes.data)

    // Prefill Player 1 from the saved deck (expanded by quantity).
    try {
      const deckRes = await $fetch<{ data: { entries: { quantity: number; lithos: LithosRecord }[] } }>(
        '/api/deck'
      )
      const fromDeck: Stone[] = []
      for (const entry of deckRes.data.entries) {
        for (let n = 0; n < entry.quantity; n++) fromDeck.push(toStone(entry.lithos))
      }
      hands.value.A = fromDeck.slice(0, handSize('A'))
    } catch {
      // No deck or not logged in: leave Player 1 hand empty.
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.local-match {
  width: 100%;
}

/* ---- Setup ---- */
.setup {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setup-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.size-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.size-picker select {
  background: var(--bg-glass-light);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  padding: 0.35rem 0.5rem;
}

.rule-toggles {
  display: flex;
  gap: 0.75rem;
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.rule-toggles label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
}

.hand-modes { display: flex; gap: 0.5rem; }
.draft { display: flex; flex-direction: column; gap: 0.5rem; }
.draft-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}
.draft-pool {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 0.6rem;
  max-height: 40vh;
  overflow-y: auto;
}

/* ---- Two player columns ---- */
.players {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.player-col {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.75rem;
  border-radius: var(--radius-xl, 1rem);
  border: 2px solid var(--color-border-light);
  background: var(--bg-glass-light);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.player-col.owner-A { border-color: color-mix(in srgb, var(--owner-a, #3b82f6) 45%, transparent); }
.player-col.owner-B { border-color: color-mix(in srgb, var(--owner-b, #ef4444) 45%, transparent); }

/* Highlight the column currently hovered while dragging. */
.player-col.drop-target.owner-A {
  border-color: var(--owner-a, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
.player-col.drop-target.owner-B {
  border-color: var(--owner-b, #ef4444);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
}

/* A full column refuses further drops. */
.player-col.full.drop-target {
  box-shadow: none;
  cursor: not-allowed;
}

.player-col-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.player-name { font-weight: var(--font-semibold); }
.player-col.owner-A .player-name { color: var(--owner-a, #3b82f6); }
.player-col.owner-B .player-name { color: var(--owner-b, #ef4444); }

.player-count {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  margin-right: auto;
}

.player-hand {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 64px;
  align-items: center;
  align-content: flex-start;
}

.drop-hint {
  color: var(--color-text-muted);
  font-size: var(--font-sm);
  opacity: 0.7;
}

.ghost-btn {
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  background: var(--bg-glass-light);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: var(--font-sm);
}

.ghost-btn:hover { background: var(--bg-glass-medium); }

.ghost-btn.sm { padding: 0.25rem 0.55rem; font-size: 0.72rem; }

.hint {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.mini-card {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border-light);
  background: var(--bg-glass-medium);
  padding: 0;
  cursor: pointer;
}

.mini-card.owner-A { border-color: var(--owner-a, #3b82f6); }
.mini-card.owner-B { border-color: var(--owner-b, #ef4444); }

.catalog {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 0.6rem;
  max-height: 40vh;
  overflow-y: auto;
  padding: 0.25rem;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
}

.catalog-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  background: var(--bg-glass-medium);
  cursor: grab;
  touch-action: none;
  transition: transform 0.12s, opacity 0.12s;
}

.catalog-card { aspect-ratio: auto; }
.catalog-card > :first-child { width: 64px; height: 64px; }
.catalog-card:active { cursor: grabbing; }
.catalog-card:hover { transform: translateY(-2px); }
.catalog-card.dragging { opacity: 0.4; }

.catalog-name {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-align: center;
}

.start-btn {
  align-self: flex-start;
  padding: 0.6rem 1.4rem;
  border-radius: var(--radius-lg);
  border: none;
  background: var(--color-primary, #6366f1);
  color: #fff;
  font-weight: var(--font-semibold);
  cursor: pointer;
}

.start-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.empty {
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

/* ---- Catalog drag ghost (follows the cursor, Teleported to body) ---- */
.drag-ghost {
  position: fixed;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2000;
}

.ghost-card {
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-primary, #6366f1);
  background: var(--bg-glass-medium);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.45);
}

.ghost-card > :first-child { width: 60px; height: 60px; }

@media (max-width: 720px) {
  .players { grid-template-columns: 1fr; }
}

/* ---- Play ---- */
.play {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: center;
}

.play-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.owner-A {}
.owner-B {}

/* ---- End-of-game overlay (absolute inside .play, scoped) ---- */
.end-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 12, 18, 0.72);
  backdrop-filter: blur(2px);
  border-radius: var(--radius-2xl, 1rem);
  animation: end-fade 0.18s ease-out;
}

.end-modal {
  width: min(90%, 360px);
  background: var(--color-bg-primary, #252830);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-2xl, 1rem);
  padding: 1.75rem 1.5rem;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  animation: end-pop 0.22s ease-out;
}

.end-result {
  font-size: var(--font-2xl, 1.6rem);
  font-weight: var(--font-bold);
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}

.end-result.is-A { color: var(--owner-a, #3b82f6); }
.end-result.is-B { color: var(--owner-b, #ef4444); }
.end-result.is-draw { color: var(--color-text-muted); }

.end-score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  font-size: var(--font-base);
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.end-score .es-a { color: var(--owner-a, #3b82f6); }
.end-score .es-b { color: var(--owner-b, #ef4444); }
.end-score .es-sep { color: var(--color-text-muted); }

.end-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.end-btn {
  padding: 0.6rem 1.2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  background: var(--bg-glass-light);
  color: var(--color-text-primary);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.end-btn:hover { background: var(--bg-glass-medium); transform: translateY(-1px); }

.end-btn-primary {
  background: var(--color-primary, #6366f1);
  border-color: var(--color-primary, #6366f1);
  color: #fff;
}

.end-btn-primary:hover { filter: brightness(1.08); }

@keyframes end-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes end-pop {
  from { opacity: 0; transform: scale(0.92) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .end-overlay, .end-modal { animation: none; }
}
</style>
