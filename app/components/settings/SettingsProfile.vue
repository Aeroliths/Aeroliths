<template>
  <div class="profile-section-wrapper">
    <!-- Profile Card Preview -->
    <div class="profile-card-preview">
      <div class="profile-card-avatar">
        <div class="profile-card-avatar-inner">
          <img v-if="formData.profilePicture" :src="formData.profilePicture" :alt="formData.username" />
          <span v-else class="profile-card-initials">{{ formData.username ? formData.username[0].toUpperCase() : '?' }}</span>
        </div>
        <label class="profile-card-avatar-edit" for="profile-picture-input" :class="{ disabled: loading }">
          <span class="avatar-edit-icon">&#x270E;</span>
        </label>
      </div>
      <h2 class="profile-card-username">{{ formData.username || $t('settings.profile.usernameFallback') }}</h2>
      <span class="profile-card-email">{{ formData.email || $t('settings.profile.emailFallback') }}</span>
      <span v-if="userRole" class="profile-card-role" :class="'role-' + userRole">{{ userRole }}</span>
    </div>

    <!-- Hidden file input -->
    <input
      id="profile-picture-input"
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
      @change="handleProfilePictureUpload"
      :disabled="loading"
      class="hidden-file-input"
    />

    <!-- Edit Form -->
    <form @submit.prevent="handleSubmit" class="settings-form">
      <!-- Profile Picture Actions -->
      <div v-if="formData.profilePicture" class="profile-picture-actions">
        <label for="profile-picture-input" class="change-picture-btn" :class="{ disabled: loading }">
          {{ $t('settings.profile.changePicture') }}
        </label>
        <button type="button" class="remove-picture-btn" @click="removeProfilePicture" :disabled="loading">
          {{ $t('settings.profile.remove') }}
        </button>
      </div>
      <div v-else class="profile-picture-actions">
        <label for="profile-picture-input" class="change-picture-btn" :class="{ disabled: loading }">
          {{ $t('settings.profile.uploadPicture') }}
        </label>
      </div>

      <!-- Email -->
      <div class="form-group">
        <label for="email">{{ $t('settings.profile.emailLabel') }}</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          :placeholder="$t('settings.profile.emailPlaceholder')"
          :disabled="loading"
        />
      </div>

      <!-- Username -->
      <div class="form-group">
        <label for="username">{{ $t('settings.profile.usernameLabel') }}</label>
        <input
          id="username"
          v-model="formData.username"
          type="text"
          :placeholder="$t('settings.profile.usernamePlaceholder')"
          :disabled="loading"
        />
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>

      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? $t('settings.profile.updating') : $t('settings.profile.saveChanges') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user, initAuth } = useAuth()
const { t } = useI18n()

const formData = ref({
  email: '',
  username: '',
  profilePicture: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const userRole = computed(() => user.value?.role?.name || '')

onMounted(async () => {
  await initAuth()
  if (user.value) {
    formData.value = {
      email: user.value.email || '',
      username: user.value.username || '',
      profilePicture: user.value.profilePicture || ''
    }
  }
})

const handleProfilePictureUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  error.value = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    formData.value.profilePicture = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeProfilePicture = () => {
  formData.value.profilePicture = ''
  const fileInput = document.getElementById('profile-picture-input') as HTMLInputElement
  if (fileInput) fileInput.value = ''
}

const handleSubmit = async () => {
  if (!user.value) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await $fetch(`/api/users/${user.value.id}`, {
      method: 'PATCH',
      body: {
        email: formData.value.email,
        username: formData.value.username,
        profilePicture: formData.value.profilePicture || null,
        folder: 'profile'
      }
    })

    success.value = t('settings.profile.success')
    await initAuth()

    setTimeout(() => { success.value = '' }, 3000)
  } catch (err: any) {
    error.value = err.data?.statusMessage || t('settings.profile.genericError')
  } finally {
    loading.value = false
  }
}
</script>
