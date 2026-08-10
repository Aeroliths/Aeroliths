<template>
  <div class="username-page">
    <div class="username-container">
      <div class="username-card">
        <div class="username-header">
          <h1>{{ $t('auth.chooseUsername.title') }}</h1>
          <p v-if="pendingEmail">
            {{ $t('auth.chooseUsername.signingUpAs') }}<strong>{{ pendingEmail }}</strong>
            <span v-if="pendingProvider">{{ $t('auth.chooseUsername.via') }}{{ providerLabel }}</span>
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="username-form">
          <div class="form-group">
            <label for="username">{{ $t('auth.chooseUsername.usernameLabel') }}</label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              minlength="3"
              maxlength="30"
              :placeholder="$t('auth.chooseUsername.usernamePlaceholder')"
              :disabled="isSubmitting"
              autofocus
            />
            <small class="form-hint">{{ $t('auth.chooseUsername.usernameHint') }}</small>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="username-button" :disabled="isSubmitting || !isValid">
            <span v-if="!isSubmitting">{{ $t('auth.chooseUsername.submit') }}</span>
            <span v-else>{{ $t('auth.chooseUsername.submitting') }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
const localePath = useLocalePath()
const { data } = await useFetch('/api/auth/oauth/pending')

// No onboarding session in progress -> send the user back to login
if (!data.value?.pending) {
  await navigateTo(localePath('/login'))
}

const pendingEmail = computed(() => data.value?.email ?? '')
const pendingProvider = computed(() => data.value?.provider ?? '')
const providerLabel = computed(() => (pendingProvider.value === 'discord' ? 'Discord' : ''))

const username = ref(data.value?.suggestedUsername ?? '')
const errorMessage = ref('')
const isSubmitting = ref(false)

const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
const isValid = computed(() => usernameRegex.test(username.value.trim()))

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!isValid.value) {
    errorMessage.value = t('auth.chooseUsername.usernameFormatError')
    return
  }

  isSubmitting.value = true
  try {
    await $fetch('/api/auth/oauth/complete', {
      method: 'POST',
      body: { username: username.value.trim() },
      credentials: 'include',
    })
    await navigateTo(localePath('/play'))
  } catch (error: any) {
    errorMessage.value = error.data?.message || error.message || t('auth.chooseUsername.genericError')
  } finally {
    isSubmitting.value = false
  }
}

useSeoMeta({
  title: () => t('auth.chooseUsername.meta.title'),
  robots: 'noindex, nofollow',
})
</script>

<style scoped>
.username-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.username-container {
  width: 100%;
  max-width: 450px;
}

.username-card {
  background: var(--bg-glass-light);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-3xl) var(--spacing-2xl);
  box-shadow: var(--shadow-2xl);
}

.username-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.username-header h1 {
  font-size: var(--font-4xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.username-header p {
  color: var(--color-text-muted);
  margin: 0;
  font-size: var(--font-md);
}

.username-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.username-form .form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.username-form .form-group label {
  color: var(--color-text-secondary);
  font-weight: var(--font-medium);
  font-size: var(--font-base);
}

.username-form .form-group input {
  padding: 0.875rem var(--spacing-md);
  background: var(--bg-glass-light);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: var(--font-md);
  transition: var(--transition-all);
}

.username-form .form-group input:focus {
  outline: none;
  border-color: var(--color-info);
  background: var(--bg-glass-medium);
  box-shadow: var(--shadow-focus);
}

.form-hint {
  color: var(--color-text-muted);
  font-size: var(--font-sm);
}

.error-message {
  padding: 0.875rem;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-lg);
  color: var(--color-error-light);
  font-size: var(--font-sm);
  text-align: center;
}

.username-button {
  padding: var(--spacing-md);
  background: var(--gradient-brand);
  border: none;
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-all);
}

.username-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.username-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
