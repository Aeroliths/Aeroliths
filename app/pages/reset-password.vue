<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>{{ $t('auth.resetPassword.title') }}</h1>
          <p>{{ $t('auth.resetPassword.subtitle') }}</p>
        </div>

        <form v-if="!success" @submit.prevent="handleReset" class="login-form">
          <div class="form-group">
            <label for="password">{{ $t('auth.resetPassword.passwordLabel') }}</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              :placeholder="$t('auth.resetPassword.passwordPlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">{{ $t('auth.resetPassword.confirmPasswordLabel') }}</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              :placeholder="$t('auth.resetPassword.confirmPasswordPlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            <span v-if="!isLoading">{{ $t('auth.resetPassword.submit') }}</span>
            <span v-else>{{ $t('auth.resetPassword.submitting') }}</span>
          </button>
        </form>

        <div v-else class="reset-success">
          <p>{{ $t('auth.resetPassword.successTitle') }}</p>
          <p>{{ $t('auth.resetPassword.successDesc') }}</p>
          <NuxtLink to="/login" class="reset-login-link">{{ $t('auth.resetPassword.goToLogin') }}</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'guest'
})

const route = useRoute()
const { t } = useI18n()

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const success = ref(false)

const token = route.query.token as string
const email = route.query.email as string

if (!token || !email) {
  navigateTo('/forgot-password')
}

const handleReset = async () => {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = t('auth.resetPassword.passwordMismatch')
    return
  }

  isLoading.value = true

  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token,
        email,
        password: password.value,
      },
    })
    success.value = true
  } catch (error: any) {
    errorMessage.value = error.data?.message || t('auth.resetPassword.genericError')
  } finally {
    isLoading.value = false
  }
}

useSeoMeta({
  title: () => t('auth.resetPassword.meta.title'),
  description: () => t('auth.resetPassword.meta.description'),
  robots: 'noindex, follow',
})
</script>

<style scoped src="~/assets/css/login.css"></style>

<style scoped>
.reset-success {
  text-align: center;
  padding: var(--spacing-xl) 0;
}

.reset-success p {
  color: var(--color-text-muted);
  font-size: var(--font-base);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--spacing-xs) 0;
}

.reset-success p:first-child {
  color: var(--color-brand-primary);
  font-weight: var(--font-medium);
}

.reset-login-link {
  display: inline-block;
  margin-top: var(--spacing-lg);
  padding: var(--spacing-sm) var(--spacing-xl);
  background: var(--gradient-brand);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-weight: var(--font-semibold);
  text-decoration: none;
  transition: var(--transition-all);
}

.reset-login-link:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}
</style>
