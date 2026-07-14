<template>
  <div class="play-page">
    <div class="play-container">
      <div class="play-header">
        <h1>{{ $t('play.playComponent.title') }}</h1>
        <p>{{ $t('play.playComponent.welcome') }}<strong>{{ user?.username }}</strong>{{ $t('play.playComponent.welcomeSuffix') }}</p>
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
      </div>

      <Transition name="mode-fade" mode="out-in">
        <DeckBuilder v-if="mode === 'deck'" key="deck" />
        <LocalMatch v-else key="local" @active-change="matchActive = $event" />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import DeckBuilder from '~/components/DeckBuilder.vue'
import LocalMatch from '~/components/game/LocalMatch.vue'

const { user } = useAuth()
const mode = ref<'deck' | 'local'>('deck')
const matchActive = ref(false)
</script>

<style scoped src="~/assets/css/play.css"></style>

<style scoped>
.mode-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
