<template>
  <div class="register-page">
    <div class="register-container">
      <!-- Verification pending state -->
      <div class="register-card" v-if="registrationComplete">
        <div class="register-header">
          <h1>{{ $t('auth.register.checkEmailTitle') }}</h1>
          <p>{{ $t('auth.register.checkEmailDesc') }}<strong>{{ registeredEmail }}</strong></p>
        </div>
        <div class="verification-notice">
          <p>{{ $t('auth.register.checkEmailInstructions') }}</p>
          <button
            @click="handleResend"
            :disabled="resendCooldown > 0 || isLoading"
            class="register-button resend-button"
          >
            <span v-if="resendCooldown > 0">{{ $t('auth.register.resendCooldown', { seconds: resendCooldown }) }}</span>
            <span v-else>{{ $t('auth.register.resendVerification') }}</span>
          </button>
          <p v-if="resendMessage" class="resend-message">{{ resendMessage }}</p>
        </div>
        <div class="register-footer">
          <p>
            {{ $t('auth.register.alreadyVerified') }}
            <NuxtLinkLocale to="/login">{{ $t('auth.register.loginHere') }}</NuxtLinkLocale>
          </p>
        </div>
      </div>

      <!-- Registration form -->
      <div class="register-card" v-else>
        <div class="register-header">
          <h1>{{ $t('auth.register.title') }}</h1>
          <p>{{ $t('auth.register.subtitle') }}</p>
        </div>

        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="username">{{ $t('auth.register.usernameLabel') }}</label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              :placeholder="$t('auth.register.usernamePlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="email">{{ $t('auth.register.emailLabel') }}</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              :placeholder="$t('auth.register.emailPlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="password">{{ $t('auth.register.passwordLabel') }}</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              minlength="8"
              :placeholder="$t('auth.register.passwordPlaceholder')"
              :disabled="isLoading"
            />
            <small class="form-hint">{{ $t('auth.register.passwordHint') }}</small>
          </div>

          <div class="form-group">
            <label for="confirmPassword">{{ $t('auth.register.confirmPasswordLabel') }}</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              :placeholder="$t('auth.register.confirmPasswordPlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <HCaptchaWidget ref="captchaRef" v-model="captchaToken" />

          <button type="submit" class="register-button" :disabled="isLoading || !captchaToken">
            <span v-if="!isLoading">{{ $t('auth.register.submit') }}</span>
            <span v-else>{{ $t('auth.register.submitting') }}</span>
          </button>
        </form>

        <OAuthButtons />

        <div class="register-footer">
          <p>
            {{ $t('auth.register.alreadyHaveAccount') }}
            <NuxtLinkLocale to="/login">{{ $t('auth.register.loginHere2') }}</NuxtLinkLocale>
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

const { register, resendVerification, isLoading } = useAuth()
const { t } = useI18n()

const formData = ref({
  email: '',
  username: '',
  password: ''
})

const confirmPassword = ref('')
const errorMessage = ref('')
const registrationComplete = ref(false)
const registeredEmail = ref('')
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

const handleRegister = async () => {
  errorMessage.value = ''

  if (formData.value.password !== confirmPassword.value) {
    errorMessage.value = t('auth.register.passwordMismatch')
    return
  }

  if (formData.value.password.length < 8) {
    errorMessage.value = t('auth.register.passwordTooShort')
    return
  }

  const registrationData = {
    email: formData.value.email,
    username: formData.value.username,
    password: formData.value.password,
    captchaToken: captchaToken.value,
  }

  const result = await register(registrationData)

  if (result.success && result.needsVerification) {
    registrationComplete.value = true
    registeredEmail.value = result.email || formData.value.email
    startCooldown()
  } else if (!result.success) {
    errorMessage.value = result.error || t('auth.register.registrationFailed')
    captchaRef.value?.reset()
  }
}

const handleResend = async () => {
  resendMessage.value = ''
  const result = await resendVerification(registeredEmail.value)
  if (result.success) {
    resendMessage.value = t('auth.register.verificationSent')
    startCooldown()
  } else {
    resendMessage.value = result.error || t('auth.register.resendFailed')
  }
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval)
})

useSeoMeta({
  title: () => t('auth.register.meta.title'),
  description: () => t('auth.register.meta.description'),
  ogTitle: 'Join Aeroliths - Create Your Free Account',
  ogDescription: 'Sign up for free, build your deck, collect Lithos and join the Aeroliths community.',
  robots: 'noindex, follow',
})
</script>

<style scoped src="~/assets/css/register.css"></style>
