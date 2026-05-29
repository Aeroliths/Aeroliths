<template>
  <div class="verify-email-page">
    <div class="verify-email-container">
      <!-- Loading -->
      <div v-if="status === 'loading'" class="verify-email-card">
        <h1>Verifying...</h1>
        <p class="loading-spinner">Please wait while we verify your email address.</p>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="verify-email-card success">
        <h1>Email Verified!</h1>
        <p>{{ message }}</p>
        <NuxtLink to="/login" class="verify-link">Go to Login</NuxtLink>
      </div>

      <!-- Error -->
      <div v-else class="verify-email-card error">
        <h1>Verification Failed</h1>
        <p>{{ message }}</p>
        <NuxtLink to="/register" class="verify-link">Back to Register</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const status = ref<'loading' | 'success' | 'error'>('loading')
const message = ref('')

onMounted(async () => {
  const { token, email } = route.query

  if (!token || !email) {
    status.value = 'error'
    message.value = 'Invalid verification link.'
    return
  }

  try {
    const response = await $fetch<{ message: string }>('/api/auth/verify-email', {
      params: { token, email },
    })
    status.value = 'success'
    message.value = response.message || 'Your email has been verified. You can now log in.'
  } catch (error: any) {
    status.value = 'error'
    message.value = error.data?.message || 'Verification failed. The link may be expired or invalid.'
  }
})

useSeoMeta({
  title: 'Verify Email - Aeroliths',
  description: 'Verify your email address for Aeroliths.',
  robots: 'noindex, nofollow',
})
</script>

<style scoped src="~/assets/css/verify-email.css"></style>
