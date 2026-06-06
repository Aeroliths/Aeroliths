<template>
  <div class="tab-content">
    <h2>User Management</h2>

    <!-- Search Bar -->
    <div class="search-bar">
      <input
        v-model="userSearchQuery"
        type="text"
        placeholder="Search users by username, email, or name..."
        class="search-input"
      />
      <span class="search-icon">🔍</span>
    </div>

    <div v-if="usersLoading" class="loading">Loading users...</div>
    <div v-if="usersError" class="error-message">{{ usersError }}</div>
    <div v-if="usersSuccess" class="success-message">{{ usersSuccess }}</div>

    <!-- Users Table -->
    <div v-if="!usersLoading && filteredUsers.length > 0" class="users-table">
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Verified</th>
            <th>Role</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="userItem in filteredUsers" :key="userItem.id">
            <td>{{ userItem.username }}</td>
            <td>{{ userItem.email }}</td>
            <td>
              <span :class="['verified-badge', userItem.emailVerified ? 'verified' : 'unverified']">
                {{ userItem.emailVerified ? '✓ Verified' : '✗ Unverified' }}
              </span>
            </td>
            <td>
              <span :class="['role-badge', userItem.role.name]">
                {{ userItem.role.name }}
              </span>
            </td>
            <td>{{ formatDate(userItem.createdAt) }}</td>
            <td class="actions">
              <button
                v-if="userItem.id !== user?.id"
                @click="openEditUserModal(userItem)"
                class="btn-edit"
                :disabled="actionLoading"
              >
                Edit
              </button>
              <button
                v-if="userItem.id !== user?.id"
                @click="toggleUserRole(userItem)"
                class="btn-role"
                :disabled="actionLoading"
              >
                {{ userItem.role.name === 'user' ? 'Make Admin' : 'Remove Admin' }}
              </button>
              <button
                v-if="userItem.id !== user?.id"
                @click="deleteUser(userItem)"
                class="btn-delete"
                :disabled="actionLoading"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!usersLoading && filteredUsers.length === 0 && userSearchQuery === ''" class="no-data">
      No users found.
    </div>
    <div v-if="!usersLoading && filteredUsers.length === 0 && userSearchQuery !== ''" class="no-data">
      No users match your search.
    </div>
  </div>

  <!-- Edit User Modal -->
  <div v-if="showEditUserModal" class="modal-overlay" @click="closeEditUserModal">
    <div class="modal" @click.stop>
      <h3>Edit User</h3>
      <form @submit.prevent="updateUser">
        <div class="form-group">
          <label for="edit-profile-picture">Profile Picture</label>
          <div class="profile-picture-upload">
            <div v-if="editUserForm.profilePicture" class="profile-picture-preview">
              <img :src="editUserForm.profilePicture" alt="Profile picture" />
              <button
                type="button"
                @click="removeUserProfilePicture"
                class="remove-btn"
                :disabled="modalLoading"
              >
                Remove
              </button>
            </div>
            <div v-else class="profile-picture-placeholder">
              <span>No profile picture</span>
            </div>
            <input
              id="edit-profile-picture"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              @change="handleUserProfilePictureUpload"
              :disabled="modalLoading || uploadingUserProfilePicture"
            />
            <span v-if="uploadingUserProfilePicture" class="uploading-text">Uploading...</span>
          </div>
        </div>

        <div class="form-group">
          <label for="edit-username">Username</label>
          <input id="edit-username" v-model="editUserForm.username" type="text" required />
        </div>
        <div class="form-group">
          <label for="edit-email">Email</label>
          <input id="edit-email" v-model="editUserForm.email" type="email" required />
        </div>
        <div v-if="modalError" class="error-message">{{ modalError }}</div>
        <div class="modal-actions">
          <button type="button" @click="closeEditUserModal" :disabled="modalLoading">Cancel</button>
          <button type="submit" :disabled="modalLoading">
            {{ modalLoading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Confirmation Modal -->
  <div v-if="showConfirmModal" class="modal-overlay" @click="cancelConfirm">
    <div class="modal modal-confirm" @click.stop>
      <h3>{{ confirmTitle }}</h3>
      <p>{{ confirmMessage }}</p>
      <div class="modal-actions">
        <button type="button" @click="cancelConfirm" :disabled="confirmLoading">Cancel</button>
        <button
          type="button"
          @click="confirmAction"
          :disabled="confirmLoading"
          :class="confirmDanger ? 'btn-danger' : ''"
        >
          {{ confirmLoading ? 'Processing...' : confirmButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user, initAuth } = useAuth()

const users = ref<any[]>([])
const usersLoading = ref(false)
const usersError = ref('')
const usersSuccess = ref('')
const userSearchQuery = ref('')
const actionLoading = ref(false)

const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return users.value
  const query = userSearchQuery.value.toLowerCase()
  return users.value.filter((userItem) => {
    const username = userItem.username?.toLowerCase() || ''
    const email = userItem.email?.toLowerCase() || ''
    return username.includes(query) || email.includes(query)
  })
})

// Confirmation modal
const showConfirmModal = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmButtonText = ref('Confirm')
const confirmDanger = ref(false)
const confirmLoading = ref(false)
const confirmCallback = ref<(() => Promise<void>) | null>(null)

const openConfirmModal = (
  title: string,
  message: string,
  callback: () => Promise<void>,
  buttonText: string = 'Confirm',
  danger: boolean = false
) => {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmButtonText.value = buttonText
  confirmDanger.value = danger
  confirmCallback.value = callback
  showConfirmModal.value = true
}

const cancelConfirm = () => {
  showConfirmModal.value = false
  confirmCallback.value = null
  confirmLoading.value = false
}

const confirmAction = async () => {
  if (!confirmCallback.value) return
  confirmLoading.value = true
  try {
    await confirmCallback.value()
    showConfirmModal.value = false
    confirmCallback.value = null
  } catch {}
  finally {
    confirmLoading.value = false
  }
}

// Edit user modal
const showEditUserModal = ref(false)
const editUserForm = ref({ id: '', username: '', email: '', profilePicture: '' })
const uploadingUserProfilePicture = ref(false)
const modalLoading = ref(false)
const modalError = ref('')

const fetchUsers = async () => {
  usersLoading.value = true
  usersError.value = ''
  try {
    const response = await $fetch<any>('/api/admin/users')
    users.value = response.data.users
  } catch (error: any) {
    usersError.value = error.data?.statusMessage || 'Failed to load users'
  } finally {
    usersLoading.value = false
  }
}

const openEditUserModal = (userItem: any) => {
  editUserForm.value = {
    id: userItem.id,
    username: userItem.username,
    email: userItem.email,
    profilePicture: userItem.profilePicture || '',
  }
  modalError.value = ''
  showEditUserModal.value = true
}

const closeEditUserModal = () => {
  showEditUserModal.value = false
  editUserForm.value = { id: '', username: '', email: '', profilePicture: '' }
  modalError.value = ''
}

const handleUserProfilePictureUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadingUserProfilePicture.value = true
  modalError.value = ''

  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await $fetch<any>('/api/admin/upload-sprite?type=profile', { method: 'POST', body: formData })
    editUserForm.value.profilePicture = response.data.path
  } catch (error: any) {
    modalError.value = error.data?.statusMessage || error.message || 'Failed to upload profile picture'
  } finally {
    uploadingUserProfilePicture.value = false
  }
}

