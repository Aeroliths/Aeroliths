<template>
  <div class="tab-content">
    <h2>Collections Management</h2>

    <div class="search-bar">
      <input
        v-model="userSearchQuery"
        type="text"
        placeholder="Search a user by username or email..."
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
  <Teleport to="body">
    <div v-if="showCollectionModal" class="col-overlay" @click.self="closeCollectionModal">
      <div class="col-modal">
        <div class="col-modal-header">
          <h3>Collection — {{ selectedUser?.username }}</h3>
          <button class="col-close-btn" @click="closeCollectionModal">✕</button>
        </div>

        <div v-if="collectionError" class="error-message">{{ collectionError }}</div>
        <div v-if="collectionSuccess" class="success-message">{{ collectionSuccess }}</div>

        <!-- Picker -->
        <div class="col-section">
          <div class="col-section-header">
            <h4>Add a Lithos</h4>
            <input v-model="pickerSearch" type="text" placeholder="Search..." class="picker-search-input" />
          </div>

          <div class="lithos-picker-grid">
            <div
              v-for="lithos in filteredPickerLithos"
              :key="lithos.id"
              class="picker-card"
              :class="{ selected: addForm.lithosId === lithos.id, [`rarity-${lithos.rarity}`]: true }"
              @click="addForm.lithosId = lithos.id"
            >
              <img :src="lithos.sprite" :alt="lithos.name" class="picker-sprite" />
              <span class="picker-name">{{ lithos.name }}</span>
              <span class="picker-rarity">{{ lithos.rarity }}</span>
            </div>
            <div v-if="filteredPickerLithos.length === 0" class="no-data" style="grid-column:1/-1">
              No lithos found.
            </div>
          </div>

          <div v-if="addForm.lithosId" class="add-confirm">
            <span class="add-confirm-name">
              {{ lithosList.find(l => l.id === addForm.lithosId)?.name }}
            </span>
            <label>Qty</label>
            <input v-model.number="addForm.quantity" type="number" min="1" class="qty-input" />
            <button
              @click="addLithos"
              class="btn-create"
              :disabled="addForm.quantity < 1 || collectionLoading"
            >
              {{ collectionLoading ? 'Adding...' : 'Add' }}
            </button>
            <button @click="addForm.lithosId = ''" class="btn-clear">✕</button>
          </div>
        </div>

        <!-- Current collection -->
        <div class="col-section">
          <h4>Current collection</h4>
          <div v-if="collectionLoading && userCollection.length === 0" class="loading">Loading...</div>
          <div v-else-if="userCollection.length === 0" class="no-data">No lithos in collection yet.</div>
          <div v-else class="collection-cards">
            <div v-for="entry in userCollection" :key="entry.id" class="collection-entry">
              <img :src="entry.lithos.sprite" :alt="entry.lithos.name" class="entry-sprite" />
              <div class="entry-info">
                <span class="entry-name">{{ entry.lithos.name }}</span>
                <span class="entry-rarity">{{ entry.lithos.rarity }}</span>
              </div>
              <div class="entry-qty">
                <input
                  v-if="editingId === entry.id"
                  v-model.number="editQuantity"
                  type="number"
                  min="0"
                  class="qty-input"
                />
                <span v-else class="qty-badge">× {{ entry.quantity }}</span>
              </div>
              <div class="entry-actions">
                <template v-if="editingId === entry.id">
                  <button @click="saveQuantity(entry)" class="btn-edit" :disabled="collectionLoading">Save</button>
                  <button @click="cancelEdit">Cancel</button>
                </template>
                <template v-else>
                  <button @click="startEdit(entry)" class="btn-edit" :disabled="collectionLoading">Edit</button>
                  <button @click="removeEntry(entry)" class="btn-delete" :disabled="collectionLoading">Remove</button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="col-modal-footer">
          <button @click="closeCollectionModal">Close</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Confirmation Modal -->
  <Teleport to="body">
    <div v-if="showConfirmModal" class="col-overlay" @click.self="cancelConfirm">
      <div class="col-modal col-modal-sm">
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
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { initAuth } = useAuth()


const users = ref<any[]>([])
const usersLoading = ref(false)
const userSearchQuery = ref('')
const actionLoading = ref(false)

const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return users.value
  const q = userSearchQuery.value.toLowerCase()
  return users.value.filter(u =>
    u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  )
})

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
const pickerSearch = ref('')

const filteredPickerLithos = computed(() => {
  if (!pickerSearch.value) return lithosList.value
  const q = pickerSearch.value.toLowerCase()
  return lithosList.value.filter(l =>
    l.name?.toLowerCase().includes(q) || l.rarity?.toLowerCase().includes(q)
  )
})

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
    const response = await $fetch<any>('/api/admin/users', {})
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
    const response = await $fetch<any>(`/api/admin/collections/user/${userId}`, {})
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
  pickerSearch.value = ''
  showCollectionModal.value = true
  await fetchUserCollection(userItem.id)
}

const closeCollectionModal = () => {
  showCollectionModal.value = false
  selectedUser.value = null
  userCollection.value = []
  editingId.value = null
  pickerSearch.value = ''
}

