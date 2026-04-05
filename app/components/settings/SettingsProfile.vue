<template>
  <div class="profile-section-wrapper">
    <!-- Profile Card Preview -->
    <div class="profile-card-preview">
      <div class="profile-card-avatar">
        <div class="profile-card-avatar-inner">
          <img v-if="formData.profilePicture" :src="formData.profilePicture" :alt="formData.username" />
          <span v-else class="profile-card-initials">{{ formData.username ? formData.username[0].toUpperCase() : '?' }}</span>
        </div>
        <label class="profile-card-avatar-edit" for="profile-picture-input" :class="{ disabled: loading || uploadingProfilePicture }">
          <span v-if="uploadingProfilePicture" class="avatar-edit-icon spinning">&#x21bb;</span>
          <span v-else class="avatar-edit-icon">&#x270E;</span>
        </label>
      </div>
      <h2 class="profile-card-username">{{ formData.username || 'Username' }}</h2>
      <span class="profile-card-email">{{ formData.email || 'email@example.com' }}</span>
      <span v-if="userRole" class="profile-card-role" :class="'role-' + userRole">{{ userRole }}</span>
    </div>

    <!-- Hidden file input -->
    <input
      id="profile-picture-input"
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
      @change="handleProfilePictureUpload"
      :disabled="loading || uploadingProfilePicture"
      class="hidden-file-input"
    />

    <!-- Edit Form -->
    <form @submit.prevent="handleSubmit" class="settings-form">
      <!-- Profile Picture Actions -->
      <div v-if="formData.profilePicture" class="profile-picture-actions">
        <label for="profile-picture-input" class="change-picture-btn" :class="{ disabled: loading || uploadingProfilePicture }">
          Change Picture
        </label>
        <button type="button" class="remove-picture-btn" @click="removeProfilePicture" :disabled="loading">
          Remove
        </button>
      </div>
      <div v-else class="profile-picture-actions">
        <label for="profile-picture-input" class="change-picture-btn" :class="{ disabled: loading || uploadingProfilePicture }">
          Upload Picture
        </label>
      </div>

      <!-- Email -->
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          placeholder="your@email.com"
          :disabled="loading"
        />
      </div>

      <!-- Username -->
      <div class="form-group">
        <label for="username">Username</label>
        <input
          id="username"
          v-model="formData.username"
          type="text"
          placeholder="Your username"
          :disabled="loading"
        />
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>

      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? 'Updating...' : 'Save Changes' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user, initAuth } = useAuth()

const formData = ref({
  email: '',
  username: '',
  profilePicture: ''
})

const loading = ref(false)
const uploadingProfilePicture = ref(false)
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

const handleProfilePictureUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadingProfilePicture.value = true
  error.value = ''

  try {
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    const response = await $fetch<any>('/api/admin/upload-sprite?type=profile', {
      method: 'POST',
      body: formDataUpload,
    })

    formData.value.profilePicture = response.data.path
  } catch (err: any) {
    error.value = err.data?.statusMessage || err.message || 'Failed to upload profile picture'
  } finally {
    uploadingProfilePicture.value = false
  }
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
        profilePicture: formData.value.profilePicture || null
      }
    })

    success.value = 'Profile updated successfully!'
    await initAuth()

    setTimeout(() => { success.value = '' }, 3000)
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'An error occurred while updating profile'
  } finally {
    loading.value = false
  }
}
</script>
