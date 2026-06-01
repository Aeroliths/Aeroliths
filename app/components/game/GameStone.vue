<template>
  <div
    class="game-stone"
    @mouseenter="onEnter"
    @mousemove="onMove"
    @mouseleave="onLeave"
  >
    <img
      v-if="stone.sprite"
      :src="stone.sprite"
      :alt="stone.name || stone.id"
      class="stone-sprite"
      draggable="false"
    />
    <span class="spike spike-up">{{ stone.spikeUp }}</span>
    <span class="spike spike-right">{{ stone.spikeRight }}</span>
    <span class="spike spike-down">{{ stone.spikeDown }}</span>
    <span class="spike spike-left">{{ stone.spikeLeft }}</span>

    <Teleport to="body">
      <div
        v-if="hover"
        class="stone-tooltip"
        :style="{ left: `${pos.x + 14}px`, top: `${pos.y + 14}px` }"
      >
        <div class="tt-row"><span class="tt-key">name :</span> {{ name }}</div>
        <div class="tt-row"><span class="tt-key">type :</span> {{ typeLabel }}</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Player, Stone } from '~/game/engine/types'

const props = defineProps<{
  stone: Stone
  owner?: Player
}>()

const name = computed(() => props.stone.name || props.stone.id)
const typeLabel = computed(() => props.stone.elementName || 'None')

const hover = ref(false)
const pos = ref({ x: 0, y: 0 })

function onEnter(e: MouseEvent) {
  hover.value = true
  pos.value = { x: e.clientX, y: e.clientY }
}
function onMove(e: MouseEvent) {
  pos.value = { x: e.clientX, y: e.clientY }
}
function onLeave() {
  hover.value = false
}
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
  -webkit-user-drag: none;
  user-select: none;
  pointer-events: none;
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

<style>
/* Tooltip is teleported to <body>, so it cannot use scoped styles. */
.stone-tooltip {
  position: fixed;
  z-index: 3000;
  pointer-events: none;
  background: var(--color-bg-primary, #252830);
  border: 1px solid var(--color-border-light, rgba(122, 184, 212, 0.2));
  border-radius: var(--radius-md, 0.5rem);
  padding: 0.45rem 0.65rem;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
  font-size: var(--font-sm, 0.85rem);
  color: var(--color-text-primary, #ece8e0);
  line-height: 1.45;
  white-space: nowrap;
}

.stone-tooltip .tt-key {
  color: var(--color-text-muted, #9aa3ad);
  margin-right: 0.3rem;
  text-transform: capitalize;
}
</style>