const addLithos = async () => {
  collectionLoading.value = true
  collectionError.value = ''
  try {
    await $fetch(`/api/admin/collections/user/${selectedUser.value.id}`, {
      method: 'POST',

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

const startEdit = (entry: any) => { editingId.value = entry.id; editQuantity.value = entry.quantity }
const cancelEdit = () => { editingId.value = null }

const saveQuantity = async (entry: any) => {
  collectionLoading.value = true
  try {
    await $fetch(`/api/admin/collections/${entry.id}`, {
      method: 'PATCH', body: { quantity: editQuantity.value },
    })
    collectionSuccess.value = 'Quantity updated'
    editingId.value = null
    await fetchUserCollection(selectedUser.value.id)
    setTimeout(() => { collectionSuccess.value = '' }, 3000)
  } catch (error: any) {
    collectionError.value = error.data?.statusMessage || 'Failed to update'
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
      try {
        await $fetch(`/api/admin/collections/${entry.id}`, { method: 'DELETE' })
        collectionSuccess.value = `${entry.lithos.name} removed`
        await fetchUserCollection(selectedUser.value.id)
        await fetchUsers()
        setTimeout(() => { collectionSuccess.value = '' }, 3000)
      } catch (error: any) {
        collectionError.value = error.data?.statusMessage || 'Failed to remove'
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

<style scoped>
/* ---- Overlay ---- */
.col-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* ---- Modal ---- */
.col-modal {
  background: #0f1923;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 720px;
  max-height: 88vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}

.col-modal-sm {
  max-width: 440px;
  padding: 1.5rem;
  gap: 1rem;
}

.col-modal-sm h3 {
  color: #fff;
  font-size: 1.1rem;
  margin: 0;
}

.col-modal-sm p {
  color: rgba(255,255,255,0.6);
  font-size: 0.9rem;
  margin: 0;
}

/* ---- Header ---- */
.col-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  background: #0f1923;
  z-index: 1;
  border-radius: 16px 16px 0 0;
}

.col-modal-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.1rem;
}

.col-close-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: color 0.15s;
}

.col-close-btn:hover { color: #fff; }

/* ---- Sections ---- */
.col-section {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.col-section h4 {
  margin: 0 0 0.75rem;
  color: rgba(255,255,255,0.7);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.col-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.col-section-header h4 { margin: 0; }

/* ---- Picker search ---- */
.picker-search-input {
  padding: 0.35rem 0.7rem;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  color: #fff;
  font-size: 0.85rem;
  width: 160px;
  outline: none;
}

.picker-search-input:focus {
  border-color: rgba(102,126,234,0.6);
}

/* ---- Picker grid ---- */
.lithos-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 0.5rem;
  max-height: 220px;
  overflow-y: auto;
  padding: 0.5rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  margin-bottom: 0.75rem;
}

.picker-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem 0.35rem;
  border: 2px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  background: rgba(255,255,255,0.04);
}

.picker-card:hover {
  border-color: rgba(102,126,234,0.5);
  background: rgba(102,126,234,0.08);
}

.picker-card.selected {
  border-color: #667eea;
  background: rgba(102,126,234,0.18);
  box-shadow: 0 0 0 3px rgba(102,126,234,0.2);
}

.picker-card.rarity-rare       { border-color: rgba(59,130,246,0.35); }
.picker-card.rarity-epic       { border-color: rgba(139,92,246,0.35); }
.picker-card.rarity-legendary  { border-color: rgba(245,158,11,0.35); }
.picker-card.selected.rarity-rare      { border-color: #3b82f6; }
.picker-card.selected.rarity-epic      { border-color: #8b5cf6; }
.picker-card.selected.rarity-legendary { border-color: #f59e0b; }

.picker-sprite {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.picker-name {
  font-size: 0.62rem;
  font-weight: 600;
  color: #fff;
  text-align: center;
  line-height: 1.2;
  word-break: break-word;
}

.picker-rarity {
  font-size: 0.58rem;
  color: rgba(255,255,255,0.45);
  text-transform: capitalize;
}

/* ---- Add confirm bar ---- */
.add-confirm {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.85rem;
  background: rgba(102,126,234,0.1);
  border: 1px solid rgba(102,126,234,0.3);
  border-radius: 10px;
}

.add-confirm :deep(.btn-create) {
  margin-bottom: 0;
}

.add-confirm-name {
  flex: 1;
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
  min-width: 60px;
}

.add-confirm label {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
}

.qty-input {
  width: 58px;
  padding: 0.3rem 0.5rem;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
  text-align: center;
  outline: none;
}

.btn-clear {
  background: none;
  border: none;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  transition: color 0.15s;
}

.btn-clear:hover { color: #f87171; }

/* ---- Collection cards ---- */
.collection-cards {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 260px;
  overflow-y: auto;
}

.collection-entry {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
}

.entry-sprite {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 6px;
  flex-shrink: 0;
}

.entry-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.entry-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-rarity {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.45);
  text-transform: capitalize;
}

.entry-qty {
  display: flex;
  align-items: center;
}

.qty-badge {
  font-size: 0.875rem;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  white-space: nowrap;
}

.entry-actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

/* ---- Footer ---- */
.col-modal-footer {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid rgba(255,255,255,0.06);
  border-radius: 0 0 16px 16px;
  position: sticky;
  bottom: 0;
  background: #0f1923;
}

/* ---- Messages ---- */
.error-message {
  margin: 0 1.5rem;
  padding: 0.75rem;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.85rem;
}

.success-message {
  margin: 0 1.5rem;
  padding: 0.75rem;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 8px;
  color: #86efac;
  font-size: 0.85rem;
}
</style>
