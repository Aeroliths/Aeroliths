<template>
  <div class="consent-manager">
    <div class="consent-current">
      Current choice:
      <strong v-if="consent === 'accepted'" class="consent-accepted">Accept all</strong>
      <strong v-else-if="consent === 'refused'" class="consent-refused">Essential only</strong>
      <strong v-else class="consent-none">Not set</strong>
    </div>
    <div class="consent-actions">
      <button
        type="button"
        class="consent-btn consent-btn--refuse"
        :disabled="consent === 'refused'"
        @click="onRefuse"
      >
        Essential only
      </button>
      <button
        type="button"
        class="consent-btn consent-btn--accept"
        :disabled="consent === 'accepted'"
        @click="onAccept"
      >
        Accept all
      </button>
    </div>
    <p v-if="flash" class="consent-flash">{{ flash }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCookieConsent } from '~/composables/useCookieConsent'

const { consent, loadFromStorage, setConsent } = useCookieConsent()
const flash = ref('')

onMounted(() => loadFromStorage())

const showFlash = (msg: string) => {
  flash.value = msg
  setTimeout(() => (flash.value = ''), 2500)
}

const onAccept = () => {
  setConsent('accepted')
  showFlash('Audience measurement enabled.')
}

const onRefuse = () => {
  setConsent('refused')
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('visit-tracked')
  }
  showFlash('Audience measurement disabled.')
}
</script>

<style scoped>
.consent-manager {
  margin: var(--spacing-md) 0;
  padding: var(--spacing-md);
  background: var(--bg-glass-medium);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
}

.consent-current {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
}

.consent-accepted {
  color: var(--color-success);
}

.consent-refused {
  color: var(--color-text-primary);
}

.consent-none {
  color: var(--color-warning);
}

.consent-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.consent-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  border: none;
  transition: opacity var(--transition-fast);
}

.consent-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.consent-btn--accept {
  background: var(--gradient-primary);
  color: var(--color-bg-base);
}

.consent-btn--refuse {
  background: var(--bg-glass-light);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-light);
}

.consent-flash {
  margin: var(--spacing-sm) 0 0;
  font-size: var(--font-sm);
  color: var(--color-success);
}
</style>
