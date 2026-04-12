<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a reset link</p>
        </div>

        <form v-if="!submitted" @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="your.email@example.com"
              :disabled="isLoading"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            <span v-if="!isLoading">Send Reset Link</span>
            <span v-else>Sending...</span>
          </button>
        </form>

        <div v-else class="reset-success">
          <p>If an account exists with this email, you will receive a password reset link shortly.</p>
          <p>Check your inbox and spam folder.</p>
        </div>

        <div class="login-footer">
          <p>
            Remember your password?
            <NuxtLink to="/login">Back to login</NuxtLink>
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
    errorMessage.value = error.data?.message || 'An error occurred. Please try again.'
  } finally {
    isLoading.value = false
  }
}

useSeoMeta({
  title: 'Forgot Password – Aeroliths',
  description: 'Reset your Aeroliths account password.',
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
