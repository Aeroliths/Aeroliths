<template>
  <Transition name="cookie-banner">
    <div v-if="showBanner" class="cookie-banner">
      <div class="cookie-banner-content">
        <h4 class="cookie-banner-title">{{ $t('cookieBanner.title') }}</h4>
        <p>
          {{ $t('cookieBanner.textBefore') }}
          <NuxtLink href="/legal" class="cookie-link" @click="dismiss">{{ $t('cookieBanner.legalPageLink') }}</NuxtLink>.
        </p>
        <div class="cookie-banner-actions">
          <button class="cookie-accept-btn" @click="dismiss">{{ $t('cookieBanner.accept') }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'cookies-info-dismissed'
const showBanner = ref(false)

onMounted(() => {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem(STORAGE_KEY)) showBanner.value = true
})

const dismiss = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, '1')
  }
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
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.cookie-accept-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
  background: var(--gradient-primary);
  color: var(--color-bg-base);
}

.cookie-accept-btn:hover {
  background: var(--gradient-primary-hover);
  box-shadow: var(--shadow-hover-brand);
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
