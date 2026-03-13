<template>
  <div class="tab-content">
    <h2>Collections Management</h2>

    <!-- User selector -->
    <div class="search-bar">
      <input
        v-model="userSearchQuery"
        type="text"
        placeholder="Search a user by username, email or name..."
        class="search-input"
      />
      <span class="search-icon">🔍</span>
    </div>

    <div v-if="usersLoading" class="loading">Loading users...</div>

    <div v-if="!usersLoading && filteredUsers.length > 0" class="users-table">
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Lithos count</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="userItem in filteredUsers" :key="userItem.id">
            <td>{{ userItem.username }}</td>
            <td>{{ userItem.email }}</td>
            <td>{{ userItem.collections?.length ?? 0 }}</td>
            <td class="actions">
              <button @click="openCollectionModal(userItem)" class="btn-edit" :disabled="actionLoading">
                Manage Collection
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!usersLoading && filteredUsers.length === 0" class="no-data">
      No users found.
    </div>
  </div>

  <!-- Collection Modal -->
  <div v-if="showCollectionModal" class="modal-overlay" @click="closeCollectionModal">
    <div class="modal modal-large" @click.stop>
      <h3>Collection of {{ selectedUser?.username }}</h3>

      <div v-if="collectionError" class="error-message">{{ collectionError }}</div>
      <div v-if="collectionSuccess" class="success-message">{{ collectionSuccess }}</div>

      <!-- Add lithos form -->
      <div class="add-lithos-form">
        <h4>Add a Lithos</h4>
        <div class="form-row">
          <div class="form-group">
            <label>Lithos</label>
            <select v-model="addForm.lithosId">
              <option value="">-- Select a Lithos --</option>
              <option v-for="lithos in lithosList" :key="lithos.id" :value="lithos.id">
                {{ lithos.name }} ({{ lithos.rarity }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Quantity</label>
            <input v-model.number="addForm.quantity" type="number" min="1" />
          </div>
          <button
            @click="addLithos"
            class="btn-create"
            :disabled="!addForm.lithosId || addForm.quantity < 1 || collectionLoading"
          >
            {{ collectionLoading ? 'Adding...' : 'Add' }}
          </button>
        </div>
      </div>

      <!-- Current collection -->
      <div v-if="collectionLoading && userCollection.length === 0" class="loading">Loading collection...</div>

      <div v-if="userCollection.length > 0" class="collection-list">
        <h4>Current collection ({{ userCollection.length }} entries)</h4>
        <table>
          <thead>
            <tr>
              <th>Lithos</th>
              <th>Rarity</th>
              <th>Element</th>
              <th>Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in userCollection" :key="entry.id">
              <td>{{ entry.lithos.name }}</td>
              <td>{{ entry.lithos.rarity }}</td>
              <td>{{ entry.lithos.element?.name ?? '-' }}</td>
              <td>
                <input
                  v-if="editingId === entry.id"
                  v-model.number="editQuantity"
                  type="number"
                  min="0"
                  class="quantity-input"
                />
                <span v-else>{{ entry.quantity }}</span>
              </td>
              <td class="actions">
                <template v-if="editingId === entry.id">
                  <button @click="saveQuantity(entry)" class="btn-edit" :disabled="collectionLoading">Save</button>
                  <button @click="cancelEdit" :disabled="collectionLoading">Cancel</button>
                </template>
                <template v-else>
                  <button @click="startEdit(entry)" class="btn-edit" :disabled="collectionLoading">Edit</button>
                  <button @click="removeEntry(entry)" class="btn-delete" :disabled="collectionLoading">Remove</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!collectionLoading && userCollection.length === 0" class="no-data">
        This user has no collection yet.
      </div>

      <div class="modal-actions">
        <button type="button" @click="closeCollectionModal">Close</button>
      </div>
    </div>
  </div>

  <!-- Confirmation Modal -->
  <div v-if="showConfirmModal" class="modal-overlay" @click="cancelConfirm">
    <div class="modal modal-confirm" @click.stop>
      <h3>{{ confirmTitle }}</h3>
      <p>{{ confirmMessage }}</p>
      <div class="modal-actions">
        <button type="button" @click="cancelConfirm" :disabled="confirmLoading">Cancel</button>
        <button type="button" @click="confirmAction" :disabled="confirmLoading" class="btn-danger">
          {{ confirmLoading ? 'Processing...' : confirmButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { token, initAuth } = useAuth()

const getAuthHeaders = (): Record<string, string> => {
  if (!token.value) return {}
  return { Authorization: `Bearer ${token.value}` }
}

// Users list
const users = ref<any[]>([])
const usersLoading = ref(false)
const userSearchQuery = ref('')
const actionLoading = ref(false)

const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return users.value
  const q = userSearchQuery.value.toLowerCase()
  return users.value.filter((u) => {
    return (
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q)
    )
  })
})

// Collection modal
const showCollectionModal = ref(false)
const selectedUser = ref<any>(null)
const userCollection = ref<any[]>([])
const lithosList = ref<any[]>([])
const collectionLoading = ref(false)
const collectionError = ref('')
const collectionSuccess = ref('')

const addForm = ref({ lithosId: '', quantity: 1 })
const editingId = ref<string | null>(null)
const editQuantity = ref(0)

// Confirmation modal
const showConfirmModal = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmButtonText = ref('Confirm')
const confirmLoading = ref(false)
const confirmCallback = ref<(() => Promise<void>) | null>(null)

const openConfirmModal = (title: string, message: string, callback: () => Promise<void>, buttonText = 'Confirm') => {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmButtonText.value = buttonText
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
  finally { confirmLoading.value = false }
}

const fetchUsers = async () => {
  usersLoading.value = true
  try {
    const response = await $fetch<any>('/api/admin/users', { headers: getAuthHeaders() })
    users.value = response.data.users
  } catch {}
  finally { usersLoading.value = false }
}

const fetchLithos = async () => {
  try {
    const response = await $fetch<any>('/api/lithos')
    lithosList.value = response.data
  } catch {}
}

const fetchUserCollection = async (userId: string) => {
  collectionLoading.value = true
  collectionError.value = ''
  try {
    const response = await $fetch<any>(`/api/admin/collections/user/${userId}`, { headers: getAuthHeaders() })
    userCollection.value = response.data
  } catch (error: any) {
    collectionError.value = error.data?.statusMessage || 'Failed to load collection'
  } finally {
    collectionLoading.value = false
  }
}

const openCollectionModal = async (userItem: any) => {
  selectedUser.value = userItem
  userCollection.value = []
  addForm.value = { lithosId: '', quantity: 1 }
  editingId.value = null
  collectionError.value = ''
  collectionSuccess.value = ''
  showCollectionModal.value = true
  await fetchUserCollection(userItem.id)
}

const closeCollectionModal = () => {
  showCollectionModal.value = false
  selectedUser.value = null
  userCollection.value = []
  editingId.value = null
}

const addLithos = async () => {
  collectionLoading.value = true
  collectionError.value = ''
  try {
    await $fetch(`/api/admin/collections/user/${selectedUser.value.id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: { lithosId: addForm.value.lithosId, quantity: addForm.value.quantity },
    })
    collectionSuccess.value = 'Lithos added successfully'
    addForm.value = { lithosId: '', quantity: 1 }
    await fetchUserCollection(selectedUser.value.id)
    await fetchUsers()
    setTimeout(() => { collectionSuccess.value = '' }, 3000)
  } catch (error: any) {
    collectionError.value = error.data?.statusMessage || 'Failed to add lithos'
  } finally {
    collectionLoading.value = false
  }
}

const startEdit = (entry: any) => {
  editingId.value = entry.id
  editQuantity.value = entry.quantity
}

const cancelEdit = () => {
  editingId.value = null
}

const saveQuantity = async (entry: any) => {
  collectionLoading.value = true
  collectionError.value = ''
  try {
    await $fetch(`/api/admin/collections/${entry.id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: { quantity: editQuantity.value },
    })
    collectionSuccess.value = 'Quantity updated successfully'
    editingId.value = null
    await fetchUserCollection(selectedUser.value.id)
    setTimeout(() => { collectionSuccess.value = '' }, 3000)
  } catch (error: any) {
    collectionError.value = error.data?.statusMessage || 'Failed to update quantity'
  } finally {
    collectionLoading.value = false
  }
}

const removeEntry = (entry: any) => {
  openConfirmModal(
    'Remove Lithos',
    `Remove ${entry.lithos.name} from ${selectedUser.value?.username}'s collection?`,
    async () => {
      collectionLoading.value = true
      collectionError.value = ''
      try {
        await $fetch(`/api/admin/collections/${entry.id}`, { method: 'DELETE', headers: getAuthHeaders() })
        collectionSuccess.value = `${entry.lithos.name} removed from collection`
        await fetchUserCollection(selectedUser.value.id)
        await fetchUsers()
        setTimeout(() => { collectionSuccess.value = '' }, 3000)
      } catch (error: any) {
        collectionError.value = error.data?.statusMessage || 'Failed to remove entry'
        throw error
      } finally {
        collectionLoading.value = false
      }
    },
    'Remove'
  )
}

onMounted(async () => {
  await initAuth()
  await Promise.all([fetchUsers(), fetchLithos()])
})
</script>
