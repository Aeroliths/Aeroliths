<template>
  <div class="verify-email-page">
    <div class="verify-email-container">
      <!-- Loading -->
      <div v-if="status === 'loading'" class="verify-email-card">
        <h1>{{ $t('auth.verifyEmail.verifyingTitle') }}</h1>
        <p class="loading-spinner">{{ $t('auth.verifyEmail.verifyingDesc') }}</p>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="verify-email-card success">
        <h1>{{ $t('auth.verifyEmail.successTitle') }}</h1>
        <p>{{ message }}</p>
        <NuxtLinkLocale to="/login" class="verify-link">{{ $t('auth.verifyEmail.goToLogin') }}</NuxtLinkLocale>
      </div>

      <!-- Error -->
      <div v-else class="verify-email-card error">
        <h1>{{ $t('auth.verifyEmail.failedTitle') }}</h1>
        <p>{{ message }}</p>
        <NuxtLinkLocale to="/register" class="verify-link">{{ $t('auth.verifyEmail.backToRegister') }}</NuxtLinkLocale>
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
const { t } = useI18n()
const status = ref<'loading' | 'success' | 'error'>('loading')
const message = ref('')

onMounted(async () => {
  const { token, email } = route.query

  if (!token || !email) {
    status.value = 'error'
    message.value = t('auth.verifyEmail.invalidLink')
    return
  }

  try {
    const response = await $fetch<{ message: string }>('/api/auth/verify-email', {
      params: { token, email },
    })
    status.value = 'success'
    message.value = response.message || t('auth.verifyEmail.successFallback')
  } catch (error: any) {
    status.value = 'error'
    message.value = error.data?.message || t('auth.verifyEmail.failedFallback')
  }
})

useSeoMeta({
  title: () => t('auth.verifyEmail.meta.title'),
  description: () => t('auth.verifyEmail.meta.description'),
  robots: 'noindex, nofollow',
})
</script>

<style scoped src="~/assets/css/verify-email.css"></style>
