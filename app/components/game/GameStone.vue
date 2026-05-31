<template>
  <div class="game-stone">
    <img v-if="stone.sprite" :src="stone.sprite" :alt="stone.name || stone.id" class="stone-sprite" />
    <span class="spike spike-up">{{ stone.spikeUp }}</span>
    <span class="spike spike-right">{{ stone.spikeRight }}</span>
    <span class="spike spike-down">{{ stone.spikeDown }}</span>
    <span class="spike spike-left">{{ stone.spikeLeft }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Player, Stone } from '~/game/engine/types'

defineProps<{
  stone: Stone
  owner?: Player
}>()
</script>

<style scoped>
.game-stone {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stone-sprite {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 14%;
}

.spike {
  position: absolute;
  font-size: 0.7rem;
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  line-height: 1;
}

.spike-up { top: 3px; left: 50%; transform: translateX(-50%); }
.spike-down { bottom: 3px; left: 50%; transform: translateX(-50%); }
.spike-left { left: 4px; top: 50%; transform: translateY(-50%); }
.spike-right { right: 4px; top: 50%; transform: translateY(-50%); }
</style>
