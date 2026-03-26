<template>
  <form @submit.prevent="handleSubmit" class="settings-form">
    <!-- Profile Picture -->
    <div class="form-group">
      <label for="profile-picture">Profile Picture</label>
      <div class="profile-picture-upload">
        <div v-if="formData.profilePicture" class="profile-picture-preview">
          <img :src="formData.profilePicture" alt="Profile picture" />
          <button
            type="button"
            @click="removeProfilePicture"
            class="remove-btn"
            :disabled="loading"
          >
            Remove
          </button>
        </div>
        <div v-else class="profile-picture-placeholder">
          <span>No profile picture</span>
        </div>
        <input
          id="profile-picture"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          @change="handleProfilePictureUpload"
          :disabled="loading || uploadingProfilePicture"
        />
        <span v-if="uploadingProfilePicture" class="uploading-text">Uploading...</span>
      </div>
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  const fileInput = document.getElementById('profile-picture') as HTMLInputElement
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
