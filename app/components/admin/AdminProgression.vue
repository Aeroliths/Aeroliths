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
          <label :for="`reward-kind-${index}`">Reward</label>
          <select :id="`reward-kind-${index}`" v-model="reward.kind" class="reward-kind">
            <option value="lithos">Lithos</option>
            <option value="chest">Chest</option>
          </select>
        </div>
        <div v-if="reward.kind === 'lithos'" class="form-group">
          <label :for="`reward-lithos-${index}`">Lithos</label>
          <select :id="`reward-lithos-${index}`" v-model="reward.lithosId" class="reward-lithos">
            <option v-for="lithos in catalog" :key="lithos.id" :value="lithos.id">
              {{ lithos.name }}
            </option>
          </select>
        </div>
        <div v-else class="form-group">
          <label :for="`reward-chest-${index}`">Chest</label>
          <select :id="`reward-chest-${index}`" v-model="reward.chestTypeId" class="reward-chest">
            <option v-for="chest in chestTypes" :key="chest.id" :value="chest.id">
              {{ chest.name }}
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

    <section class="progression-block">
      <div class="progression-head">
        <h3>Chest types</h3>
        <p class="progression-hint">
          Weights are relative: an entry weighted 3 comes out three times as
          often as one weighted 1.
        </p>
      </div>

      <div v-if="chestTypes.length === 0" class="no-data">No chest type yet.</div>

      <div v-for="chest in chestTypes" :key="chest.id" class="chest-row">
        <div class="chest-head">
          <strong>{{ chest.name }}</strong>
          <button class="btn-delete-small remove-chest" @click="removeChest(chest)">Delete</button>
        </div>

        <div v-if="chest.lootEntries.length === 0" class="no-data">
          Empty table: this chest cannot be opened until it holds something.
        </div>

        <div v-for="(entry, index) in chest.lootEntries" :key="index" class="loot-row">
          <div class="form-group">
            <label :for="`loot-lithos-${chest.id}-${index}`">Lithos</label>
            <select
              :id="`loot-lithos-${chest.id}-${index}`"
              v-model="entry.lithosId"
              class="loot-lithos"
            >
              <option v-for="lithos in catalog" :key="lithos.id" :value="lithos.id">
                {{ lithos.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label :for="`loot-weight-${chest.id}-${index}`">Weight</label>
            <input
              :id="`loot-weight-${chest.id}-${index}`"
              v-model.number="entry.weight"
              type="number"
              class="loot-weight"
              min="1"
            />
          </div>
          <button class="btn-delete-small" @click="chest.lootEntries.splice(index, 1)">
            Remove
          </button>
        </div>

        <div class="progression-actions">
          <button class="btn-add" @click="addLootEntry(chest)">Add entry</button>
          <button class="btn-create save-loot" :disabled="saving" @click="saveLoot(chest)">
            Save table
          </button>
        </div>
      </div>

      <div class="progression-actions">
        <input
          v-model="newChestName"
          class="new-chest-name"
          placeholder="New chest type name"
        />
        <button class="btn-create add-chest" :disabled="saving" @click="createChest">
          Add chest type
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
  chestTypeId: string
}

interface ChestRow {
  id: string
  name: string
  lootEntries: { lithosId: string; weight: number }[]
}

const curve = ref<CurveRow[]>([])
const rewards = ref<RewardRow[]>([])
const chestTypes = ref<ChestRow[]>([])
const newChestName = ref('')
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
    rewards.value = config.data.rewards.map((reward: RewardRow) => ({
      ...reward,
      lithosId: reward.lithosId ?? '',
      chestTypeId: reward.chestTypeId ?? '',
    }))
    chestTypes.value = (config.data.chestTypes ?? []).map((chest: ChestRow) => ({
      ...chest,
      lootEntries: chest.lootEntries.map((entry) => ({ ...entry })),
    }))
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
    chestTypeId: chestTypes.value[0]?.id ?? '',
  })
}

function addLootEntry(chest: ChestRow) {
  chest.lootEntries.push({ lithosId: catalog.value[0]?.id ?? '', weight: 1 })
}

async function createChest() {
  const name = newChestName.value.trim()
  if (name.length === 0) {
    error.value = 'A chest type needs a name'
    return
  }
  saving.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/chests', { method: 'POST', body: { name } })
    newChestName.value = ''
    await load()
    notice.value = 'Chest type created'
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to create the chest type'
  } finally {
    saving.value = false
  }
}

async function removeChest(chest: ChestRow) {
  saving.value = true
  error.value = ''
  try {
    await $fetch(`/api/admin/chests/${chest.id}`, { method: 'DELETE' })
    await load()
    notice.value = 'Chest type deleted'
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to delete the chest type'
  } finally {
    saving.value = false
  }
}

async function saveLoot(chest: ChestRow) {
  saving.value = true
  error.value = ''
  try {
    await $fetch(`/api/admin/chests/${chest.id}/loot`, {
      method: 'PUT',
      body: { entries: chest.lootEntries },
    })
    notice.value = 'Loot table saved'
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to save the loot table'
  } finally {
    saving.value = false
  }
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr) auto;
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

.chest-row {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-md);
}

.chest-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.loot-row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto;
  gap: var(--spacing-md);
  align-items: end;
  margin-bottom: var(--spacing-sm);
}

.loot-row .form-group {
  margin-bottom: 0;
}

.loot-row .btn-delete-small {
  height: fit-content;
  margin-bottom: var(--spacing-xs);
}

@media (max-width: 720px) {
  .curve-row,
  .reward-row,
  .loot-row {
    grid-template-columns: 1fr;
  }
}
</style>
