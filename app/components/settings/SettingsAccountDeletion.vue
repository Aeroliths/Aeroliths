<template>
  <div class="deletion-section-discreet">
    <div v-if="deletionRequestedAt" class="deletion-pending">
      <p class="deletion-pending-text">
        {{ $t('settings.deletion.inProgress') }}
        <strong>{{ formattedDeletionDate }}</strong>{{ $t('settings.deletion.inProgressSuffix') }}
      </p>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>
      <button class="cancel-deletion-btn" :disabled="loading" @click="cancelDeletion">
        {{ loading ? $t('settings.deletion.cancelling') : $t('settings.deletion.cancelDeletion') }}
      </button>
    </div>

    <div v-else>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>
      <button class="request-deletion-btn" @click="showConfirm = true">
        {{ $t('settings.deletion.deleteMyAccount') }}
      </button>
    </div>

    <!-- Confirmation modal -->
    <Teleport to="body">
      <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm = false">
        <div class="modal">
          <h3>{{ $t('settings.deletion.modalTitle') }}</h3>
          <p>
            {{ $t('settings.deletion.modalP1') }}<strong>{{ $t('settings.deletion.modalP1Bold') }}</strong>{{ $t('settings.deletion.modalP1Suffix') }}
          </p>
          <p>
            {{ $t('settings.deletion.modalP2') }}
          </p>
          <div class="modal-actions">
            <button class="cancel-deletion-btn" :disabled="loading" @click="showConfirm = false">
              {{ $t('settings.deletion.cancel') }}
            </button>
            <button class="request-deletion-btn" :disabled="loading" @click="requestDeletion">
              {{ loading ? $t('settings.deletion.processing') : $t('settings.deletion.confirmDeletion') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user, initAuth } = useAuth()
const { t } = useI18n()

const loading = ref(false)
const error = ref('')
const success = ref('')
const showConfirm = ref(false)

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
    showConfirm.value = false
    success.value = t('settings.deletion.requestSent')
    await initAuth()
    setTimeout(() => { success.value = '' }, 5000)
  } catch (err: any) {
    showConfirm.value = false
    error.value = err.data?.statusMessage || t('settings.deletion.genericError')
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
    success.value = t('settings.deletion.cancelledSuccess')
    await initAuth()
    setTimeout(() => { success.value = '' }, 5000)
  } catch (err: any) {
    error.value = err.data?.statusMessage || t('settings.deletion.genericError')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 18, 0.78);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.modal {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-xl);
  max-width: 480px;
  width: 90%;
  box-shadow: var(--shadow-2xl);
}

.modal h3 {
  margin: 0 0 1rem;
  color: var(--color-text-primary);
  font-size: var(--font-2xl);
}

.modal p {
  color: var(--color-text-muted);
  font-size: var(--font-base);
  line-height: 1.6;
  margin: 0 0 0.75rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
