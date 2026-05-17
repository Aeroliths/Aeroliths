<template>
  <Transition name="cookie-banner">
    <div v-if="showBanner" class="cookie-banner">
      <div class="cookie-banner-content">
        <h4 class="cookie-banner-title">Cookies &amp; analytics</h4>
        <p>
          We use essential cookies for authentication. With your permission, we also record
          anonymous visits to measure traffic. You can change this choice anytime from the
          <NuxtLink href="/legal" class="cookie-link" @click="dismiss">legal page</NuxtLink>.
        </p>
        <div class="cookie-banner-actions">
          <button class="cookie-refuse-btn" @click="refuse">Essential only</button>
          <button class="cookie-accept-btn" @click="accept">Accept all</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCookieConsent } from '~/composables/useCookieConsent'

const showBanner = ref(false)
const { consent, loadFromStorage, setConsent } = useCookieConsent()

onMounted(() => {
  loadFromStorage()
  if (!consent.value) showBanner.value = true
})

const accept = () => {
  setConsent('accepted')
  showBanner.value = false
}

const refuse = () => {
  setConsent('refused')
  showBanner.value = false
}

const dismiss = () => {
  showBanner.value = false
}
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: var(--spacing-lg);
  left: var(--spacing-lg);
  z-index: var(--z-modal);
  width: 360px;
  background: var(--bg-glass-dark);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  padding: var(--spacing-lg);
}

.cookie-banner-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.cookie-banner-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
}

.cookie-banner-content p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-sm);
  line-height: var(--line-height-normal);
}

.cookie-link {
  color: var(--color-brand-primary);
  text-decoration: underline;
  transition: color var(--transition-fast);
}

.cookie-link:hover {
  color: var(--color-brand-primary-light);
}

.cookie-banner-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.cookie-accept-btn,
.cookie-refuse-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.cookie-accept-btn {
  background: var(--gradient-primary);
  color: var(--color-bg-base);
}

.cookie-accept-btn:hover {
  background: var(--gradient-primary-hover);
  box-shadow: var(--shadow-hover-brand);
}

.cookie-refuse-btn {
  background: var(--bg-glass-medium);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-light);
}

.cookie-refuse-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-border-subtle);
}

.cookie-banner-enter-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.cookie-banner-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.cookie-banner-enter-from,
.cookie-banner-leave-to {
  transform: translateY(30px);
  opacity: 0;
}

@media (max-width: 640px) {
  .cookie-banner {
    left: var(--spacing-md);
    right: var(--spacing-md);
    width: auto;
  }
}
</style>
