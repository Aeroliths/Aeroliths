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

        <div class="player-tabs">
          <button
            v-for="p in (['A', 'B'] as const)"
            :key="p"
            class="player-tab"
            :class="[`owner-${p}`, { active: editingPlayer === p }]"
            @click="editingPlayer = p"
          >
            {{ p === 'A' ? 'Player 1' : 'Player 2' }}
            <span class="tab-count">{{ hands[p].length }}/{{ handSize(p) }}</span>
          </button>
        </div>

        <button class="ghost-btn" @click="autoFill(editingPlayer)">Auto-fill</button>
        <button class="ghost-btn" @click="hands[editingPlayer] = []">Clear</button>
      </div>

      <p class="hint">
        Pick {{ handSize(editingPlayer) }} Lithos for
        <strong>{{ editingPlayer === 'A' ? 'Player 1' : 'Player 2' }}</strong>.
        Click a Lithos in your hand to remove it.
      </p>

      <!-- Selected hand preview -->
      <div class="selected-hand">
        <button
          v-for="(stone, i) in hands[editingPlayer]"
          :key="stone.id + '-' + i"
          class="mini-card"
          :class="`owner-${editingPlayer}`"
          title="Remove"
          @click="removeFromHand(editingPlayer, i)"
        >
          <GameStone :stone="stone" />
        </button>
        <div v-if="hands[editingPlayer].length === 0" class="empty">Hand empty</div>
      </div>

      <!-- Catalog -->
      <div v-if="loading" class="empty">Loading Lithos...</div>
      <div v-else class="catalog">
        <button
          v-for="stone in catalog"
          :key="stone.id"
          class="catalog-card"
          :disabled="handFull(editingPlayer)"
          @click="addToHand(editingPlayer, stone)"
        >
          <GameStone :stone="stone" />
          <span class="catalog-name">{{ stone.name }}</span>
        </button>
      </div>

      <button class="start-btn" :disabled="!canStart" @click="start">
        Start game
      </button>
    </div>

    <!-- ========== PLAY ========== -->
    <div v-else-if="match" class="play">
      <GameBoard
        :state="match"
        :selected-hand-index="selectedHandIndex"
        @select-hand="selectHand"
        @place-at="play"
      />
      <button v-if="match.status !== 'finished'" class="ghost-btn rematch" @click="reset">
        New game
      </button>

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
            <button class="end-btn end-btn-primary" @click="start">Play again</button>
            <button class="end-btn" @click="reset">Back to Play</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import GameBoard from './GameBoard.vue'
import GameStone from './GameStone.vue'
import { createMatch, placeStone, getScore } from '~/game/engine/match'
import { toStone, toElementGraph, type LithosRecord, type ElementRecord } from '~/game/engine/adapters'
import type { ElementGraph, MatchState, Player, Stone } from '~/game/engine/types'

type Phase = 'setup' | 'play'

const emit = defineEmits<{
  (e: 'activeChange', active: boolean): void
}>()

const phase = ref<Phase>('setup')
const loading = ref(true)
const size = ref(3)
const editingPlayer = ref<Player>('A')

const catalog = ref<Stone[]>([])
const elements = ref<ElementGraph>({ strongAgainst: {} })
const hands = ref<Record<Player, Stone[]>>({ A: [], B: [] })

const match = ref<MatchState | null>(null)
const selectedHandIndex = ref<number | null>(null)

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
  // Player A plays first and (on odd boards) one extra stone.
  return player === 'A' ? Math.ceil(cellCount.value / 2) : Math.floor(cellCount.value / 2)
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

function start() {
  if (!canStart.value) return
  match.value = createMatch({
    size: size.value,
    hands: { A: [...hands.value.A], B: [...hands.value.B] },
    elements: elements.value,
  })
  selectedHandIndex.value = null
  phase.value = 'play'
  emit('activeChange', true)
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

function play(x: number, y: number) {
  if (!match.value || selectedHandIndex.value === null) return
  match.value = placeStone(match.value, selectedHandIndex.value, x, y)
  selectedHandIndex.value = null
}

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

.player-tabs {
  display: flex;
  gap: 0.5rem;
}

.player-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  border: 2px solid var(--color-border-light);
  background: var(--bg-glass-light);
  color: var(--color-text-primary);
  cursor: pointer;
}

.player-tab.active.owner-A { border-color: var(--owner-a, #3b82f6); }
.player-tab.active.owner-B { border-color: var(--owner-b, #ef4444); }

.tab-count {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
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

.hint {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.selected-hand {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 64px;
  align-items: center;
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
  cursor: pointer;
}

.catalog-card { aspect-ratio: auto; }
.catalog-card > :first-child { width: 64px; height: 64px; }
.catalog-card:hover:not(:disabled) { transform: translateY(-2px); }
.catalog-card:disabled { opacity: 0.4; cursor: not-allowed; }

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

/* ---- Play ---- */
.play {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: center;
}

.rematch { align-self: center; }

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
