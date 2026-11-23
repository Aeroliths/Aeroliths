<template>
  <div class="deck-builder">
    <!-- Collection panel -->
    <div class="panel collection-panel">
      <div class="panel-header">
        <h2>{{ $t('play.deckBuilder.myCollection') }}</h2>
        <span class="count">{{ collection.length }} {{ $t('play.deckBuilder.lithosSuffix') }}</span>
      </div>

      <div v-if="loading" class="loading">{{ $t('play.deckBuilder.loading') }}</div>

      <div v-else-if="collection.length === 0" class="empty">
        {{ $t('play.deckBuilder.collectionEmpty') }}
      </div>

      <div v-else class="lithos-grid">
        <div
          v-for="item in collection"
          :key="item.id"
          class="litho-card"
          :class="`rarity-${item.lithos.rarity}`"
        >
          <div class="litho-visual">
            <GameStone :stone="lithoToStone(item.lithos)" />
          </div>
          <div class="litho-info">
            <span class="litho-name">{{ item.lithos.name }}</span>
            <span class="litho-rarity" :class="`rarity-text-${item.lithos.rarity}`">{{ item.lithos.rarity }}</span>
          </div>
          <div class="deck-controls">
            <span class="owned-qty">{{ $t('play.deckBuilder.ownedPrefix') }}{{ item.quantity }}</span>
            <div class="qty-buttons">
              <button
                class="qty-btn"
                :disabled="getDeckQty(item.lithos.id) === 0 || saving === item.lithos.id"
                @click="updateDeck(item.lithos.id, getDeckQty(item.lithos.id) - 1)"
                aria-label="Decrease quantity"
              >
                <Papicon name="minus" :size="13" />
              </button>
              <span class="deck-qty">{{ getDeckQty(item.lithos.id) }}/{{ maxInDeck(item) }}</span>
              <button
                class="qty-btn"
                :disabled="getDeckQty(item.lithos.id) >= maxInDeck(item) || saving === item.lithos.id"
                @click="updateDeck(item.lithos.id, getDeckQty(item.lithos.id) + 1)"
                aria-label="Increase quantity"
              >
                <Papicon name="plus" :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Deck panel -->
    <div class="panel deck-panel">
      <div class="panel-header">
        <h2>{{ $t('play.deckBuilder.myDeck') }}</h2>
        <span class="count">{{ totalDeckCards }} {{ totalDeckCards !== 1 ? $t('play.deckBuilder.cardPlural') : $t('play.deckBuilder.cardSingular') }}</span>
      </div>

      <div v-if="deckEntries.length === 0" class="empty">
        {{ $t('play.deckBuilder.addFromCollection') }}
      </div>

      <div v-else class="deck-list">
        <div
          v-for="entry in deckEntries"
          :key="entry.id"
          class="deck-entry"
          :class="`rarity-${entry.lithos.rarity}`"
        >
          <div class="deck-visual">
            <GameStone :stone="lithoToStone(entry.lithos)" />
          </div>
          <div class="deck-entry-info">
            <span class="litho-name">{{ entry.lithos.name }}</span>
            <span class="litho-rarity" :class="`rarity-text-${entry.lithos.rarity}`">{{ entry.lithos.rarity }}</span>
          </div>
          <div class="deck-entry-qty">×{{ entry.quantity }}</div>
          <button
            class="remove-btn"
            :disabled="saving === entry.lithos.id"
            @click="updateDeck(entry.lithos.id, 0)"
            :title="$t('play.deckBuilder.removeTitle')"
          >
            <Papicon name="cross" :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Papicon from '~/components/Papicon.vue'
import GameStone from '~/components/game/GameStone.vue'
import type { Stone } from '~/game/engine/types'

interface Lithos {
  id: string
  name: string
  sprite: string
  rarity: string
  spikeUp: number
  spikeRight: number
  spikeDown: number
  spikeLeft: number
  elementId?: string | null
  element?: { id: string; name: string; sprite?: string | null } | null
}

