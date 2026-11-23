<template>
  <div class="chest-inventory">
    <div v-if="loading" class="empty">{{ $t('play.chests.loading') }}</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="!loading && chests.length === 0" class="no-chests">
      <span class="no-chests-icon" aria-hidden="true">
        <Papicon name="archive" :size="28" />
      </span>
      <p>{{ $t('play.chests.empty') }}</p>
    </div>

    <div v-if="chests.length > 0" class="chest-grid">
      <div v-for="chest in chests" :key="chest.chestTypeId" class="chest-card">
        <span class="chest-icon" aria-hidden="true">
          <Papicon name="archive" :size="24" />
        </span>
        <span class="chest-name">{{ chest.name }}</span>
        <span class="chest-count">{{ $t('play.chests.held', { count: chest.quantity }) }}</span>
        <button class="open-chest" :disabled="opening" @click="open(chest)">
          <Papicon name="sparkles" :size="15" />
          <span>{{ $t('play.chests.open') }}</span>
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
import Papicon from '~/components/Papicon.vue'

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
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 0.9rem;
}

.chest-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 1.15rem 1.2rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-lighter);
  background: var(--color-bg-primary);
  box-shadow: var(--shadow-inset-highlight);
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}

.chest-card:hover {
  transform: translateY(-2px);
  border-color: rgba(224, 179, 110, 0.35);
}

.chest-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: var(--radius-lg);
  background: rgba(224, 179, 110, 0.14);
  border: 1px solid rgba(224, 179, 110, 0.28);
  color: var(--color-accent-gold);
  margin-bottom: 0.25rem;
}

.chest-name {
  font-family: var(--font-display);
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.chest-count,
.empty {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.no-chests {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 2.75rem 1.5rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  background: var(--bg-glass-lighter);
  color: var(--color-text-muted);
  font-size: var(--font-sm);
  text-align: center;
}

.no-chests-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-xl);
  background: rgba(224, 179, 110, 0.1);
  color: var(--color-accent-gold);
}

.open-chest {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.55rem 1rem;
  border-radius: var(--radius-md);
  border: none;
  background: var(--gradient-primary);
  color: var(--color-bg-base);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: var(--transition-all);
}

.open-chest:hover:not(:disabled) {
  background: var(--gradient-primary-hover);
  box-shadow: var(--shadow-hover-brand);
}

.open-chest:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-lg);
  color: var(--color-error-light);
  font-size: var(--font-sm);
}

.chest-result {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-top: 1.25rem;
  padding: 0.9rem 1.15rem;
  border-radius: var(--radius-xl);
  background: rgba(114, 188, 224, 0.1);
  border: 1px solid var(--color-border-brand);
  color: var(--color-text-primary);
  font-weight: var(--font-medium);
}

.chest-result img {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  object-fit: contain;
  background: var(--color-bg-darker);
  padding: 4px;
}
</style>