const removeUserProfilePicture = () => {
  editUserForm.value.profilePicture = ''
  const fileInput = document.getElementById('edit-profile-picture') as HTMLInputElement
  if (fileInput) fileInput.value = ''
}

const updateUser = async () => {
  modalLoading.value = true
  modalError.value = ''
  try {
    await $fetch(`/api/users/${editUserForm.value.id}`, {
      method: 'PATCH',
      body: {
        username: editUserForm.value.username,
        email: editUserForm.value.email,
        profilePicture: editUserForm.value.profilePicture || null,
      },
    })
    usersSuccess.value = 'User updated successfully'
    closeEditUserModal()
    await fetchUsers()
    setTimeout(() => { usersSuccess.value = '' }, 3000)
  } catch (error: any) {
    modalError.value = error.data?.statusMessage || 'Failed to update user'
  } finally {
    modalLoading.value = false
  }
}

const toggleUserRole = (userItem: any) => {
  const action = userItem.role.name === 'user' ? 'promote' : 'demote'
  const actionText = userItem.role.name === 'user' ? 'Make Admin' : 'Remove Admin'

  openConfirmModal(
    actionText,
    `Are you sure you want to ${action} ${userItem.username}?`,
    async () => {
      actionLoading.value = true
      usersError.value = ''
      try {
        const newRole = userItem.role.name === 'user' ? 'admin' : 'user'
        await $fetch(`/api/admin/users/${userItem.id}/role`, {
          method: 'PATCH',
          body: { roleName: newRole },
        })
        usersSuccess.value = 'User role updated successfully'
        await fetchUsers()
        setTimeout(() => { usersSuccess.value = '' }, 3000)
      } catch (error: any) {
        usersError.value = error.data?.statusMessage || 'Failed to update user role'
        throw error
      } finally {
        actionLoading.value = false
      }
    },
    actionText,
    false
  )
}

const deleteUser = (userItem: any) => {
  openConfirmModal(
    'Delete User',
    `Are you sure you want to delete ${userItem.username}? This action cannot be undone.`,
    async () => {
      actionLoading.value = true
      usersError.value = ''
      try {
        await $fetch(`/api/admin/users/${userItem.id}`, { method: 'DELETE' })
        usersSuccess.value = `User ${userItem.username} deleted successfully`
        await fetchUsers()
        setTimeout(() => { usersSuccess.value = '' }, 3000)
      } catch (error: any) {
        usersError.value = error.data?.statusMessage || 'Failed to delete user'
        throw error
      } finally {
        actionLoading.value = false
      }
    },
    'Delete',
    true
  )
}

const formatDate = (date: string) => new Date(date).toLocaleDateString()

onMounted(async () => {
  await initAuth()
  await fetchUsers()
})
</script>

<style scoped>
.verified-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}
.verified-badge.verified {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}
.verified-badge.unverified {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}
</style>