function lithoToStone(l: Lithos): Stone {
  return {
    id: l.id,
    name: l.name,
    sprite: l.sprite,
    elementId: l.elementId ?? null,
    elementName: l.element?.name ?? null,
    elementSprite: l.element?.sprite ?? null,
    spikeUp: l.spikeUp,
    spikeDown: l.spikeDown,
    spikeLeft: l.spikeLeft,
    spikeRight: l.spikeRight,
  }
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

async function fetchAll() {
  loading.value = true
  try {
    const [colRes, deckRes] = await Promise.all([
      $fetch<{ data: CollectionItem[] }>('/api/collections'),
      $fetch<{ data: { entries: DeckEntry[] } }>('/api/deck'),
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
      body: { lithosId, quantity },
    })
    if (quantity === 0) {
      deckEntries.value = deckEntries.value.filter(e => e.lithosId !== lithosId)
    } else {
      const existing = deckEntries.value.find(e => e.lithosId === lithosId)
      if (existing) {
        existing.quantity = quantity
      } else {
        const res = await $fetch<{ data: { entries: DeckEntry[] } }>('/api/deck')
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
  grid-template-columns: 1fr 330px;
  gap: 1.25rem;
  align-items: start;
}

/* ---- Panels ---- */
.panel {
  background: var(--bg-glass-lighter);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-2xl);
  padding: 1.35rem;
  box-shadow: var(--shadow-inset-highlight);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.15rem;
}

.panel-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.count {
  font-size: var(--font-xs);
  font-weight: var(--font-semibold);
  color: var(--color-brand-primary-light);
  background: rgba(114, 188, 224, 0.12);
  border: 1px solid var(--color-border-brand-light);
  padding: 0.25rem 0.7rem;
  border-radius: var(--radius-full);
  font-variant-numeric: tabular-nums;
}

.loading,
.empty {
  color: var(--color-text-muted);
  text-align: center;
  padding: 2.25rem 0;
  font-size: var(--font-sm);
}

/* ---- Collection grid ---- */
.lithos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 0.9rem;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.litho-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-xl);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.litho-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.litho-visual {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  background: var(--color-bg-darker);
  border: 1px solid var(--color-border-lighter);
}

.litho-info {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.4rem;
}

.litho-name {
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.litho-rarity {
  font-size: 0.7rem;
  font-weight: var(--font-semibold);
  text-transform: capitalize;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.rarity-text-common { color: #94a3b8; }
.rarity-text-rare { color: #60a5fa; }
.rarity-text-epic { color: #c084fc; }
.rarity-text-legendary { color: var(--color-accent-gold); }

/* ---- Deck controls ---- */
.deck-controls {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: auto;
  padding-top: 0.45rem;
  border-top: 1px solid var(--color-border-lighter);
}

.owned-qty {
  font-size: 0.72rem;
  color: var(--color-text-subtle);
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
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  background: var(--bg-glass-light);
  color: var(--color-text-primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.qty-btn:hover:not(:disabled) {
  background: rgba(114, 188, 224, 0.14);
  border-color: var(--color-border-brand);
  color: var(--color-brand-primary-light);
}

.qty-btn:disabled {
  opacity: 0.32;
  cursor: not-allowed;
}

.deck-qty {
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
  min-width: 34px;
  text-align: center;
}

/* ---- Deck list ---- */
.deck-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  max-height: 70vh;
  overflow-y: auto;
}

.deck-entry {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-lg);
  padding: 0.5rem 0.75rem;
  transition: border-color var(--transition-fast);
}

.deck-visual {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--color-bg-darker);
  border: 1px solid var(--color-border-lighter);
}

.deck-entry-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.deck-entry-qty {
  font-size: var(--font-sm);
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
  color: var(--color-brand-primary-light);
  white-space: nowrap;
}

.remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: 1px solid transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
  flex-shrink: 0;
}

.remove-btn:hover:not(:disabled) {
  color: var(--color-error-light);
  background: var(--color-error-bg);
  border-color: var(--color-error-border);
}

/* ---- Rarity borders ---- */
.rarity-common    { border-color: rgba(148, 163, 184, 0.24); }
.rarity-rare      { border-color: rgba(96, 165, 250, 0.38); }
.rarity-epic      { border-color: rgba(192, 132, 252, 0.42); }
.rarity-legendary { border-color: rgba(224, 179, 110, 0.5); }

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
