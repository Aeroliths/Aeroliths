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
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #1e2a3a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  max-width: 480px;
  width: 90%;
}

.modal h3 {
  margin: 0 0 1rem;
  color: #fff;
  font-size: 1.2rem;
}

.modal p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
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
