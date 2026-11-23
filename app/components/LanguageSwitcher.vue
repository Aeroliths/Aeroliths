<template>
  <div class="language-switcher" role="group" aria-label="Language">
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
  await navigateTo(switchLocalePath(code as typeof locale.value))
  if (isAuthenticated.value && user.value) {
    try {
      await $fetch(`/api/users/${user.value.id}`, { method: 'PATCH', body: { locale: code } })
    } catch (err) {
      console.error('Failed to persist locale preference:', err)
    }
  }
}
</script>

<style scoped>
.language-switcher {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--bg-glass-light);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 3px;
}

.language-switcher-option {
  padding: 0.3rem 0.55rem;
  border-radius: calc(var(--radius-md) - 3px);
  font-size: var(--font-xs);
  font-weight: var(--font-semibold);
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
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
  background: var(--color-brand-primary);
  color: var(--color-bg-base);
}
</style>
