<template>
  <div class="language-switcher">
    <button
      v-for="code in availableLocaleCodes"
      :key="code"
      type="button"
      class="language-switcher-option"
      :class="{ 'language-switcher-option--active': locale === code }"
      @click="selectLocale(code)"
    >
      {{ code.toUpperCase() }}
    </button>
  </div>
</template>

<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const { isAuthenticated, user } = useAuth()

const availableLocaleCodes = computed(() => locales.value.map((l) => (typeof l === 'string' ? l : l.code)))

async function selectLocale(code: string) {
  if (code === locale.value) return
  await navigateTo(switchLocalePath(code))
  if (isAuthenticated.value && user.value) {
    try {
      await $fetch(`/api/users/${user.value.id}`, { method: 'PATCH', body: { locale: code } })
    } catch (err) {
      // Non-critical: the routing cookie already reflects the new locale for
      // this session; DB sync can be retried the next time the user switches.
      console.error('Failed to persist locale preference:', err)
    }
  }
}
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
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.language-switcher-option:hover {
  color: var(--color-text-primary);
}

.language-switcher-option--active {
  background: var(--gradient-primary);
  color: var(--color-bg-base);
}
</style>
