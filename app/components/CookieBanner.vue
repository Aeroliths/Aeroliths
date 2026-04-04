<template>
  <Transition name="cookie-banner">
    <div v-if="showBanner" class="cookie-banner">
      <div class="cookie-banner-content">
        <p>
          This site uses cookies essential for authentication and proper functioning.
          By continuing to use this site, you accept their use.
          <NuxtLink href="/legal" class="cookie-link" @click="accept">Learn more</NuxtLink>
        </p>
        <button class="cookie-accept-btn" @click="accept">Got it</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showBanner = ref(false)

onMounted(() => {
  if (!localStorage.getItem('cookies-accepted')) {
    showBanner.value = true
  }
})

const accept = () => {
  localStorage.setItem('cookies-accepted', 'true')
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

.cookie-accept-btn {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--gradient-primary);
  color: var(--color-bg-base);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cookie-accept-btn:hover {
  background: var(--gradient-primary-hover);
  box-shadow: var(--shadow-hover-brand);
}

/* Transition */
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
