<template>
  <div class="tab-content">
    <h2>Lithos Management</h2>

    <div class="lithos-header">
      <button @click="openCreateLithosModal" class="btn-create">
        Create New Lithos
      </button>
      <div class="search-bar">
        <input
          v-model="lithosSearchQuery"
          type="text"
          placeholder="Search lithos by name or type..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <div v-if="lithosLoading" class="loading">Loading lithos...</div>
    <div v-if="lithosError" class="error-message">{{ lithosError }}</div>
    <div v-if="lithosSuccess" class="success-message">{{ lithosSuccess }}</div>

    <!-- Lithos Grid -->
    <div v-if="!lithosLoading && filteredLithos.length > 0" class="lithos-grid">
      <div v-for="lithos in filteredLithos" :key="lithos.id" class="lithos-card">
        <div class="lithos-sprite">
          <img :src="lithos.sprite" :alt="lithos.name" />
        </div>
        <h3>{{ lithos.name }}</h3>
        <p class="lithos-type">Rarity: {{ lithos.rarity }}</p>
        <p v-if="lithos.element" class="lithos-element">Element: {{ lithos.element.name }}</p>
        <div class="lithos-spikes">
          <span>⬆️ {{ lithos.spikeUp }}</span>
          <span>➡️ {{ lithos.spikeRight }}</span>
          <span>⬇️ {{ lithos.spikeDown }}</span>
          <span>⬅️ {{ lithos.spikeLeft }}</span>
        </div>
        <div class="lithos-actions">
          <button @click="openEditLithosModal(lithos)" class="btn-edit" :disabled="actionLoading">Edit</button>
          <button @click="deleteLithos(lithos)" class="btn-delete" :disabled="actionLoading">Delete</button>
        </div>
      </div>
    </div>

    <div v-if="!lithosLoading && filteredLithos.length === 0 && lithosSearchQuery === ''" class="no-data">
      No lithos found.
    </div>
    <div v-if="!lithosLoading && filteredLithos.length === 0 && lithosSearchQuery !== ''" class="no-data">
      No lithos match your search.
    </div>
  </div>

  <!-- Create/Edit Lithos Modal -->
  <div v-if="showLithosModal" class="modal-overlay" @click="closeLithosModal">
    <div class="modal" @click.stop>
      <h3>{{ lithosForm.id ? 'Edit Lithos' : 'Create Lithos' }}</h3>
      <form @submit.prevent="saveLithos">
        <div class="form-group">
          <label for="lithos-name">Name</label>
          <input id="lithos-name" v-model="lithosForm.name" type="text" required />
        </div>
        <div class="form-group">
          <label for="lithos-sprite">Sprite Image</label>
          <input
            id="lithos-sprite"
            type="file"
            accept="image/*"
            @change="handleSpriteUpload"
            :required="!lithosForm.sprite"
            style="display: block; width: 100%; padding: 8px; margin-top: 4px;"
          />
          <div v-if="uploadingSprite" class="upload-loading">Uploading image...</div>
          <div v-if="lithosForm.sprite" class="sprite-preview">
            <img :src="lithosForm.sprite" alt="Sprite preview" />
            <button type="button" @click="removeSprite" class="btn-remove-sprite">Remove</button>
          </div>
        </div>
        <div class="form-group">
          <label for="lithos-element">Element (Optional)</label>
          <select id="lithos-element" v-model="lithosForm.elementId">
            <option value="">-- No Element --</option>
            <option v-for="element in elementsList" :key="element.id" :value="element.id">
              {{ element.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="lithos-rarity">Rarity</label>
          <select id="lithos-rarity" v-model="lithosForm.rarity" required>
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="spike-up">Spike Up</label>
            <input id="spike-up" v-model.number="lithosForm.spikeUp" type="number" min="0" required />
          </div>
          <div class="form-group">
            <label for="spike-right">Spike Right</label>
            <input id="spike-right" v-model.number="lithosForm.spikeRight" type="number" min="0" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="spike-down">Spike Down</label>
            <input id="spike-down" v-model.number="lithosForm.spikeDown" type="number" min="0" required />
          </div>
          <div class="form-group">
            <label for="spike-left">Spike Left</label>
            <input id="spike-left" v-model.number="lithosForm.spikeLeft" type="number" min="0" required />
          </div>
        </div>
        <div v-if="modalError" class="error-message">{{ modalError }}</div>
        <div class="modal-actions">
          <button type="button" @click="closeLithosModal" :disabled="modalLoading">Cancel</button>
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

const { initAuth } = useAuth()


const lithosList = ref<any[]>([])
const elementsList = ref<any[]>([])
const lithosLoading = ref(false)
const lithosError = ref('')
const lithosSuccess = ref('')
const lithosSearchQuery = ref('')
const actionLoading = ref(false)

const filteredLithos = computed(() => {
  if (!lithosSearchQuery.value) return lithosList.value
  const query = lithosSearchQuery.value.toLowerCase()
  return lithosList.value.filter((lithos) => {
    const name = lithos.name?.toLowerCase() || ''
    const rarity = lithos.rarity?.toLowerCase() || ''
    return name.includes(query) || rarity.includes(query)
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

// Lithos modal
const showLithosModal = ref(false)
const lithosForm = ref({
  id: '', name: '', sprite: '', rarity: 'common', elementId: '',
  spikeUp: 0, spikeRight: 0, spikeDown: 0, spikeLeft: 0,
})
const selectedFile = ref<File | null>(null)
const uploadingSprite = ref(false)
const modalLoading = ref(false)
const modalError = ref('')

const fetchLithos = async () => {
  lithosLoading.value = true
  lithosError.value = ''
  try {
    const response = await $fetch<any>('/api/lithos')
    lithosList.value = response.data
  } catch (error: any) {
    lithosError.value = error.data?.statusMessage || 'Failed to load lithos'
  } finally {
    lithosLoading.value = false
  }
}

const fetchElements = async () => {
  try {
    const response = await $fetch<any>('/api/elements')
    elementsList.value = response.data
  } catch {}
}

const handleSpriteUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  modalError.value = ''
  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    lithosForm.value.sprite = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeSprite = () => {
  lithosForm.value.sprite = ''
  selectedFile.value = null
  const fileInput = document.getElementById('lithos-sprite') as HTMLInputElement
  if (fileInput) fileInput.value = ''
}

const openCreateLithosModal = () => {
  lithosForm.value = { id: '', name: '', sprite: '', rarity: 'common', elementId: '', spikeUp: 0, spikeRight: 0, spikeDown: 0, spikeLeft: 0 }
  selectedFile.value = null
  modalError.value = ''
  showLithosModal.value = true
}

const openEditLithosModal = (lithos: any) => {
  lithosForm.value = {
    id: lithos.id,
    name: lithos.name,
    sprite: lithos.sprite,
    rarity: lithos.rarity || 'common',
    elementId: lithos.elementId || '',
    spikeUp: lithos.spikeUp,
    spikeRight: lithos.spikeRight,
    spikeDown: lithos.spikeDown,
    spikeLeft: lithos.spikeLeft,
  }
  selectedFile.value = null
  modalError.value = ''
  showLithosModal.value = true
}

const closeLithosModal = () => {
  showLithosModal.value = false
  lithosForm.value = { id: '', name: '', sprite: '', rarity: 'common', elementId: '', spikeUp: 0, spikeRight: 0, spikeDown: 0, spikeLeft: 0 }
  selectedFile.value = null
  modalError.value = ''
}

const saveLithos = async () => {
  modalLoading.value = true
  modalError.value = ''

  try {
    const bodyData: any = {
      name: lithosForm.value.name,
      sprite: lithosForm.value.sprite,
      folder: 'lithos',
      rarity: lithosForm.value.rarity,
      spikeUp: lithosForm.value.spikeUp,
      spikeRight: lithosForm.value.spikeRight,
      spikeDown: lithosForm.value.spikeDown,
      spikeLeft: lithosForm.value.spikeLeft,
    }

    if (lithosForm.value.elementId) {
      bodyData.elementId = lithosForm.value.elementId
    }

    if (lithosForm.value.id) {
      await $fetch(`/api/lithos/${lithosForm.value.id}`, { method: 'PATCH', body: bodyData })
      lithosSuccess.value = 'Lithos updated successfully'
    } else {
      await $fetch('/api/lithos', { method: 'POST', body: bodyData })
      lithosSuccess.value = 'Lithos created successfully'
    }

    closeLithosModal()
    await fetchLithos()
    setTimeout(() => { lithosSuccess.value = '' }, 3000)
  } catch (error: any) {
    modalError.value = error.data?.statusMessage || 'Failed to save lithos'
  } finally {
    modalLoading.value = false
  }
}

const deleteLithos = (lithos: any) => {
  openConfirmModal(
    'Delete Lithos',
    `Are you sure you want to delete ${lithos.name}? This action cannot be undone.`,
    async () => {
      actionLoading.value = true
      lithosError.value = ''
      try {
        await $fetch(`/api/admin/lithos/${lithos.id}`, { method: 'DELETE' })
        lithosSuccess.value = `Lithos ${lithos.name} deleted successfully`
        await fetchLithos()
        setTimeout(() => { lithosSuccess.value = '' }, 3000)
      } catch (error: any) {
        lithosError.value = error.data?.statusMessage || 'Failed to delete lithos'
        throw error
      } finally {
        actionLoading.value = false
      }
    },
    'Delete',
    true
  )
}

onMounted(async () => {
  await initAuth()
  await Promise.all([fetchLithos(), fetchElements()])
})
</script>
