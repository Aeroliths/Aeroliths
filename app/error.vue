<template>
  <div class="error-page">
    <!-- Ambient glows -->
    <div class="ambient-glow ambient-glow--sky"></div>
    <div class="ambient-glow ambient-glow--stone"></div>

    <div class="error-container">
      <div class="error-content">
        <!-- Error Code -->
        <h1 class="error-code">{{ error.statusCode }}</h1>

        <!-- Error Icon -->
        <div class="error-icon">
          <UIcon :name="errorIcon" class="icon" />
        </div>

        <!-- Error Message -->
        <h2 class="error-title">{{ errorTitle }}</h2>
        <p class="error-description">{{ errorDescription }}</p>

        <!-- Teapot Easter Egg (418 only) -->
        <div v-if="error.statusCode === 418" class="teapot-section">
          <div class="teapot-art">
            <div class="steam">
              <span class="steam-line"></span>
              <span class="steam-line"></span>
              <span class="steam-line"></span>
            </div>
            <pre class="teapot-ascii">
        ______
      /        \
     |  ~  ~   |
      \  ___  /
    ___)|___|(___
   /    _____    \
  |   /     \    |_
  |  |       |   | \
   \  \_____/   /  |
    \___________/  /
     \___________/
            </pre>
          </div>
          <p class="teapot-fact">
            RFC 2324 defines this status code. It was originally an April Fools' joke in 1998, but some say lithos are best served as tea...
          </p>
          <div class="teapot-recipe">
            <p class="recipe-title">Lithos Tea Recipe</p>
            <ul>
              <li>1 crushed Fire lithos for warmth</li>
              <li>2 drops of Water lithos essence</li>
              <li>A pinch of Earth lithos dust</li>
              <li>Stir with an Air lithos breeze</li>
            </ul>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="error-actions">
          <UButton
            to="/"
            color="primary"
            size="lg"
            icon="i-heroicons-home"
          >
            Back to Home
          </UButton>

          <UButton
            @click="handleError"
            color="neutral"
            variant="outline"
            size="lg"
            icon="i-heroicons-arrow-path"
          >
            Try Again
          </UButton>
        </div>

        <!-- Additional Info for Dev -->
        <div v-if="isDev && error.message" class="error-debug">
          <details>
            <summary>Error details (dev)</summary>
            <pre>{{ error }}</pre>
          </details>
        </div>
      </div>
    </div>

    <!-- Floating lithos -->
    <div class="floating-lithos lithos-1"></div>
    <div class="floating-lithos lithos-2"></div>
    <div class="floating-lithos lithos-3"></div>
    <div class="floating-lithos lithos-4"></div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  error: {
    type: Object,
    required: true
  }
})

const isDev = import.meta.dev

const errorIcon = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'i-heroicons-magnifying-glass-circle'
    case 403:
      return 'i-heroicons-lock-closed'
    case 418:
      return 'i-heroicons-beaker'
    case 500:
      return 'i-heroicons-exclamation-triangle'
    default:
      return 'i-heroicons-x-circle'
  }
})

const errorTitle = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'Lost in the Clouds'
    case 403:
      return 'Access Forbidden'
    case 418:
      return "I'm a Teapot"
    case 500:
      return 'Server Error'
    default:
      return 'An Error Occurred'
  }
})

const errorDescription = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'This page seems to have crumbled to dust. The lithos you seek does not exist.'
    case 403:
      return "You don't have permission to access this page."
    case 418:
      return "You tried to brew coffee, but Aeroliths is a teapot. We only serve lithos here, not espresso."
    case 500:
      return 'Something broke deep in the earth. Please try again later.'
    default:
      return props.error.message || 'An unexpected error occurred.'
  }
})

const handleError = () => {
  clearError({ redirect: '/' })
}

useSeoMeta({
  title: `Error ${props.error.statusCode} – Aeroliths`,
  description: errorDescription.value,
  robots: 'noindex, nofollow',
})
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-base);
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
}

.error-container {
  position: relative;
  z-index: var(--z-base);
  width: 100%;
  max-width: 480px;
}

.error-content {
  background: var(--bg-glass-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-4xl) var(--spacing-xl);
  text-align: center;
  box-shadow: var(--shadow-2xl);
}

/* Error code */
.error-code {
  font-size: 7rem;
  font-weight: 900;
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1;
  letter-spacing: -0.04em;
}

/* Icon */
.error-icon {
  margin: var(--spacing-md) 0 var(--spacing-lg);
}

