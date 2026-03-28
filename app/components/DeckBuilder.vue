<template>
  <div class="deck-builder">
    <!-- Collection panel -->
    <div class="panel collection-panel">
      <div class="panel-header">
        <h2>My Collection</h2>
        <span class="count">{{ collection.length }} lithos</span>
      </div>

      <div v-if="loading" class="loading">Loading...</div>

      <div v-else-if="collection.length === 0" class="empty">
        Your collection is empty.
      </div>

      <div v-else class="lithos-grid">
        <div
          v-for="item in collection"
          :key="item.id"
          class="litho-card"
          :class="`rarity-${item.lithos.rarity}`"
        >
          <img :src="item.lithos.sprite" :alt="item.lithos.name" class="litho-sprite" />
          <div class="litho-info">
            <span class="litho-name">{{ item.lithos.name }}</span>
            <span class="litho-rarity">{{ item.lithos.rarity }}</span>
          </div>
          <div class="litho-spikes">
            <span title="Up">↑{{ item.lithos.spikeUp }}</span>
            <span title="Right">→{{ item.lithos.spikeRight }}</span>
            <span title="Down">↓{{ item.lithos.spikeDown }}</span>
            <span title="Left">←{{ item.lithos.spikeLeft }}</span>
          </div>
          <div class="deck-controls">
            <span class="owned-qty">Owned: {{ item.quantity }}</span>
            <div class="qty-buttons">
              <button
                class="qty-btn"
                :disabled="getDeckQty(item.lithos.id) === 0 || saving === item.lithos.id"
                @click="updateDeck(item.lithos.id, getDeckQty(item.lithos.id) - 1)"
              >−</button>
              <span class="deck-qty">{{ getDeckQty(item.lithos.id) }}/{{ maxInDeck(item) }}</span>
              <button
                class="qty-btn"
                :disabled="getDeckQty(item.lithos.id) >= maxInDeck(item) || saving === item.lithos.id"
                @click="updateDeck(item.lithos.id, getDeckQty(item.lithos.id) + 1)"
              >+</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Deck panel -->
    <div class="panel deck-panel">
      <div class="panel-header">
        <h2>My Deck</h2>
        <span class="count">{{ totalDeckCards }} card{{ totalDeckCards !== 1 ? 's' : '' }}</span>
      </div>

      <div v-if="deckEntries.length === 0" class="empty">
        Add lithos from your collection.
      </div>

      <div v-else class="deck-list">
        <div
          v-for="entry in deckEntries"
          :key="entry.id"
          class="deck-entry"
          :class="`rarity-${entry.lithos.rarity}`"
        >
          <img :src="entry.lithos.sprite" :alt="entry.lithos.name" class="deck-sprite" />
          <div class="deck-entry-info">
            <span class="litho-name">{{ entry.lithos.name }}</span>
            <span class="litho-rarity">{{ entry.lithos.rarity }}</span>
          </div>
          <div class="deck-entry-qty">× {{ entry.quantity }}</div>
          <button
            class="remove-btn"
            :disabled="saving === entry.lithos.id"
            @click="updateDeck(entry.lithos.id, 0)"
            title="Remove"
          >✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { token } = useAuth()

interface Lithos {
  id: string
  name: string
  sprite: string
  rarity: string
  spikeUp: number
  spikeRight: number
  spikeDown: number
  spikeLeft: number
}

interface CollectionItem {
  id: string
  quantity: number
  lithos: Lithos
}

interface DeckEntry {
  id: string
  quantity: number
  lithosId: string
  lithos: Lithos
}

const loading = ref(true)
const saving = ref<string | null>(null)
const collection = ref<CollectionItem[]>([])
const deckEntries = ref<DeckEntry[]>([])

const totalDeckCards = computed(() =>
  deckEntries.value.reduce((sum, e) => sum + e.quantity, 0)
)

function getDeckQty(lithosId: string): number {
  return deckEntries.value.find(e => e.lithosId === lithosId)?.quantity ?? 0
}

function maxInDeck(item: CollectionItem): number {
  return Math.min(2, item.quantity)
}

