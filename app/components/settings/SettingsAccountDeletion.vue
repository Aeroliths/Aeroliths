<template>
  <div class="deletion-section">
    <h2>Delete my account</h2>

    <div v-if="deletionRequestedAt" class="deletion-pending">
      <p class="deletion-pending-text">
        A deletion request is in progress. Your account will be deleted on
        <strong>{{ formattedDeletionDate }}</strong> if you do not log in before that date.
      </p>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>
      <button class="cancel-deletion-btn" :disabled="loading" @click="cancelDeletion">
        {{ loading ? 'Cancelling...' : 'Cancel deletion' }}
      </button>
    </div>

    <div v-else>
      <p class="deletion-description">
        You can request the deletion of your account. If you do not log in within
        <strong>30 days</strong> of your request, your account and all your data will be
        permanently deleted.
      </p>
      <p class="deletion-description">
        A confirmation email will be sent to you. You can cancel the deletion at any time
        by logging back in.
      </p>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>
      <button class="request-deletion-btn" :disabled="loading" @click="requestDeletion">
        {{ loading ? 'Processing...' : 'Request account deletion' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user, initAuth } = useAuth()

const loading = ref(false)
const error = ref('')
const success = ref('')

onMounted(async () => {
  await initAuth()
})

const deletionRequestedAt = computed(() => user.value?.deletionRequestedAt ?? null)

const formattedDeletionDate = computed(() => {
  if (!deletionRequestedAt.value) return ''
  const requestDate = new Date(deletionRequestedAt.value)
  const deletionDate = new Date(requestDate.getTime() + 30 * 24 * 60 * 60 * 1000)
  return deletionDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
})

const requestDeletion = async () => {
  if (!user.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await $fetch(`/api/users/${user.value.id}/request-deletion`, { method: 'POST' })
    success.value = 'Request sent. You will receive a confirmation email.'
    await initAuth()
    setTimeout(() => { success.value = '' }, 5000)
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'An error occurred.'
  } finally {
    loading.value = false
  }
}

const cancelDeletion = async () => {
  if (!user.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await $fetch(`/api/users/${user.value.id}/cancel-deletion`, { method: 'POST' })
    success.value = 'Your account deletion has been cancelled.'
    await initAuth()
    setTimeout(() => { success.value = '' }, 5000)
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'An error occurred.'
  } finally {
    loading.value = false
  }
}
</script>
