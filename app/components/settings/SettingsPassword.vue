<template>
  <div class="password-section">
    <h2>Change Password</h2>
    <form @submit.prevent="handlePasswordChange" class="settings-form">
      <div class="form-group">
        <label for="newPassword">New Password</label>
        <input
          id="newPassword"
          v-model="passwordData.newPassword"
          type="password"
          placeholder="New password"
          :disabled="passwordLoading"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          v-model="passwordData.confirmPassword"
          type="password"
          placeholder="Confirm password"
          :disabled="passwordLoading"
        />
      </div>

      <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
      <div v-if="passwordSuccess" class="success-message">{{ passwordSuccess }}</div>

      <button type="submit" class="submit-btn" :disabled="passwordLoading">
        {{ passwordLoading ? 'Changing...' : 'Change Password' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()

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
    passwordError.value = 'Password must be at least 6 characters long'
    passwordLoading.value = false
    return
  }

  if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    passwordError.value = 'Passwords do not match'
    passwordLoading.value = false
    return
  }

  try {
    await $fetch(`/api/users/${user.value.id}/password`, {
      method: 'PATCH',
      body: { password: passwordData.value.newPassword }
    })

    passwordSuccess.value = 'Password changed successfully!'
    passwordData.value.newPassword = ''
    passwordData.value.confirmPassword = ''

    setTimeout(() => { passwordSuccess.value = '' }, 3000)
  } catch (err: any) {
    passwordError.value = err.data?.statusMessage || 'An error occurred while changing password'
  } finally {
    passwordLoading.value = false
  }
}
</script>
