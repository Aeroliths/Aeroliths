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

    <!-- Spike value as a bar on each edge: longer bar = higher value. -->
    <span class="spike-track track-up">
      <span class="spike-bar bar-h" :style="{ width: barLen(stone.spikeUp) }" />
    </span>
    <span class="spike-track track-down">
      <span class="spike-bar bar-h" :style="{ width: barLen(stone.spikeDown) }" />
    </span>
    <span class="spike-track track-left">
      <span class="spike-bar bar-v" :style="{ height: barLen(stone.spikeLeft) }" />
    </span>
    <span class="spike-track track-right">
      <span class="spike-bar bar-v" :style="{ height: barLen(stone.spikeRight) }" />
    </span>

    <!-- Element logo, bottom-right. -->
    <img
      v-if="stone.elementSprite"
      :src="stone.elementSprite"
      :alt="typeLabel"
      class="element-logo"
      draggable="false"
    />

    <Teleport to="body">
      <div
        v-if="hover"
        class="stone-tooltip"
        :style="{ left: `${pos.x + 14}px`, top: `${pos.y + 14}px` }"
      >
        <div class="tt-row"><span class="tt-key">{{ $t('play.stone.name') }}</span> {{ name }}</div>
        <div class="tt-row"><span class="tt-key">{{ $t('play.stone.element') }}</span> {{ typeLabel }}</div>
        <div class="tt-spikes">
          <span>{{ $t('play.stone.up') }} {{ stone.spikeUp }}</span>
          <span>{{ $t('play.stone.right') }} {{ stone.spikeRight }}</span>
          <span>{{ $t('play.stone.down') }} {{ stone.spikeDown }}</span>
          <span>{{ $t('play.stone.left') }} {{ stone.spikeLeft }}</span>
        </div>
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

const { t } = useI18n()

const name = computed(() => props.stone.name || props.stone.id)
const typeLabel = computed(() => props.stone.elementName || t('play.stone.none'))

/** Value at/above this reads as a full-length bar. Exact values live in the tooltip. */
const BAR_CAP = 10

function barLen(value: number): string {
  const v = Math.max(0, value)
  return `${Math.min(100, (v / BAR_CAP) * 100)}%`
}

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

/* ---- Spike bars ---- */
.spike-track {
  position: absolute;
  display: flex;
  pointer-events: none;
}

/* Horizontal tracks (top / bottom): the bar grows from the centre outward. */
.track-up,
.track-down {
  left: 8%;
  right: 8%;
  height: 5px;
  justify-content: center;
  align-items: center;
}
.track-up { top: 4px; }
.track-down { bottom: 4px; }

/* Vertical tracks (left / right). */
.track-left,
.track-right {
  top: 8%;
  bottom: 8%;
  width: 5px;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
.track-left { left: 4px; }
.track-right { right: 4px; }

.spike-bar {
  background: linear-gradient(90deg, #8fd0ec, #f0d27a);
  border-radius: 999px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.55);
}

.bar-h { height: 100%; min-width: 0; }
.bar-v { width: 100%; min-height: 0; }

/* ---- Element logo ---- */
.element-logo {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 26%;
  max-width: 30px;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
  pointer-events: none;
  user-select: none;
}
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

.stone-tooltip .tt-spikes {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--color-border-light, rgba(122, 184, 212, 0.2));
  font-weight: var(--font-semibold, 600);
}
</style>
