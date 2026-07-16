<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal report-modal" @click.stop>
      <h3>{{ $t('friends.reportModal.titlePrefix') }}{{ targetUsername }}</h3>
      <p class="report-hint">
        {{ $t('friends.reportModal.desc') }}
      </p>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label>{{ $t('friends.reportModal.whatAreYouReporting') }}</label>
          <div class="report-type-options">
            <label class="report-type-option" :class="{ active: form.type === 'username' }">
              <input
                type="radio"
                v-model="form.type"
                value="username"
                :disabled="loading"
              />
              <span>{{ $t('friends.reportModal.username') }}</span>
            </label>
            <label
              class="report-type-option"
              :class="{ active: form.type === 'profile_picture', disabled: !hasProfilePicture }"
            >
              <input
                type="radio"
                v-model="form.type"
                value="profile_picture"
                :disabled="loading || !hasProfilePicture"
              />
              <span>{{ $t('friends.reportModal.profilePicture') }}</span>
            </label>
          </div>
          <small v-if="!hasProfilePicture" class="hint-muted">
            {{ $t('friends.reportModal.noProfilePicture') }}
          </small>
        </div>

        <div class="form-group">
          <label for="report-reason">{{ $t('friends.reportModal.reasonLabel') }} <span class="optional-tag">{{ $t('friends.reportModal.reasonOptional') }}</span></label>
          <textarea
            id="report-reason"
            v-model="form.reason"
            rows="4"
            maxlength="500"
            :placeholder="$t('friends.reportModal.reasonPlaceholder')"
            :disabled="loading"
          />
          <small class="hint-muted">{{ form.reason.length }}{{ $t('friends.reportModal.charCountSuffix') }}</small>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>

        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="$emit('close')" :disabled="loading">
            {{ $t('friends.reportModal.cancel') }}
          </button>
          <button type="submit" class="btn-danger" :disabled="loading || !canSubmit">
            {{ loading ? $t('friends.reportModal.submitting') : $t('friends.reportModal.submit') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const { t } = useI18n()

const props = defineProps<{
  targetUserId: string
  targetUsername: string
  hasProfilePicture: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submitted'): void
}>()

const form = ref({
  type: props.hasProfilePicture ? 'profile_picture' : 'username',
  reason: '',
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const canSubmit = computed(() => !!form.value.type)

const submit = async () => {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await $fetch('/api/reports', {
      method: 'POST',
      body: {
        reportedUserId: props.targetUserId,
        type: form.value.type,
        reason: form.value.reason.trim(),
      },
    })
    success.value = t('friends.reportModal.submitted')
    emit('submitted')
    setTimeout(() => emit('close'), 1200)
  } catch (e: any) {
    error.value = e.data?.statusMessage || e.data?.message || t('friends.reportModal.submitFailed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
}

.report-modal {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-xl);
  max-width: 480px;
  width: 100%;
  color: var(--color-text-primary);
  box-shadow: var(--shadow-2xl);
}

.report-modal h3 {
  margin: 0 0 var(--spacing-xs);
  font-size: var(--font-2xl);
}

.report-hint {
  color: var(--color-text-muted);
  font-size: var(--font-sm);
  margin: 0 0 var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group > label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: var(--font-medium);
}

.optional-tag {
  color: var(--color-text-subtle);
  font-weight: var(--font-normal);
  font-size: var(--font-xs);
}

.report-type-options {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.report-type-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--bg-glass-lighter);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  font-size: var(--font-sm);
}

.report-type-option.active {
  background: var(--bg-glass-medium);
  border-color: var(--color-brand-primary);
}

.report-type-option.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-glass-medium);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--font-sm);
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: var(--shadow-focus);
}

.hint-muted {
  display: block;
  margin-top: 4px;
  color: var(--color-text-subtle);
  font-size: var(--font-xs);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.modal-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: var(--font-medium);
  font-size: var(--font-sm);
  transition: opacity var(--transition-fast);
}

.modal-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cancel-btn {
  background: var(--bg-glass-medium);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-light) !important;
}

.btn-danger {
  background: var(--color-error);
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  opacity: 0.85;
}
</style>
