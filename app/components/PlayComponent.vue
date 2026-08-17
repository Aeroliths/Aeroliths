<template>
  <div class="play-page">
    <div class="play-container">
      <div class="play-header">
        <h1>{{ $t('play.playComponent.title') }}</h1>
        <p>{{ $t('play.playComponent.welcome') }}<strong>{{ user?.username }}</strong>{{ $t('play.playComponent.welcomeSuffix') }}</p>

        <div v-if="user?.level" class="progress-card">
          <div class="progress-head">
            <span class="progress-level">{{ $t('play.playComponent.level', { level: user.level }) }}</span>
            <span class="progress-xp">{{ $t('play.playComponent.xpTotal', { xp: user.xp ?? 0 }) }}</span>
          </div>
          <div class="progress-track" role="presentation">
            <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
          </div>
          <span class="progress-remaining">
            {{ remainingXp === null
              ? $t('play.playComponent.maxLevel')
              : $t('play.playComponent.xpToNext', { xp: remainingXp }) }}
          </span>
        </div>
      </div>

      <div v-if="!matchActive" class="mode-cards">
        <button
          class="mode-card"
          :class="{ active: mode === 'deck' }"
          @click="mode = 'deck'"
        >
          <span class="mode-icon" aria-hidden="true">🗂️</span>
          <span class="mode-title">{{ $t('play.playComponent.deckBuilderTitle') }}</span>
          <span class="mode-desc">{{ $t('play.playComponent.deckBuilderDesc') }}</span>
        </button>
        <button
          class="mode-card"
          :class="{ active: mode === 'local' }"
          @click="mode = 'local'"
        >
          <span class="mode-icon" aria-hidden="true">⚔️</span>
          <span class="mode-title">{{ $t('play.playComponent.localMatchTitle') }}</span>
          <span class="mode-desc">{{ $t('play.playComponent.localMatchDesc') }}</span>
        </button>
        <button
          class="mode-card"
          :class="{ active: mode === 'bot' }"
          @click="mode = 'bot'"
        >
          <span class="mode-icon" aria-hidden="true">🤖</span>
          <span class="mode-title">{{ $t('play.playComponent.botMatchTitle') }}</span>
          <span class="mode-desc">{{ $t('play.playComponent.botMatchDesc') }}</span>
        </button>
        <button
          class="mode-card"
          :class="{ active: mode === 'chests' }"
          @click="mode = 'chests'"
        >
          <span class="mode-icon" aria-hidden="true">🧰</span>
          <span class="mode-title">{{ $t('play.playComponent.chestsTitle') }}</span>
          <span class="mode-desc">{{ $t('play.playComponent.chestsDesc') }}</span>
        </button>
      </div>

      <!-- The two match modes share one component, keyed apart so switching
           cards starts a clean setup rather than carrying the previous one. -->
      <Transition name="mode-fade" mode="out-in">
        <DeckBuilder v-if="mode === 'deck'" key="deck" />
        <ChestInventory v-else-if="mode === 'chests'" key="chests" />
        <LocalMatch
          v-else
          :key="mode"
          :opponent="mode === 'bot' ? 'bot' : 'human'"
          @active-change="matchActive = $event"
        />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import DeckBuilder from '~/components/DeckBuilder.vue'
import LocalMatch from '~/components/game/LocalMatch.vue'
import ChestInventory from '~/components/game/ChestInventory.vue'

const { user } = useAuth()
const mode = ref<'deck' | 'local' | 'bot' | 'chests'>('deck')
const matchActive = ref(false)

/** XP still to earn before the next level, or null at the top of the curve. */
const remainingXp = computed(() => {
  const next = user.value?.nextLevelXp
  if (next === null || next === undefined) return null
  return Math.max(0, next - (user.value?.xp ?? 0))
})

/**
 * How full the bar is within the current level. The bar measures the current
 * level, not the whole curve, so early levels do not look permanently empty.
 */
const progressPercent = computed(() => {
  const next = user.value?.nextLevelXp
  if (next === null || next === undefined || next <= 0) return 100
  const xp = user.value?.xp ?? 0
  return Math.min(100, Math.max(0, Math.round((xp / next) * 100)))
})
</script>

<style scoped src="~/assets/css/play.css"></style>

<style scoped>
.progress-card {
  margin: 1rem 0 0.25rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-xl, 1rem);
  border: 1px solid var(--color-border-light);
  background: var(--bg-glass-light);
}

.progress-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.progress-level {
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.progress-xp,
.progress-remaining {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.progress-track {
  height: 8px;
  border-radius: 999px;
  background: var(--bg-glass-medium);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--color-primary, #6366f1);
  transition: width 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill { transition: none; }
}

.mode-cards {
  display: grid;
  /* Three cards fit side by side when there is room and wrap when there is not,
     rather than being crushed at intermediate widths. */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 1rem 1.1rem;
  border-radius: var(--radius-xl, 1rem);
  border: 1px solid var(--color-border-light);
  background: var(--bg-glass-light);
  color: var(--color-text-primary);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
}

.mode-card:hover { transform: translateY(-2px); }

.mode-card.active {
  border-color: var(--color-primary, #6366f1);
  background: rgba(99, 102, 241, 0.12);
  box-shadow: 0 0 0 1px var(--color-primary, #6366f1) inset;
}

.mode-icon { font-size: 1.4rem; }

.mode-title {
  font-size: var(--font-base);
  font-weight: var(--font-semibold);
}

.mode-desc {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

/* Inline reveal transition between the two tools. */
.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.mode-fade-enter-from,
.mode-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 560px) {
  .mode-cards { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .mode-card,
  .mode-fade-enter-active,
  .mode-fade-leave-active {
    transition: none;
  }
}
</style>
