<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>{{ $t('auth.forgotPassword.title') }}</h1>
          <p>{{ $t('auth.forgotPassword.subtitle') }}</p>
        </div>

        <form v-if="!submitted" @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="email">{{ $t('auth.forgotPassword.emailLabel') }}</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              :placeholder="$t('auth.forgotPassword.emailPlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            <span v-if="!isLoading">{{ $t('auth.forgotPassword.submit') }}</span>
            <span v-else>{{ $t('auth.forgotPassword.submitting') }}</span>
          </button>
        </form>

        <div v-else class="reset-success">
          <p>{{ $t('auth.forgotPassword.successMessage') }}</p>
          <p>{{ $t('auth.forgotPassword.checkInbox') }}</p>
        </div>

        <div class="login-footer">
          <p>
            {{ $t('auth.forgotPassword.rememberPassword') }}
            <NuxtLinkLocale to="/login">{{ $t('auth.forgotPassword.backToLogin') }}</NuxtLinkLocale>
          </p>
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

const { t } = useI18n()
const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const submitted = ref(false)

const handleSubmit = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    })
    submitted.value = true
  } catch (error: any) {
    errorMessage.value = error.data?.message || t('auth.forgotPassword.genericError')
  } finally {
    isLoading.value = false
  }
}

useSeoMeta({
  title: () => t('auth.forgotPassword.meta.title'),
  description: () => t('auth.forgotPassword.meta.description'),
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
</style>
