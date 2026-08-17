<template>
  <div class="chest-inventory">
    <div v-if="loading" class="empty">{{ $t('play.chests.loading') }}</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="!loading && chests.length === 0" class="no-chests">
      {{ $t('play.chests.empty') }}
    </div>

    <div v-if="chests.length > 0" class="chest-grid">
      <div v-for="chest in chests" :key="chest.chestTypeId" class="chest-card">
        <span class="chest-icon" aria-hidden="true">🧰</span>
        <span class="chest-name">{{ chest.name }}</span>
        <span class="chest-count">{{ $t('play.chests.held', { count: chest.quantity }) }}</span>
        <button class="open-chest" :disabled="opening" @click="open(chest)">
          {{ $t('play.chests.open') }}
        </button>
      </div>
    </div>

    <div v-if="lastDrawn" class="chest-result">
      <img v-if="lastDrawn.sprite" :src="lastDrawn.sprite" :alt="lastDrawn.name" />
      <span>{{ $t('play.chests.drew', { name: lastDrawn.name }) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface HeldChest {
  chestTypeId: string
  name: string
  quantity: number
}

const chests = ref<HeldChest[]>([])
const lastDrawn = ref<{ id: string; name: string; sprite: string } | null>(null)
const loading = ref(false)
const opening = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch<{ data: HeldChest[] }>('/api/chests')
    chests.value = response.data
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to read your inventory'
  } finally {
    loading.value = false
  }
}

async function open(chest: HeldChest) {
  opening.value = true
  error.value = ''
  try {
    const response = await $fetch<any>(`/api/chests/${chest.chestTypeId}/open`, { method: 'POST' })
    lastDrawn.value = response.data.lithos
    // Reload rather than decrement locally: the server is the one that knows
    // whether the chest was actually spent.
    await load()
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to open the chest'
  } finally {
    opening.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.chest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}

.chest-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  padding: 0.9rem 1rem;
  border-radius: var(--radius-xl, 1rem);
  border: 1px solid var(--color-border-light);
  background: var(--bg-glass-light);
}

.chest-icon {
  font-size: 1.6rem;
}

.chest-name {
  font-weight: var(--font-semibold);
}

.chest-count,
.no-chests,
.empty {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.open-chest {
  margin-top: 0.35rem;
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-lg);
  border: none;
  background: var(--color-primary, #6366f1);
  color: #fff;
  font-weight: var(--font-semibold);
  cursor: pointer;
}

.open-chest:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chest-result {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-lg);
  background: var(--bg-glass-medium);
}

.chest-result img {
  width: 48px;
  height: 48px;
}
</style>