const authHeaders = computed(() => ({
  Authorization: `Bearer ${token.value}`,
}))

async function fetchAll() {
  loading.value = true
  try {
    const [colRes, deckRes] = await Promise.all([
      $fetch<{ data: CollectionItem[] }>('/api/collections', { headers: authHeaders.value }),
      $fetch<{ data: { entries: DeckEntry[] } }>('/api/deck', { headers: authHeaders.value }),
    ])
    collection.value = colRes.data
    deckEntries.value = deckRes.data.entries
  } finally {
    loading.value = false
  }
}

async function updateDeck(lithosId: string, quantity: number) {
  saving.value = lithosId
  try {
    await $fetch('/api/deck/entries', {
      method: 'PUT',
      headers: authHeaders.value,
      body: { lithosId, quantity },
    })
    // Update local state
    if (quantity === 0) {
      deckEntries.value = deckEntries.value.filter(e => e.lithosId !== lithosId)
    } else {
      const existing = deckEntries.value.find(e => e.lithosId === lithosId)
      if (existing) {
        existing.quantity = quantity
      } else {
        // Refetch to get full entry with lithos details
        const res = await $fetch<{ data: { entries: DeckEntry[] } }>('/api/deck', {
          headers: authHeaders.value,
        })
        deckEntries.value = res.data.entries
      }
    }
  } catch (err: any) {
    console.error('Failed to update deck:', err.data?.message || err)
  } finally {
    saving.value = null
  }
}

onMounted(fetchAll)
</script>

<style scoped>
.deck-builder {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  align-items: start;
}

/* ---- Panels ---- */
.panel {
  background: var(--bg-glass-light);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-2xl);
  padding: 1.5rem;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.panel-header h2 {
  margin: 0;
  font-size: var(--font-2xl);
  color: var(--color-text-primary);
}

.count {
  font-size: var(--font-sm);
  color: var(--color-text-muted);
  background: var(--bg-glass-medium);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
}

.loading,
.empty {
  color: var(--color-text-muted);
  text-align: center;
  padding: 2rem 0;
  font-size: var(--font-base);
}

/* ---- Collection grid ---- */
.lithos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.litho-card {
  background: var(--bg-glass-medium);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.15s;
}

.litho-card:hover {
  transform: translateY(-2px);
}

.litho-sprite {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  border-radius: var(--radius-lg);
}

.litho-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.litho-name {
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.litho-rarity {
  font-size: 0.7rem;
  text-transform: capitalize;
  color: var(--color-text-muted);
}

.litho-spikes {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

/* ---- Deck controls ---- */
.deck-controls {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: auto;
}

.owned-qty {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-align: center;
}

.qty-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--color-border-light);
  background: var(--bg-glass-light);
  color: var(--color-text-primary);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.qty-btn:hover:not(:disabled) {
  background: var(--bg-glass-medium);
}

.qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.deck-qty {
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  min-width: 32px;
  text-align: center;
}

/* ---- Deck list ---- */
.deck-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-height: 70vh;
  overflow-y: auto;
}

.deck-entry {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--bg-glass-medium);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: 0.5rem 0.75rem;
}

.deck-sprite {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.deck-entry-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.deck-entry-info .litho-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.deck-entry-qty {
  font-size: var(--font-sm);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: color 0.15s;
  flex-shrink: 0;
}

.remove-btn:hover:not(:disabled) {
  color: var(--color-error-light);
}

/* ---- Rarity borders ---- */
.rarity-common    { border-color: rgba(150, 150, 150, 0.3); }
.rarity-rare      { border-color: rgba(59, 130, 246, 0.4); }
.rarity-epic      { border-color: rgba(139, 92, 246, 0.4); }
.rarity-legendary { border-color: rgba(245, 158, 11, 0.4); }

/* ---- Responsive ---- */
@media (max-width: 900px) {
  .deck-builder {
    grid-template-columns: 1fr;
  }

  .deck-panel {
    order: -1;
  }

  .lithos-grid,
  .deck-list {
    max-height: 50vh;
  }
}
</style>
