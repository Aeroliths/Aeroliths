<template>
  <div class="language-switcher">
    <NuxtLink
      v-for="code in availableLocaleCodes"
      :key="code"
      :to="switchLocalePath(code)"
      class="language-switcher-option"
      :class="{ 'language-switcher-option--active': locale === code }"
    >
      {{ code.toUpperCase() }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const availableLocaleCodes = computed(() => locales.value.map((l) => (typeof l === 'string' ? l : l.code)))
</script>

<style scoped>
.language-switcher {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 2px;
}

.language-switcher-option {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.language-switcher-option:hover {
  color: var(--color-text-primary);
}

.language-switcher-option--active {
  background: var(--gradient-primary);
  color: var(--color-bg-base);
}
</style>
