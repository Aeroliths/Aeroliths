<template>
  <div class="tab-content">
    <h2>Elements Management</h2>

    <div class="lithos-header">
      <button @click="openCreateElementModal" class="btn-create">
        Create New Element
      </button>
      <div class="search-bar">
        <input
          v-model="elementsSearchQuery"
          type="text"
          placeholder="Search elements by name..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <div v-if="elementsLoading" class="loading">Loading elements...</div>
    <div v-if="elementsError" class="error-message">{{ elementsError }}</div>
    <div v-if="elementsSuccess" class="success-message">{{ elementsSuccess }}</div>

    <!-- Elements Grid -->
    <div v-if="!elementsLoading && filteredElements.length > 0" class="lithos-grid">
      <div v-for="element in filteredElements" :key="element.id" class="lithos-card">
        <div class="lithos-sprite">
          <img :src="element.sprite" :alt="element.name" />
        </div>
        <h3>{{ element.name }}</h3>
        <div class="element-relations">
          <p v-if="element.weaknessesFrom && element.weaknessesFrom.length > 0" class="element-weaknesses">
            <strong>Weak against:</strong> {{ element.weaknessesFrom.map((w: any) => w.weakAgainst.name).join(', ') }}
          </p>
          <p v-if="element.strengthsFrom && element.strengthsFrom.length > 0" class="element-strengths">
            <strong>Strong against:</strong> {{ element.strengthsFrom.map((s: any) => s.strongAgainst.name).join(', ') }}
          </p>
        </div>
        <div class="lithos-actions">
          <button @click="openEditElementModal(element)" class="btn-edit" :disabled="actionLoading">Edit</button>
          <button @click="manageElementRelations(element)" class="btn-role" :disabled="actionLoading">Relations</button>
          <button @click="deleteElement(element)" class="btn-delete" :disabled="actionLoading">Delete</button>
        </div>
      </div>
    </div>

    <div v-if="!elementsLoading && filteredElements.length === 0 && elementsSearchQuery === ''" class="no-data">
      No elements found.
    </div>
    <div v-if="!elementsLoading && filteredElements.length === 0 && elementsSearchQuery !== ''" class="no-data">
      No elements match your search.
    </div>
  </div>

  <!-- Create/Edit Element Modal -->
  <div v-if="showElementModal" class="modal-overlay" @click="closeElementModal">
    <div class="modal" @click.stop>
      <h3>{{ elementForm.id ? 'Edit Element' : 'Create Element' }}</h3>
      <form @submit.prevent="saveElement">
        <div class="form-group">
          <label for="element-name">Name</label>
          <input id="element-name" v-model="elementForm.name" type="text" required />
        </div>
        <div class="form-group">
          <label>Sprite Image</label>
          <MediaPicker
            v-model="elementForm.mediaId"
            category="elements"
            :initial-path="elementForm.sprite"
          />
        </div>
        <div class="form-group" v-if="!elementForm.id">
          <label for="element-weaknesses">Weaknesses (Optional)</label>
          <select id="element-weaknesses" v-model="elementForm.weaknesses" multiple style="min-height: 80px;">
            <option v-for="element in availableElementsForRelations" :key="element.id" :value="element.id">
              {{ element.name }}
            </option>
          </select>
          <small style="display: block; margin-top: 4px; color: #888;">Hold Ctrl/Cmd to select multiple</small>
        </div>
        <div class="form-group" v-if="!elementForm.id">
          <label for="element-strengths">Strengths (Optional)</label>
          <select id="element-strengths" v-model="elementForm.strengths" multiple style="min-height: 80px;">
            <option v-for="element in availableElementsForRelations" :key="element.id" :value="element.id">
              {{ element.name }}
            </option>
          </select>
          <small style="display: block; margin-top: 4px; color: #888;">Hold Ctrl/Cmd to select multiple</small>
        </div>
        <div v-if="modalError" class="error-message">{{ modalError }}</div>
        <div class="modal-actions">
          <button type="button" @click="closeElementModal" :disabled="modalLoading">Cancel</button>
          <button type="submit" :disabled="modalLoading">
            {{ modalLoading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Element Relations Modal -->
  <div v-if="showElementRelationsModal" class="modal-overlay" @click="closeElementRelationsModal">
    <div class="modal modal-large" @click.stop>
      <h3>Manage Relations for {{ selectedElement?.name }}</h3>

      <!-- Weaknesses Section -->
      <div class="relations-section">
        <h4>Weaknesses (Weak Against)</h4>
        <div class="relations-list">
          <div v-for="weakness in selectedElementWeaknesses" :key="weakness.id" class="relation-item">
            <span>{{ weakness.weakAgainst.name }}</span>
            <button @click="deleteWeakness(weakness.id)" class="btn-delete-small" :disabled="relationLoading">
              Remove
            </button>
          </div>
          <div v-if="selectedElementWeaknesses.length === 0" class="no-relations">No weaknesses defined</div>
        </div>
        <div class="add-relation">
          <select v-model="newWeaknessId" class="relation-select">
            <option value="">-- Select an element --</option>
            <option v-for="el in availableWeaknessElements" :key="el.id" :value="el.id">{{ el.name }}</option>
          </select>
          <button @click="addWeakness" class="btn-add" :disabled="!newWeaknessId || relationLoading">
            Add Weakness
          </button>
        </div>
      </div>

      <!-- Strengths Section -->
      <div class="relations-section">
        <h4>Strengths (Strong Against)</h4>
        <div class="relations-list">
          <div v-for="strength in selectedElementStrengths" :key="strength.id" class="relation-item">
            <span>{{ strength.strongAgainst.name }}</span>
            <button @click="deleteStrength(strength.id)" class="btn-delete-small" :disabled="relationLoading">
              Remove
            </button>
          </div>
          <div v-if="selectedElementStrengths.length === 0" class="no-relations">No strengths defined</div>
        </div>
        <div class="add-relation">
          <select v-model="newStrengthId" class="relation-select">
            <option value="">-- Select an element --</option>
            <option v-for="el in availableStrengthElements" :key="el.id" :value="el.id">{{ el.name }}</option>
          </select>
          <button @click="addStrength" class="btn-add" :disabled="!newStrengthId || relationLoading">
            Add Strength
          </button>
        </div>
      </div>

      <div v-if="relationsError" class="error-message">{{ relationsError }}</div>
      <div v-if="relationsSuccess" class="success-message">{{ relationsSuccess }}</div>

      <div class="modal-actions">
        <button type="button" @click="closeElementRelationsModal">Close</button>
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
// Auto-import registers this one as AdminMediaPicker, after its directory, so
// the template name only resolves through an explicit import.
import MediaPicker from '~/components/admin/MediaPicker.vue'

const { initAuth } = useAuth()


const elementsList = ref<any[]>([])
const elementsLoading = ref(false)
const elementsError = ref('')
const elementsSuccess = ref('')
const elementsSearchQuery = ref('')
const actionLoading = ref(false)

const filteredElements = computed(() => {
  if (!elementsSearchQuery.value) return elementsList.value
  const query = elementsSearchQuery.value.toLowerCase()
  return elementsList.value.filter((element) => element.name?.toLowerCase().includes(query))
})

const availableElementsForRelations = computed(() => {
  if (!elementForm.value.id) return elementsList.value
  return elementsList.value.filter(el => el.id !== elementForm.value.id)
})

const availableWeaknessElements = computed(() => {
  if (!selectedElement.value) return []
  const existingIds = selectedElementWeaknesses.value.map((w: any) => w.weakAgainstId)
  return elementsList.value.filter(el => el.id !== selectedElement.value!.id && !existingIds.includes(el.id))
})

const availableStrengthElements = computed(() => {
  if (!selectedElement.value) return []
  const existingIds = selectedElementStrengths.value.map((s: any) => s.strongAgainstId)
  return elementsList.value.filter(el => el.id !== selectedElement.value!.id && !existingIds.includes(el.id))
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

// Element modal
const showElementModal = ref(false)
const elementForm = ref({ id: '', name: '', sprite: '', mediaId: '', weaknesses: [] as string[], strengths: [] as string[] })
const modalLoading = ref(false)
const modalError = ref('')

// Element relations modal
const showElementRelationsModal = ref(false)
const selectedElement = ref<any>(null)
const selectedElementWeaknesses = ref<any[]>([])
const selectedElementStrengths = ref<any[]>([])
const newWeaknessId = ref('')
const newStrengthId = ref('')
const relationLoading = ref(false)
const relationsError = ref('')
const relationsSuccess = ref('')

const fetchElements = async () => {
  elementsLoading.value = true
  elementsError.value = ''
  try {
    const response = await $fetch<any>('/api/elements')
    elementsList.value = response.data
  } catch (error: any) {
    elementsError.value = error.data?.statusMessage || 'Failed to load elements'
  } finally {
    elementsLoading.value = false
  }
}

const openCreateElementModal = () => {
  elementForm.value = { id: '', name: '', sprite: '', mediaId: '', weaknesses: [], strengths: [] }
  modalError.value = ''
  showElementModal.value = true
}

const openEditElementModal = (element: any) => {
  // sprite feeds the picker's initial-path so it can preselect the matching asset
  elementForm.value = { id: element.id, name: element.name, sprite: element.sprite, mediaId: '', weaknesses: [], strengths: [] }
  modalError.value = ''
  showElementModal.value = true
}

const closeElementModal = () => {
  showElementModal.value = false
  elementForm.value = { id: '', name: '', sprite: '', mediaId: '', weaknesses: [], strengths: [] }
  modalError.value = ''
}

const saveElement = async () => {
  // The picker replaced the required file input, so the check lives here now
  if (!elementForm.value.mediaId) {
    modalError.value = 'Please select or upload a sprite image'
    return
  }

  modalLoading.value = true
  modalError.value = ''

  try {
    if (elementForm.value.id) {
      await $fetch(`/api/admin/elements/${elementForm.value.id}`, {
        method: 'PATCH',
        body: { name: elementForm.value.name, mediaId: elementForm.value.mediaId },
      })
      elementsSuccess.value = 'Element updated successfully'
    } else {
      const response = await $fetch<any>('/api/admin/elements', {
        method: 'POST',
        body: { name: elementForm.value.name, mediaId: elementForm.value.mediaId },
      })

      const newElementId = response.data.id

      for (const weakAgainstId of elementForm.value.weaknesses) {
        try {
          await $fetch('/api/admin/weaknesses', {
            method: 'POST',
      
            body: { elementId: newElementId, weakAgainstId },
          })
        } catch (error) {
          console.error('Failed to add weakness:', error)
        }
      }

      for (const strongAgainstId of elementForm.value.strengths) {
        try {
          await $fetch('/api/admin/strengths', {
            method: 'POST',
      
            body: { elementId: newElementId, strongAgainstId },
          })
        } catch (error) {
          console.error('Failed to add strength:', error)
        }
      }

      elementsSuccess.value = 'Element created successfully'
    }

    closeElementModal()
    await fetchElements()
    setTimeout(() => { elementsSuccess.value = '' }, 3000)
  } catch (error: any) {
    modalError.value = error.data?.statusMessage || 'Failed to save element'
  } finally {
    modalLoading.value = false
  }
}

const deleteElement = (element: any) => {
  openConfirmModal(
    'Delete Element',
    `Are you sure you want to delete ${element.name}? This action cannot be undone.`,
    async () => {
      actionLoading.value = true
      elementsError.value = ''
      try {
        await $fetch(`/api/admin/elements/${element.id}`, { method: 'DELETE' })
        elementsSuccess.value = `Element ${element.name} deleted successfully`
        await fetchElements()
        setTimeout(() => { elementsSuccess.value = '' }, 3000)
      } catch (error: any) {
        elementsError.value = error.data?.statusMessage || 'Failed to delete element'
        throw error
      } finally {
        actionLoading.value = false
      }
    },
    'Delete',
    true
  )
}

const manageElementRelations = (element: any) => {
  selectedElement.value = element
  selectedElementWeaknesses.value = element.weaknessesFrom || []
  selectedElementStrengths.value = element.strengthsFrom || []
  newWeaknessId.value = ''
  newStrengthId.value = ''
  relationsError.value = ''
  relationsSuccess.value = ''
  showElementRelationsModal.value = true
}

const closeElementRelationsModal = () => {
  showElementRelationsModal.value = false
  selectedElement.value = null
  selectedElementWeaknesses.value = []
  selectedElementStrengths.value = []
  newWeaknessId.value = ''
  newStrengthId.value = ''
  relationsError.value = ''
  relationsSuccess.value = ''
}

const addWeakness = async () => {
  if (!newWeaknessId.value || !selectedElement.value) return
  relationLoading.value = true
  relationsError.value = ''
  try {
    await $fetch('/api/admin/weaknesses', {
      method: 'POST',

      body: { elementId: selectedElement.value.id, weakAgainstId: newWeaknessId.value },
    })
    relationsSuccess.value = 'Weakness added successfully'
    newWeaknessId.value = ''
    await fetchElements()
    const updatedElement = elementsList.value.find(e => e.id === selectedElement.value!.id)
    if (updatedElement) {
      selectedElement.value = updatedElement
      selectedElementWeaknesses.value = updatedElement.weaknessesFrom || []
    }
    setTimeout(() => { relationsSuccess.value = '' }, 3000)
  } catch (error: any) {
    relationsError.value = error.data?.statusMessage || 'Failed to add weakness'
  } finally {
    relationLoading.value = false
  }
}

const deleteWeakness = async (weaknessId: string) => {
  relationLoading.value = true
  relationsError.value = ''
  try {
    await $fetch(`/api/admin/weaknesses/${weaknessId}`, { method: 'DELETE' })
    relationsSuccess.value = 'Weakness removed successfully'
    await fetchElements()
    const updatedElement = elementsList.value.find(e => e.id === selectedElement.value!.id)
    if (updatedElement) {
      selectedElement.value = updatedElement
      selectedElementWeaknesses.value = updatedElement.weaknessesFrom || []
    }
    setTimeout(() => { relationsSuccess.value = '' }, 3000)
  } catch (error: any) {
    relationsError.value = error.data?.statusMessage || 'Failed to remove weakness'
  } finally {
    relationLoading.value = false
  }
}

const addStrength = async () => {
  if (!newStrengthId.value || !selectedElement.value) return
  relationLoading.value = true
  relationsError.value = ''
  try {
    await $fetch('/api/admin/strengths', {
      method: 'POST',

      body: { elementId: selectedElement.value.id, strongAgainstId: newStrengthId.value },
    })
    relationsSuccess.value = 'Strength added successfully'
    newStrengthId.value = ''
    await fetchElements()
    const updatedElement = elementsList.value.find(e => e.id === selectedElement.value!.id)
    if (updatedElement) {
      selectedElement.value = updatedElement
      selectedElementStrengths.value = updatedElement.strengthsFrom || []
    }
    setTimeout(() => { relationsSuccess.value = '' }, 3000)
  } catch (error: any) {
    relationsError.value = error.data?.statusMessage || 'Failed to add strength'
  } finally {
    relationLoading.value = false
  }
}

const deleteStrength = async (strengthId: string) => {
  relationLoading.value = true
  relationsError.value = ''
  try {
    await $fetch(`/api/admin/strengths/${strengthId}`, { method: 'DELETE' })
    relationsSuccess.value = 'Strength removed successfully'
    await fetchElements()
    const updatedElement = elementsList.value.find(e => e.id === selectedElement.value!.id)
    if (updatedElement) {
      selectedElement.value = updatedElement
      selectedElementStrengths.value = updatedElement.strengthsFrom || []
    }
    setTimeout(() => { relationsSuccess.value = '' }, 3000)
  } catch (error: any) {
    relationsError.value = error.data?.statusMessage || 'Failed to remove strength'
  } finally {
    relationLoading.value = false
  }
}

onMounted(async () => {
  await initAuth()
  await fetchElements()
})
</script>
