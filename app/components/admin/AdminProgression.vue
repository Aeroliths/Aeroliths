<template>
  <div class="admin-section">
    <h2>Progression</h2>

    <div v-if="loading" class="loading">Loading progression...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="notice" class="success-message">{{ notice }}</div>

    <section class="progression-block">
      <h3>Level curve</h3>
      <p class="hint">
        Level 1 must require zero XP, levels must be consecutive, and each
        threshold must exceed the previous one.
      </p>

      <div v-for="(entry, index) in curve" :key="index" class="curve-row">
        <label>
          Level
          <input v-model.number="entry.level" type="number" class="level-number" min="1" />
        </label>
        <label>
          XP required
          <input v-model.number="entry.xpRequired" type="number" class="xp-required" min="0" />
        </label>
        <button class="ghost-btn remove-level" @click="curve.splice(index, 1)">Remove</button>
      </div>

      <div class="progression-actions">
        <button class="ghost-btn add-level" @click="addLevel">Add level</button>
        <button class="btn-create save-curve" :disabled="saving" @click="saveCurve">
          Save curve
        </button>
      </div>
    </section>

    <section class="progression-block">
      <h3>Reward tiers</h3>
      <p class="hint">One tier per level, on a level the curve defines.</p>

      <div v-for="(reward, index) in rewards" :key="index" class="reward-row">
        <label>
          Level
          <select v-model.number="reward.level" class="reward-level">
            <option v-for="entry in curve" :key="entry.level" :value="entry.level">
              {{ entry.level }}
            </option>
          </select>
        </label>
        <label>
          Lithos
          <select v-model="reward.lithosId" class="reward-lithos">
            <option v-for="lithos in catalog" :key="lithos.id" :value="lithos.id">
              {{ lithos.name }}
            </option>
          </select>
        </label>
        <label>
          Quantity
          <input v-model.number="reward.quantity" type="number" class="reward-quantity" min="1" />
        </label>
        <button class="ghost-btn remove-reward" @click="rewards.splice(index, 1)">Remove</button>
      </div>

      <div class="progression-actions">
        <button class="ghost-btn add-reward" @click="addReward">Add tier</button>
        <button class="btn-create save-rewards" :disabled="saving" @click="saveRewards">
          Save tiers
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { validateCurve } from '~~/server/utils/progression'

interface CurveRow {
  level: number
  xpRequired: number
}

interface RewardRow {
  level: number
  kind: string
  quantity: number
  lithosId: string
}

const curve = ref<CurveRow[]>([])
const rewards = ref<RewardRow[]>([])
const catalog = ref<{ id: string; name: string }[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [config, lithos] = await Promise.all([
      $fetch<any>('/api/admin/progression'),
      $fetch<any>('/api/lithos'),
    ])
    curve.value = config.data.curve.map((entry: CurveRow) => ({ ...entry }))
    rewards.value = config.data.rewards.map((reward: RewardRow) => ({ ...reward }))
    catalog.value = lithos.data
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to load the progression config'
  } finally {
    loading.value = false
  }
}

function addLevel() {
  const nextLevel = curve.value.length === 0 ? 1 : Math.max(...curve.value.map((e) => e.level)) + 1
  const highest = curve.value.reduce((max, e) => Math.max(max, e.xpRequired), 0)
  curve.value.push({ level: nextLevel, xpRequired: nextLevel === 1 ? 0 : highest + 100 })
}

function addReward() {
  rewards.value.push({
    level: curve.value[0]?.level ?? 1,
    kind: 'lithos',
    quantity: 1,
    lithosId: catalog.value[0]?.id ?? '',
  })
}

async function saveCurve() {
  // The same rules the server applies, run here so a broken curve never leaves
  // the browser and the administrator sees exactly why.
  const invalid = validateCurve(curve.value)
  if (invalid) {
    error.value = invalid
    notice.value = ''
    return
  }

  saving.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/progression/curve', { method: 'PUT', body: { curve: curve.value } })
    notice.value = 'Curve saved'
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to save the curve'
  } finally {
    saving.value = false
  }
}

async function saveRewards() {
  saving.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/progression/rewards', {
      method: 'PUT',
      body: { rewards: rewards.value },
    })
    notice.value = 'Tiers saved'
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to save the tiers'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.progression-block {
  margin-bottom: var(--spacing-lg);
}

.curve-row,
.reward-row {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-end;
  margin-bottom: var(--spacing-xs);
  flex-wrap: wrap;
}

.progression-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
</style>