.error-icon .icon {
  width: 56px;
  height: 56px;
  color: var(--color-brand-primary);
  opacity: 0.7;
}

/* Title & description */
.error-title {
  font-size: var(--font-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.error-description {
  font-size: var(--font-base);
  color: var(--color-text-muted);
  margin: 0 0 var(--spacing-xl) 0;
  line-height: var(--line-height-relaxed);
}

/* Buttons */
.error-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
  flex-wrap: wrap;
}

/* Debug */
.error-debug {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

.error-debug summary {
  cursor: pointer;
  color: var(--color-text-subtle);
  font-size: var(--font-xs);
  margin-bottom: var(--spacing-sm);
}

.error-debug summary:hover {
  color: var(--color-text-muted);
}

.error-debug pre {
  background: var(--color-bg-dark);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  text-align: left;
  overflow-x: auto;
  max-height: 250px;
  overflow-y: auto;
}

/* Teapot 418 */
.teapot-section {
  margin-bottom: var(--spacing-xl);
}

.teapot-art {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.teapot-ascii {
  color: var(--color-brand-primary);
  font-size: 0.65rem;
  line-height: 1.2;
  margin: 0;
  opacity: 0.8;
}

.steam {
  display: flex;
  gap: 8px;
  justify-content: center;
  height: 30px;
}

.steam-line {
  display: block;
  width: 2px;
  height: 100%;
  background: linear-gradient(to top, var(--color-brand-primary), transparent);
  border-radius: var(--radius-full);
  opacity: 0.4;
  animation: steam-rise 2s ease-in-out infinite;
}

.steam-line:nth-child(2) {
  height: 80%;
  animation-delay: 0.4s;
}

.steam-line:nth-child(3) {
  height: 60%;
  animation-delay: 0.8s;
}

@keyframes steam-rise {
  0%, 100% {
    opacity: 0.1;
    transform: translateY(0) scaleY(1);
  }
  50% {
    opacity: 0.5;
    transform: translateY(-6px) scaleY(1.3);
  }
}

.teapot-fact {
  font-size: var(--font-xs);
  color: var(--color-text-subtle);
  font-style: italic;
  margin: var(--spacing-md) 0;
  line-height: var(--line-height-relaxed);
}

.teapot-recipe {
  background: var(--bg-glass-light);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  text-align: left;
}

.recipe-title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--color-brand-primary);
}

.teapot-recipe ul {
  margin: 0;
  padding-left: var(--spacing-lg);
  list-style: none;
}

.teapot-recipe li {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  line-height: var(--line-height-loose);
}

.teapot-recipe li::before {
  content: "~ ";
  color: var(--color-brand-primary-dark);
}

/* Ambient glows */
.ambient-glow {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.ambient-glow--sky {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(122, 184, 212, 0.1) 0%, transparent 70%);
  top: -10%;
  right: -5%;
  animation: drift 16s ease-in-out infinite alternate;
}

.ambient-glow--stone {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(160, 140, 110, 0.06) 0%, transparent 70%);
  bottom: -5%;
  left: -5%;
  animation: drift 20s ease-in-out infinite alternate-reverse;
}

/* Floating lithos */
.floating-lithos {
  position: absolute;
  background: linear-gradient(135deg, rgba(122, 184, 212, 0.12), rgba(74, 127, 165, 0.08));
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-lg);
  animation: float 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

.lithos-1 {
  width: 48px;
  height: 48px;
  top: 15%;
  left: 12%;
  animation-delay: 0s;
}

.lithos-2 {
  width: 64px;
  height: 64px;
  top: 20%;
  right: 10%;
  animation-delay: -2s;
  border-radius: var(--radius-xl);
}

.lithos-3 {
  width: 36px;
  height: 36px;
  bottom: 25%;
  left: 8%;
  animation-delay: -4s;
}

.lithos-4 {
  width: 52px;
  height: 52px;
  bottom: 15%;
  right: 15%;
  animation-delay: -6s;
  border-radius: var(--radius-md);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-18px) rotate(8deg);
  }
}

@keyframes drift {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(15px, -20px) scale(1.08); }
}

/* Responsive */
@media (max-width: 768px) {
  .error-code {
    font-size: 5rem;
  }

  .error-icon .icon {
    width: 44px;
    height: 44px;
  }

  .error-title {
    font-size: var(--font-2xl);
  }

  .error-content {
    padding: var(--spacing-3xl) var(--spacing-lg);
  }

  .error-actions {
    flex-direction: column;
  }

  .floating-lithos {
    display: none;
  }
}
</style>
