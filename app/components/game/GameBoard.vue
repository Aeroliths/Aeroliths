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
        <template v-if="state.status === 'finished'">
          <span v-if="state.winner === 'draw'" class="result">Draw</span>
          <span v-else class="result">
            {{ state.winner === 'A' ? 'Player 1' : 'Player 2' }} wins!
          </span>
        </template>
        <span v-else class="turn">
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
            { placeable: !cell && canPlace },
          ]"
          :disabled="!!cell || !canPlace || state.status === 'finished'"
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
          :class="[`owner-${state.current}`, { selected: i === selectedHandIndex }]"
          @click="$emit('selectHand', i)"
        >
          <GameStone :stone="stone" :owner="state.current" />
        </button>
        <div v-if="state.hands[state.current].length === 0" class="empty-hand">No stones left</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import GameStone from './GameStone.vue'
import { getScore } from '~/game/engine/match'
import type { MatchState } from '~/game/engine/types'

const props = defineProps<{
  state: MatchState
  selectedHandIndex: number | null
}>()

defineEmits<{
  (e: 'selectHand', index: number): void
  (e: 'placeAt', x: number, y: number): void
}>()

const score = computed(() => getScore(props.state))
const canPlace = computed(
  () => props.selectedHandIndex !== null && props.state.status === 'playing'
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
}

.cell {
  aspect-ratio: 1;
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

.cell.placeable {
  cursor: pointer;
  border-style: dashed;
  border-color: var(--color-primary, #6366f1);
}

.cell.placeable:hover {
  background: rgba(99, 102, 241, 0.12);
}

.owner-A { border-color: var(--owner-a, #3b82f6); }
.owner-B { border-color: var(--owner-b, #ef4444); }

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
  cursor: pointer;
  transition: transform 0.12s, border-color 0.12s;
}

.hand-card:hover { transform: translateY(-3px); }
.hand-card.selected { border-color: var(--color-primary, #6366f1); transform: translateY(-3px); }
.hand-card.owner-A { border-color: var(--owner-a, #3b82f6); }
.hand-card.owner-B { border-color: var(--owner-b, #ef4444); }
.hand-card.selected { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3); }

.empty-hand {
  color: var(--color-text-muted);
  font-size: var(--font-sm);
  padding: 0.5rem;
}
</style>
