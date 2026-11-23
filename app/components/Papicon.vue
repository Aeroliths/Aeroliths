<template>
  <svg
    class="papicon"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="icon.viewBox"
    :width="resolvedSize"
    :height="resolvedSize"
    :style="iconStyle"
    fill="currentColor"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label || undefined"
    :role="label ? 'img' : undefined"
    focusable="false"
    v-html="icon.body"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PAPICONS, type PapiconName } from '~/utils/papicons'

const props = withDefaults(
  defineProps<{
    name: PapiconName
    size?: number | string
    color?: string
    label?: string
  }>(),
  {
    size: '1em',
  }
)

const icon = computed(() => PAPICONS[props.name] ?? PAPICONS.info)

const resolvedSize = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : props.size
)

const iconStyle = computed(() =>
  props.color ? { color: props.color } : undefined
)
</script>

<style scoped>
.papicon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: -0.15em;
  line-height: 1;
}
</style>
