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

          <HCaptchaWidget ref="captchaRef" v-model="captchaToken" />

          <button type="submit" class="login-button" :disabled="isLoading || !captchaToken">
            <span v-if="!isLoading">Login</span>
            <span v-else>Logging in...</span>
          </button>
        </form>

        <OAuthButtons />

        <div class="login-footer">
          <p>
            <NuxtLink to="/forgot-password">Forgot your password?</NuxtLink>
          </p>
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
const route = useRoute()

const oauthErrorMessages: Record<string, string> = {
  oauth_email_unverified:
    'Your Discord email is not verified. Verify it with your provider, or sign in with email and password.',
  oauth_failed: 'Social sign-in failed. Please try again.',
}

const credentials = ref({
  email: '',
  password: ''
})

const initialErrorCode = Array.isArray(route.query.error) ? route.query.error[0] : route.query.error
const errorMessage = ref(
  (initialErrorCode && oauthErrorMessages[initialErrorCode]) || ''
)
const showResendOption = ref(false)
const resendCooldown = ref(0)
const resendMessage = ref('')
const captchaToken = ref('')
const captchaRef = ref<{ reset: () => void } | null>(null)
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

  const result = await login({ ...credentials.value, captchaToken: captchaToken.value })

  if (result.success) {
    navigateTo('/play')
  } else if (result.code === 'EMAIL_NOT_VERIFIED') {
    errorMessage.value = result.error || 'Please verify your email before logging in.'
    showResendOption.value = true
    captchaRef.value?.reset()
  } else {
    errorMessage.value = result.error || 'Login failed. Please check your credentials.'
    captchaRef.value?.reset()
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

useSeoMeta({
  title: 'Login - Access Your Aeroliths Account',
  description: 'Sign in to your Aeroliths account to play, build your deck, manage your collection and challenge other players online.',
  ogTitle: 'Login to Aeroliths',
  ogDescription: 'Sign in to play Aeroliths, build your deck and challenge other players online.',
  robots: 'noindex, follow',
})
</script>

<style scoped src="~/assets/css/login.css"></style>
