<template>
  <div class="tab-content">
    <h2>Progression</h2>

    <div v-if="loading" class="loading">Loading progression...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="notice" class="success-message">{{ notice }}</div>

    <section class="progression-block">
      <div class="progression-head">
        <h3>Level curve</h3>
        <p class="progression-hint">
          Level 1 must require zero XP, levels must be consecutive, and each
          threshold must exceed the previous one.
        </p>
      </div>

      <div v-if="curve.length === 0" class="no-data">
        No curve yet. Add a level to start: nothing levels up until the curve exists.
      </div>

      <div v-for="(entry, index) in curve" :key="index" class="curve-row">
        <div class="form-group">
          <label :for="`level-${index}`">Level</label>
          <input
            :id="`level-${index}`"
            v-model.number="entry.level"
            type="number"
            class="level-number"
            min="1"
          />
        </div>
        <div class="form-group">
          <label :for="`xp-${index}`">XP required</label>
          <input
            :id="`xp-${index}`"
            v-model.number="entry.xpRequired"
            type="number"
            class="xp-required"
            min="0"
          />
        </div>
        <button class="btn-delete-small remove-level" @click="curve.splice(index, 1)">
          Remove
        </button>
      </div>

      <div class="progression-actions">
        <button class="btn-add add-level" @click="addLevel">Add level</button>
        <button class="btn-create save-curve" :disabled="saving" @click="saveCurve">
          Save curve
        </button>
      </div>
    </section>

    <section class="progression-block">
      <div class="progression-head">
        <h3>Reward tiers</h3>
        <p class="progression-hint">One tier per level, on a level the curve defines.</p>
      </div>

      <div v-if="rewards.length === 0" class="no-data">No reward tier configured.</div>

      <div v-for="(reward, index) in rewards" :key="index" class="reward-row">
        <div class="form-group">
          <label :for="`reward-level-${index}`">Level</label>
          <select :id="`reward-level-${index}`" v-model.number="reward.level" class="reward-level">
            <option v-for="entry in curve" :key="entry.level" :value="entry.level">
              {{ entry.level }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label :for="`reward-lithos-${index}`">Lithos</label>
          <select :id="`reward-lithos-${index}`" v-model="reward.lithosId" class="reward-lithos">
            <option v-for="lithos in catalog" :key="lithos.id" :value="lithos.id">
              {{ lithos.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label :for="`reward-qty-${index}`">Quantity</label>
          <input
            :id="`reward-qty-${index}`"
            v-model.number="reward.quantity"
            type="number"
            class="reward-quantity"
            min="1"
          />
        </div>
        <button class="btn-delete-small remove-reward" @click="rewards.splice(index, 1)">
          Remove
        </button>
      </div>

      <div class="progression-actions">
        <button class="btn-add add-reward" :disabled="curve.length === 0" @click="addReward">
          Add tier
        </button>
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
/* Layout only: every control reuses the shared admin styles, so the fields and
   buttons here look like the ones in the other tabs rather than like browser
   defaults. */
.progression-block {
  margin-bottom: var(--spacing-2xl, 2rem);
}

.progression-head {
  margin-bottom: var(--spacing-md);
}

.progression-head h3 {
  margin: 0 0 var(--spacing-xxs) 0;
}

.progression-hint {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

/* The remove button sits on its own track so the fields keep a steady width
   however many rows there are. */
.curve-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
  gap: var(--spacing-md);
  align-items: end;
  margin-bottom: var(--spacing-sm);
}

.reward-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr) auto;
  gap: var(--spacing-md);
  align-items: end;
  margin-bottom: var(--spacing-sm);
}

.curve-row .form-group,
.reward-row .form-group {
  margin-bottom: 0;
}

.curve-row .btn-delete-small,
.reward-row .btn-delete-small {
  height: fit-content;
  margin-bottom: var(--spacing-xs);
}

.progression-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  flex-wrap: wrap;
}

@media (max-width: 720px) {
  .curve-row,
  .reward-row {
    grid-template-columns: 1fr;
  }
}
</style>
