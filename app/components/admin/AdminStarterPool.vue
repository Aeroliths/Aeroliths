<template>
  <div class="tab-content">
    <h2>Starter Pool</h2>

    <p class="starter-summary">
      Every new player receives these lithos when they register.
      <strong>{{ poolCards.length }}</strong> card(s),
      <strong>{{ poolCopies }}</strong> copie(s) per player.
    </p>

    <div class="lithos-header">
      <button
        class="btn-create"
        :disabled="giveLoading || poolCards.length === 0"
        @click="confirmGiveStarterPool"
      >
        {{ giveLoading ? 'Giving...' : 'Give starter pool to players who never received it' }}
      </button>
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search lithos by name or rarity..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">{{ success }}</div>

    <div v-if="loading" class="loading">Loading lithos...</div>

    <div v-if="!loading && filteredLithos.length > 0" class="lithos-grid">
      <div
        v-for="lithos in filteredLithos"
        :key="lithos.id"
        class="lithos-card"
        :class="{ 'starter-selected': lithos.isStarter }"
      >
        <div class="lithos-sprite">
          <img :src="lithos.sprite" :alt="lithos.name" />
        </div>
        <h3>{{ lithos.name }}</h3>
        <p class="lithos-type">Rarity: {{ lithos.rarity }}</p>

        <label class="starter-toggle">
          <input
            type="checkbox"
            :checked="lithos.isStarter"
            :disabled="pendingId === lithos.id"
            @change="toggleStarter(lithos, $event)"
          />
          In the starter pool
        </label>

        <div v-if="lithos.isStarter" class="starter-qty">
          <label :for="`starter-qty-${lithos.id}`">Copies</label>
          <input
            :id="`starter-qty-${lithos.id}`"
            type="number"
            min="1"
            class="qty-input"
            :value="lithos.starterQuantity"
            :disabled="pendingId === lithos.id"
            @change="updateQuantity(lithos, $event)"
          />
        </div>
      </div>
    </div>

    <div v-if="!loading && filteredLithos.length === 0" class="no-data">
      No lithos match your search.
    </div>
  </div>

  <!-- Confirmation Modal -->
  <div v-if="showConfirmModal" class="modal-overlay" @click="cancelConfirm">
    <div class="modal modal-confirm" @click.stop>
      <h3>Give the starter pool</h3>
      <p>
        Give {{ poolCards.length }} card(s) to every player who never received the pool?
        Players already served are skipped.
      </p>
      <div class="modal-actions">
        <button type="button" :disabled="giveLoading" @click="cancelConfirm">Cancel</button>
        <button type="button" :disabled="giveLoading" @click="giveStarterPool">
          {{ giveLoading ? 'Giving...' : 'Give starter pool' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const lithosList = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const searchQuery = ref('')

// Id of the card whose write is in flight, so only its controls are disabled.
const pendingId = ref<string | null>(null)

const poolCards = computed(() => lithosList.value.filter(l => l.isStarter))

const poolCopies = computed(() =>
  poolCards.value.reduce((total, l) => total + (l.starterQuantity ?? 1), 0)
)

const filteredLithos = computed(() => {
  if (!searchQuery.value) return lithosList.value
  const query = searchQuery.value.toLowerCase()
  return lithosList.value.filter(l =>
    l.name?.toLowerCase().includes(query) || l.rarity?.toLowerCase().includes(query)
  )
})

const fetchLithos = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch<any>('/api/lithos')
    lithosList.value = response.data
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to load lithos'
  } finally {
    loading.value = false
  }
}

// Writes go out one at a time and the card is updated optimistically. A failed
// request puts the previous value back, so the screen never claims a state the
// database does not hold.
const patchLithos = async (lithos: any, field: 'isStarter' | 'starterQuantity', value: any) => {
  const previous = lithos[field]
  if (previous === value) return

  lithos[field] = value
  pendingId.value = lithos.id
  error.value = ''

  try {
    await $fetch(`/api/lithos/${lithos.id}`, { method: 'PATCH', body: { [field]: value } })
  } catch (err: any) {
    lithos[field] = previous
    error.value = err.data?.statusMessage || 'Failed to update the starter pool'
  } finally {
    pendingId.value = null
  }
}

const toggleStarter = (lithos: any, event: Event) => {
  const checked = (event.target as HTMLInputElement).checked
  return patchLithos(lithos, 'isStarter', checked)
}

const updateQuantity = (lithos: any, event: Event) => {
  const input = event.target as HTMLInputElement
  const quantity = Number(input.value)

  // The endpoint rejects anything below 1, so do not even send it.
  if (isNaN(quantity) || quantity < 1) {
    input.value = String(lithos.starterQuantity)
    return
  }

  return patchLithos(lithos, 'starterQuantity', quantity)
}

const showConfirmModal = ref(false)
const giveLoading = ref(false)

const confirmGiveStarterPool = () => {
  error.value = ''
  success.value = ''
  showConfirmModal.value = true
}

const cancelConfirm = () => {
  if (giveLoading.value) return
  showConfirmModal.value = false
}

const giveStarterPool = async () => {
  giveLoading.value = true
  error.value = ''
  try {
    const response = await $fetch<any>('/api/admin/collections/starter-pool', { method: 'POST' })
    success.value = response.message || 'Starter pool given successfully'
    showConfirmModal.value = false
    setTimeout(() => { success.value = '' }, 4000)
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to give the starter pool'
  } finally {
    giveLoading.value = false
  }
}

onMounted(fetchLithos)
</script>
