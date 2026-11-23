<template>
  <div class="play-page">
    <div class="play-container">
      <div class="play-header">
        <div class="play-header-top">
          <div>
            <h1>{{ $t('play.playComponent.title') }}</h1>
            <p>{{ $t('play.playComponent.welcome') }}<strong>{{ user?.username }}</strong>{{ $t('play.playComponent.welcomeSuffix') }}</p>
          </div>
        </div>

        <div v-if="user?.level" class="progress-card">
          <div class="progress-head">
            <span class="progress-level">
              <span class="progress-level-icon" aria-hidden="true">
                <Papicon name="star" :size="14" />
              </span>
              {{ $t('play.playComponent.level', { level: user.level }) }}
            </span>
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
          <span class="mode-icon mode-icon--sky" aria-hidden="true">
            <Papicon name="folder" :size="20" />
          </span>
          <span class="mode-title">{{ $t('play.playComponent.deckBuilderTitle') }}</span>
          <span class="mode-desc">{{ $t('play.playComponent.deckBuilderDesc') }}</span>
        </button>
        <button
          class="mode-card"
          :class="{ active: mode === 'local' }"
          @click="mode = 'local'"
        >
          <span class="mode-icon mode-icon--azure" aria-hidden="true">
            <Papicon name="play" :size="20" />
          </span>
          <span class="mode-title">{{ $t('play.playComponent.localMatchTitle') }}</span>
          <span class="mode-desc">{{ $t('play.playComponent.localMatchDesc') }}</span>
        </button>
        <button
          class="mode-card"
          :class="{ active: mode === 'bot' }"
          @click="mode = 'bot'"
        >
          <span class="mode-icon mode-icon--slate" aria-hidden="true">
            <Papicon name="ghost" :size="20" />
          </span>
          <span class="mode-title">{{ $t('play.playComponent.botMatchTitle') }}</span>
          <span class="mode-desc">{{ $t('play.playComponent.botMatchDesc') }}</span>
        </button>
        <button
          class="mode-card"
          :class="{ active: mode === 'chests' }"
          @click="mode = 'chests'"
        >
          <span class="mode-icon mode-icon--gold" aria-hidden="true">
            <Papicon name="archive" :size="20" />
          </span>
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
import Papicon from '~/components/Papicon.vue'
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
  margin: 1.25rem 0 0.25rem;
  padding: 0.9rem 1.15rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-lighter);
  background: var(--bg-glass-lighter);
  box-shadow: var(--shadow-inset-highlight);
}

.progress-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
}

.progress-level {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-display);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.progress-level-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background: rgba(224, 179, 110, 0.16);
  color: var(--color-accent-gold);
}

.progress-xp {
  font-size: var(--font-sm);
  font-variant-numeric: tabular-nums;
  color: var(--color-brand-primary-light);
  font-weight: var(--font-medium);
}

.progress-remaining {
  display: inline-block;
  margin-top: 0.45rem;
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.progress-track {
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--bg-glass-medium);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--color-brand-primary);
  transition: width 0.35s ease;
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill { transition: none; }
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 0.85rem;
  margin-bottom: 1.75rem;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  padding: 1.15rem 1.2rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-lighter);
  background: var(--bg-glass-lighter);
  color: var(--color-text-primary);
  cursor: pointer;
  text-align: left;
  box-shadow: var(--shadow-inset-highlight);
  transition: border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
}

.mode-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-light);
  background: var(--bg-glass-light);
}

.mode-card.active {
  border-color: var(--color-brand-primary);
  background: rgba(107, 150, 173, 0.1);
}

.mode-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  margin-bottom: 0.35rem;
  border: 1px solid transparent;
  transition: transform var(--transition-fast);
}

.mode-card:hover .mode-icon,
.mode-card.active .mode-icon {
  transform: scale(1.05);
}

.mode-icon--sky {
  background: rgba(114, 188, 224, 0.14);
  border-color: rgba(114, 188, 224, 0.25);
  color: var(--color-brand-primary-light);
}

.mode-icon--azure {
  background: rgba(96, 165, 250, 0.14);
  border-color: rgba(96, 165, 250, 0.25);
  color: var(--owner-a);
}

.mode-icon--slate {
  background: rgba(148, 163, 184, 0.14);
  border-color: rgba(148, 163, 184, 0.25);
  color: #cbd5e1;
}

.mode-icon--gold {
  background: rgba(224, 179, 110, 0.14);
  border-color: rgba(224, 179, 110, 0.26);
  color: var(--color-accent-gold);
}

.mode-title {
  font-family: var(--font-display);
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.mode-desc {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  line-height: 1.45;
}

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
  .mode-icon,
  .mode-fade-enter-active,
  .mode-fade-leave-active {
    transition: none;
  }
}
</style>
