<template>
  <div class="register-page">
    <div class="register-container">
      <!-- Verification pending state -->
      <div class="register-card" v-if="registrationComplete">
        <div class="register-header">
          <h1>Check your email</h1>
          <p>We sent a verification link to <strong>{{ registeredEmail }}</strong></p>
        </div>
        <div class="verification-notice">
          <p>Click the link in the email to activate your account. The link expires in 24 hours.</p>
          <button
            @click="handleResend"
            :disabled="resendCooldown > 0 || isLoading"
            class="register-button resend-button"
          >
            <span v-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
            <span v-else>Resend verification email</span>
          </button>
          <p v-if="resendMessage" class="resend-message">{{ resendMessage }}</p>
        </div>
        <div class="register-footer">
          <p>
            Already verified?
            <NuxtLink to="/login">Login here</NuxtLink>
          </p>
        </div>
      </div>

      <!-- Registration form -->
      <div class="register-card" v-else>
        <div class="register-header">
          <h1>Join Aeroliths</h1>
          <p>Create your account to start playing</p>
        </div>

        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="username">Username *</label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              placeholder="Choose a username"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              placeholder="your.email@example.com"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="password">Password *</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              minlength="8"
              placeholder="At least 8 characters"
              :disabled="isLoading"
            />
            <small class="form-hint">Minimum 8 characters</small>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password *</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              placeholder="Re-enter your password"
              :disabled="isLoading"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <HCaptchaWidget ref="captchaRef" v-model="captchaToken" />

          <button type="submit" class="register-button" :disabled="isLoading || !captchaToken">
            <span v-if="!isLoading">Create Account</span>
            <span v-else>Creating account...</span>
          </button>
        </form>

        <div class="register-footer">
          <p>
            Already have an account?
            <NuxtLink to="/login">Login here</NuxtLink>
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
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (formData.value.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long'
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
    errorMessage.value = result.error || 'Registration failed. Please try again.'
    captchaRef.value?.reset()
  }
}

const handleResend = async () => {
  resendMessage.value = ''
  const result = await resendVerification(registeredEmail.value)
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
  title: 'Create an Account - Join the Aeroliths Community for Free',
  description: 'Sign up for a free Aeroliths account in seconds. Build your deck, collect Lithos, climb the ranked leaderboard and join the community.',
  ogTitle: 'Join Aeroliths - Create Your Free Account',
  ogDescription: 'Sign up for free, build your deck, collect Lithos and join the Aeroliths community.',
  robots: 'noindex, follow',
})
</script>

<style scoped src="~/assets/css/register.css"></style>
