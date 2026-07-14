<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>{{ $t('auth.login.title') }}</h1>
          <p>{{ $t('auth.login.subtitle') }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">{{ $t('auth.login.emailLabel') }}</label>
            <input
              id="email"
              v-model="credentials.email"
              type="email"
              required
              :placeholder="$t('auth.login.emailPlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="password">{{ $t('auth.login.passwordLabel') }}</label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              required
              :placeholder="$t('auth.login.passwordPlaceholder')"
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
              <span v-if="resendCooldown > 0">{{ $t('auth.login.resendCooldown', { seconds: resendCooldown }) }}</span>
              <span v-else>{{ $t('auth.login.resendVerification') }}</span>
            </button>
            <p v-if="resendMessage" class="resend-message">{{ resendMessage }}</p>
          </div>

          <HCaptchaWidget ref="captchaRef" v-model="captchaToken" />

          <button type="submit" class="login-button" :disabled="isLoading || !captchaToken">
            <span v-if="!isLoading">{{ $t('auth.login.submit') }}</span>
            <span v-else>{{ $t('auth.login.submitting') }}</span>
          </button>
        </form>

        <OAuthButtons />

        <div class="login-footer">
          <p>
            <NuxtLink to="/forgot-password">{{ $t('auth.login.forgotPassword') }}</NuxtLink>
          </p>
          <p>
            {{ $t('auth.login.noAccount') }}
            <NuxtLink to="/register">{{ $t('auth.login.registerHere') }}</NuxtLink>
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
const { t } = useI18n()

const oauthErrorMessages: Record<string, string> = {
  oauth_email_unverified: t('auth.login.discordEmailNotVerified'),
  oauth_failed: t('auth.login.socialSignInFailed'),
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
    errorMessage.value = result.error || t('auth.login.verifyBeforeLogin')
    showResendOption.value = true
    captchaRef.value?.reset()
  } else {
    errorMessage.value = result.error || t('auth.login.loginFailed')
    captchaRef.value?.reset()
  }
}

const handleResend = async () => {
  resendMessage.value = ''
  const result = await resendVerification(credentials.value.email)
  if (result.success) {
    resendMessage.value = t('auth.login.verificationSent')
    startCooldown()
  } else {
    resendMessage.value = result.error || t('auth.login.resendFailed')
  }
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval)
})

useSeoMeta({
  title: () => t('auth.login.meta.title'),
  description: () => t('auth.login.meta.description'),
  ogTitle: 'Login to Aeroliths',
  ogDescription: 'Sign in to play Aeroliths, build your deck and challenge other players online.',
  robots: 'noindex, follow',
})
</script>

<style scoped src="~/assets/css/login.css"></style>
