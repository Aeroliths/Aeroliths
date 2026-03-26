<template>
  <div class="deletion-section">
    <h2>Supprimer mon compte</h2>

    <div v-if="deletionRequestedAt" class="deletion-pending">
      <p class="deletion-pending-text">
        Une demande de suppression est en cours. Votre compte sera supprimé le
        <strong>{{ formattedDeletionDate }}</strong> si vous ne vous reconnectez pas avant cette date.
      </p>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>
      <button class="cancel-deletion-btn" :disabled="loading" @click="cancelDeletion">
        {{ loading ? 'Annulation...' : 'Annuler la suppression' }}
      </button>
    </div>

    <div v-else>
      <p class="deletion-description">
        Vous pouvez demander la suppression de votre compte. Si vous ne vous reconnectez pas dans les
        <strong>30 jours</strong> suivant votre demande, votre compte et toutes vos données seront
        définitivement supprimés.
      </p>
      <p class="deletion-description">
        Un e-mail de confirmation vous sera envoyé. Vous pouvez annuler la suppression à tout moment
        en vous reconnectant.
      </p>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>
      <button class="request-deletion-btn" :disabled="loading" @click="requestDeletion">
        {{ loading ? 'Traitement...' : 'Demander la suppression de mon compte' }}
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
  return deletionDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
})

const requestDeletion = async () => {
  if (!user.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await $fetch(`/api/users/${user.value.id}/request-deletion`, { method: 'POST' })
    success.value = 'Demande envoyée. Vous recevrez un e-mail de confirmation.'
    await initAuth()
    setTimeout(() => { success.value = '' }, 5000)
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Une erreur est survenue.'
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
    success.value = 'La suppression de votre compte a été annulée.'
    await initAuth()
    setTimeout(() => { success.value = '' }, 5000)
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Une erreur est survenue.'
  } finally {
    loading.value = false
  }
}
</script>
