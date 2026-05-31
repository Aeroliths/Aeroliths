<template>
  <div class="play-page">
    <div class="play-container">
      <div class="play-header">
        <h1>Play Aeroliths</h1>
        <p>Welcome, <strong>{{ user?.username }}</strong>!</p>
      </div>

      <div class="play-tabs">
        <button
          class="play-tab"
          :class="{ active: tab === 'deck' }"
          @click="tab = 'deck'"
        >
          Deck builder
        </button>
        <button
          class="play-tab"
          :class="{ active: tab === 'local' }"
          @click="tab = 'local'"
        >
          Local game
        </button>
      </div>

      <DeckBuilder v-if="tab === 'deck'" />
      <LocalMatch v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import DeckBuilder from '~/components/DeckBuilder.vue'
import LocalMatch from '~/components/game/LocalMatch.vue'

const { user } = useAuth()
const tab = ref<'deck' | 'local'>('deck')
</script>

<style scoped src="~/assets/css/play.css"></style>

<style scoped>
.play-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.play-tab {
  padding: 0.5rem 1.1rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-light);
  background: var(--bg-glass-light);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: var(--font-base);
}

.play-tab.active {
  background: var(--color-primary, #6366f1);
  border-color: var(--color-primary, #6366f1);
  color: #fff;
}
</style>
