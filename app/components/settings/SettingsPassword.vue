<template>
  <div class="password-section">
    <h2>{{ $t('settings.password.title') }}</h2>
    <form @submit.prevent="handlePasswordChange" class="settings-form">
      <div class="form-group">
        <label for="newPassword">{{ $t('settings.password.newPasswordLabel') }}</label>
        <input
          id="newPassword"
          v-model="passwordData.newPassword"
          type="password"
          :placeholder="$t('settings.password.newPasswordPlaceholder')"
          :disabled="passwordLoading"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">{{ $t('settings.password.confirmPasswordLabel') }}</label>
        <input
          id="confirmPassword"
          v-model="passwordData.confirmPassword"
          type="password"
          :placeholder="$t('settings.password.confirmPasswordPlaceholder')"
          :disabled="passwordLoading"
        />
      </div>

      <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
      <div v-if="passwordSuccess" class="success-message">{{ passwordSuccess }}</div>

      <button type="submit" class="submit-btn" :disabled="passwordLoading">
        {{ passwordLoading ? $t('settings.password.changing') : $t('settings.password.changePassword') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()
const { t } = useI18n()

const passwordData = ref({
  newPassword: '',
  confirmPassword: ''
})

const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

const handlePasswordChange = async () => {
  if (!user.value) return

  passwordLoading.value = true
  passwordError.value = ''
  passwordSuccess.value = ''

  if (passwordData.value.newPassword.length < 6) {
    passwordError.value = t('settings.password.tooShort')
    passwordLoading.value = false
    return
  }

  if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    passwordError.value = t('settings.password.mismatch')
    passwordLoading.value = false
    return
  }

  try {
    await $fetch(`/api/users/${user.value.id}/password`, {
      method: 'PATCH',
      body: { password: passwordData.value.newPassword }
    })

    passwordSuccess.value = t('settings.password.success')
    passwordData.value.newPassword = ''
    passwordData.value.confirmPassword = ''

    setTimeout(() => { passwordSuccess.value = '' }, 3000)
  } catch (err: any) {
    passwordError.value = err.data?.statusMessage || t('settings.password.genericError')
  } finally {
    passwordLoading.value = false
  }
}
</script>
