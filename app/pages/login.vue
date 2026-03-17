<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Welcome Back</h1>
          <p>Login to access Aeroliths</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="credentials.email"
              type="email"
              required
              placeholder="your.email@example.com"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              required
              placeholder="Enter your password"
              :disabled="isLoading"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <!-- Resend verification option -->
          <div v-if="showResendOption" class="resend-section">
            <button
              type="button"
              @click="handleResend"
              :disabled="resendCooldown > 0"
              class="resend-button"
            >
              <span v-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
              <span v-else>Resend verification email</span>
            </button>
            <p v-if="resendMessage" class="resend-message">{{ resendMessage }}</p>
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            <span v-if="!isLoading">Login</span>
            <span v-else>Logging in...</span>
          </button>
        </form>

        <div class="login-footer">
          <p>
            Don't have an account?
            <NuxtLink to="/register">Register here</NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'default',
  middleware: 'guest'
})

const { login, resendVerification, isLoading } = useAuth()

const credentials = ref({
  email: '',
  password: ''
})

const errorMessage = ref('')
const showResendOption = ref(false)
const resendCooldown = ref(0)
const resendMessage = ref('')
let cooldownInterval: ReturnType<typeof setInterval> | null = null

const startCooldown = () => {
  resendCooldown.value = 60
  cooldownInterval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      if (cooldownInterval) clearInterval(cooldownInterval)
      cooldownInterval = null
    }
  }, 1000)
}

const handleLogin = async () => {
  errorMessage.value = ''
  showResendOption.value = false
  resendMessage.value = ''

  const result = await login(credentials.value)

  if (result.success) {
    navigateTo('/play')
  } else if (result.code === 'EMAIL_NOT_VERIFIED') {
    errorMessage.value = result.error || 'Please verify your email before logging in.'
    showResendOption.value = true
  } else {
    errorMessage.value = result.error || 'Login failed. Please check your credentials.'
  }
}

const handleResend = async () => {
  resendMessage.value = ''
  const result = await resendVerification(credentials.value.email)
  if (result.success) {
    resendMessage.value = 'Verification email sent!'
    startCooldown()
  } else {
    resendMessage.value = result.error || 'Failed to resend. Please try again.'
  }
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval)
})

useHead({
  title: 'Login - Aeroliths',
  meta: [
    { name: 'description', content: 'Login to access Aeroliths game' }
  ]
})
</script>

<style scoped src="~/assets/css/login.css"></style>
