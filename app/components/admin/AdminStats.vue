<template>
  <div class="tab-content">
    <div class="stats-header">
      <h2>Statistics</h2>
      <div class="stats-toolbar">
        <button
          class="btn-refresh"
          :class="{ spinning: refreshing }"
          @click="refreshStats"
          :disabled="refreshing"
          title="Refresh stats"
        >
          &#x21bb;
        </button>
        <span v-if="lastUpdated" class="last-updated">
          Updated {{ formatRelative(lastUpdated) }}
        </span>
      </div>
    </div>

    <div v-if="loading && !stats" class="loading">Loading statistics...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="stats" class="stats-dashboard" :class="{ 'stats-refreshing': refreshing }">

      <!-- Overview Cards -->
      <div class="stats-section">
        <div class="stats-section-header" @click="toggleSection('overview')">
          <h3 class="stats-section-title">Overview</h3>
          <span class="section-toggle" :class="{ collapsed: !sections.overview }">&#x25BC;</span>
        </div>
        <div v-show="sections.overview">
          <div class="stats-cards">
            <div class="stat-card stat-card--primary stat-card--clickable" @click="scrollToSection('users')">
              <span class="stat-value">{{ animatedValues.totalUsers }}</span>
              <span class="stat-label">Total Accounts</span>
              <span class="stat-hint">Click to see details</span>
            </div>
            <div class="stat-card stat-card--info">
              <span class="stat-value">{{ animatedValues.activeToday }}</span>
              <span class="stat-label">Active Today</span>
            </div>
            <div class="stat-card stat-card--success stat-card--clickable" @click="scrollToSection('lithos')">
              <span class="stat-value">{{ animatedValues.totalLithos }}</span>
              <span class="stat-label">Total Lithos</span>
              <span class="stat-hint">Click to see details</span>
            </div>
            <div class="stat-card stat-card--warning stat-card--clickable" @click="scrollToSection('collections')">
              <span class="stat-value">{{ animatedValues.totalDecks }}</span>
              <span class="stat-label">Decks Created</span>
              <span class="stat-hint">Click to see details</span>
            </div>
          </div>
        </div>
      </div>

      <!-- User Stats -->
      <div class="stats-section" ref="sectionUsers">
        <div class="stats-section-header" @click="toggleSection('users')">
          <h3 class="stats-section-title">Users</h3>
          <span class="section-toggle" :class="{ collapsed: !sections.users }">&#x25BC;</span>
        </div>
        <div v-show="sections.users">
          <!-- Period Selector -->
          <div class="stats-period-selector">
            <button
              v-for="p in periods"
              :key="p.value"
              :class="{ active: userPeriod === p.value }"
              @click="userPeriod = p.value"
            >
              {{ p.label }}
            </button>
          </div>

          <div class="stats-cards">
            <div class="stat-card">
              <span class="stat-value">{{ userPeriodData.new }}</span>
              <span class="stat-label">New {{ userPeriodLabel }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ userPeriodData.active }}</span>
              <span class="stat-label">Active {{ userPeriodLabel }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ stats.users.total }}</span>
              <span class="stat-label">Total Accounts</span>
            </div>
          </div>

          <!-- Users by Role -->
          <div class="stats-table-small">
            <h4>By Role</h4>
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="role in stats.users.byRole" :key="role.role">
                  <td>
                    <span :class="['role-badge', role.role]">{{ role.role }}</span>
                  </td>
                  <td>{{ role.count }}</td>
                  <td>
                    <div class="stats-bar-wrapper">
                      <div class="stats-bar" :style="{ width: getRolePercent(role.count) + '%' }"></div>
                      <span class="stats-bar-label">{{ getRolePercent(role.count) }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Games Stats (Coming Soon) -->
      <div class="stats-section">
        <div class="stats-section-header" @click="toggleSection('games')">
          <h3 class="stats-section-title">Games</h3>
          <span class="coming-soon-badge">In Development</span>
          <span class="section-toggle" :class="{ collapsed: !sections.games }">&#x25BC;</span>
        </div>
        <div v-show="sections.games">
          <div class="stats-coming-soon">
            <p>Game statistics will be available once the battle system is implemented.</p>
            <div class="stats-cards stats-cards--disabled">
              <div class="stat-card stat-card--disabled">
                <span class="stat-value">--</span>
                <span class="stat-label">Total Games</span>
              </div>
              <div class="stat-card stat-card--disabled">
                <span class="stat-value">--</span>
                <span class="stat-label">Games Today</span>
              </div>
              <div class="stat-card stat-card--disabled">
                <span class="stat-value">--</span>
                <span class="stat-label">Games This Week</span>
              </div>
              <div class="stat-card stat-card--disabled">
                <span class="stat-value">--</span>
                <span class="stat-label">Avg. Per Day</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lithos Stats -->
      <div class="stats-section" ref="sectionLithos">
        <div class="stats-section-header" @click="toggleSection('lithos')">
          <h3 class="stats-section-title">Lithos</h3>
          <span class="section-toggle" :class="{ collapsed: !sections.lithos }">&#x25BC;</span>
        </div>
        <div v-show="sections.lithos">
          <div class="stats-tables-row">
            <!-- By Rarity -->
            <div class="stats-table-small">
              <h4>By Rarity</h4>
              <table>
                <thead>
                  <tr>
                    <th>Rarity</th>
                    <th>Count</th>
                    <th>Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in stats.lithos.byRarity" :key="r.rarity">
                    <td>
                      <span :class="['rarity-tag', 'rarity-' + r.rarity.toLowerCase()]">{{ r.rarity }}</span>
                    </td>
                    <td>{{ r.count }}</td>
                    <td>
                      <div class="stats-bar-wrapper">
                        <div
                          class="stats-bar"
                          :class="'bar-rarity-' + r.rarity.toLowerCase()"
                          :style="{ width: getLithosPercent(r.count) + '%' }"
                        ></div>
                        <span class="stats-bar-label">{{ getLithosPercent(r.count) }}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- By Element -->
            <div class="stats-table-small">
              <h4>By Element</h4>
              <table>
                <thead>
                  <tr>
                    <th>Element</th>
                    <th>Count</th>
                    <th>Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="e in stats.lithos.byElement" :key="e.element">
                    <td>{{ e.element }}</td>
                    <td>{{ e.count }}</td>
                    <td>
                      <div class="stats-bar-wrapper">
                        <div class="stats-bar" :style="{ width: getLithosPercent(e.count) + '%' }"></div>
                        <span class="stats-bar-label">{{ getLithosPercent(e.count) }}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Collections Stats -->
      <div class="stats-section" ref="sectionCollections">
        <div class="stats-section-header" @click="toggleSection('collections')">
          <h3 class="stats-section-title">Collections</h3>
          <span class="section-toggle" :class="{ collapsed: !sections.collections }">&#x25BC;</span>
        </div>
        <div v-show="sections.collections">
          <div class="stats-cards">
            <div class="stat-card">
              <span class="stat-value">{{ stats.collections.totalLithosOwned }}</span>
              <span class="stat-label">Total Lithos Owned</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ stats.collections.usersWithCollection }}</span>
              <span class="stat-label">Users With Collection</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ stats.collections.avgCollectionSize }}</span>
              <span class="stat-label">Avg. Collection Size</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ stats.collections.totalEntries }}</span>
              <span class="stat-label">Unique Entries</span>
            </div>
          </div>

          <!-- Most Collected -->
          <div v-if="stats.collections.topLithos.length > 0" class="stats-table-small">
            <div class="stats-table-header">
              <h4>Most Collected Lithos</h4>
              <div class="stats-sort-toggle">
                <button
                  :class="{ active: topLithosSort === 'collected' }"
                  @click="topLithosSort = 'collected'"
                >
                  By Quantity
                </button>
                <button
                  :class="{ active: topLithosSort === 'name' }"
                  @click="topLithosSort = 'name'"
                >
                  By Name
                </button>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Lithos</th>
                  <th>Rarity</th>
                  <th>Total Owned</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(lithos, index) in sortedTopLithos" :key="lithos.id">
                  <td>{{ index + 1 }}</td>
                  <td class="lithos-name-cell">
                    <img v-if="lithos.sprite" :src="lithos.sprite" :alt="lithos.name" class="stats-lithos-sprite" />
                    {{ lithos.name }}
                  </td>
                  <td>
                    <span v-if="lithos.rarity" :class="['rarity-tag', 'rarity-' + lithos.rarity.toLowerCase()]">{{ lithos.rarity }}</span>
                  </td>
                  <td>{{ lithos.totalCollected }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="stats-section">
        <div class="stats-section-header" @click="toggleSection('activity')">
          <h3 class="stats-section-title">Recent Activity</h3>
          <span class="section-toggle" :class="{ collapsed: !sections.activity }">&#x25BC;</span>
        </div>
        <div v-show="sections.activity">
          <!-- Search -->
          <div class="search-bar">
            <input
              v-model="activitySearch"
              type="text"
              placeholder="Search by username..."
              class="search-input"
            />
            <span class="search-icon">&#x1F50D;</span>
          </div>

          <div class="stats-table-small">
            <table>
              <thead>
                <tr>
                  <th class="th-sortable" @click="toggleActivitySort('username')">
                    Username
                    <span v-if="activitySortBy === 'username'" class="sort-arrow">{{ activitySortDir === 'asc' ? '&#x25B2;' : '&#x25BC;' }}</span>
                  </th>
                  <th class="th-sortable" @click="toggleActivitySort('createdAt')">
                    Registered
                    <span v-if="activitySortBy === 'createdAt'" class="sort-arrow">{{ activitySortDir === 'asc' ? '&#x25B2;' : '&#x25BC;' }}</span>
                  </th>
                  <th class="th-sortable" @click="toggleActivitySort('lastActiveAt')">
                    Last Active
                    <span v-if="activitySortBy === 'lastActiveAt'" class="sort-arrow">{{ activitySortDir === 'asc' ? '&#x25B2;' : '&#x25BC;' }}</span>
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in filteredActivityUsers" :key="u.id">
                  <td>{{ u.username }}</td>
                  <td>{{ formatDate(u.createdAt) }}</td>
                  <td>{{ formatRelative(u.lastActiveAt) }}</td>
                  <td>
                    <span :class="['status-dot', getStatusClass(u.lastActiveAt)]"></span>
                    {{ getStatusLabel(u.lastActiveAt) }}
                  </td>
                </tr>
                <tr v-if="filteredActivityUsers.length === 0">
                  <td colspan="4" class="no-data">No users match your search.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch, nextTick } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { initAuth } = useAuth()

const stats = ref<any>(null)
const loading = ref(false)
const refreshing = ref(false)
const error = ref('')
const lastUpdated = ref('')

// Section refs for scrolling
const sectionUsers = ref<HTMLElement | null>(null)
const sectionLithos = ref<HTMLElement | null>(null)
const sectionCollections = ref<HTMLElement | null>(null)

// Collapsible sections
const sections = reactive({
  overview: true,
  users: true,
  games: false,
  lithos: true,
  collections: true,
  activity: true,
})

const toggleSection = (key: keyof typeof sections) => {
  sections[key] = !sections[key]
}

const scrollToSection = (key: string) => {
  const refMap: Record<string, any> = {
    users: sectionUsers,
    lithos: sectionLithos,
    collections: sectionCollections,
  }
  const el = refMap[key]?.value
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Ensure section is open
    if (key in sections) {
      sections[key as keyof typeof sections] = true
    }
  }
}

// Period selector for users
const periods = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]
const userPeriod = ref('today')

const userPeriodLabel = computed(() => {
  switch (userPeriod.value) {
    case 'today': return 'Today'
    case 'week': return 'This Week'
    case 'month': return 'This Month'
    default: return ''
  }
})

const userPeriodData = computed(() => {
  if (!stats.value) return { new: 0, active: 0 }
  switch (userPeriod.value) {
    case 'today':
      return { new: stats.value.users.newToday, active: stats.value.users.activeToday }
    case 'week':
      return { new: stats.value.users.newThisWeek, active: stats.value.users.activeThisWeek }
    case 'month':
      return { new: stats.value.users.newThisMonth, active: stats.value.users.newThisMonth }
    default:
      return { new: 0, active: 0 }
  }
})

// Animated counter values
const animatedValues = reactive({
  totalUsers: 0,
  activeToday: 0,
  totalLithos: 0,
  totalDecks: 0,
})

const animateValue = (key: keyof typeof animatedValues, target: number) => {
  const duration = 800
  const start = animatedValues[key]
  const diff = target - start
  if (diff === 0) return
  const startTime = performance.now()

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    animatedValues[key] = Math.round(start + diff * eased)
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// Top lithos sort
const topLithosSort = ref<'collected' | 'name'>('collected')

const sortedTopLithos = computed(() => {
  if (!stats.value) return []
  const list = [...stats.value.collections.topLithos]
  if (topLithosSort.value === 'name') {
    list.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
  }
  return list
})

// Activity search & sort
const activitySearch = ref('')
const activitySortBy = ref<'username' | 'createdAt' | 'lastActiveAt'>('lastActiveAt')
const activitySortDir = ref<'asc' | 'desc'>('desc')

const toggleActivitySort = (col: 'username' | 'createdAt' | 'lastActiveAt') => {
  if (activitySortBy.value === col) {
    activitySortDir.value = activitySortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    activitySortBy.value = col
    activitySortDir.value = col === 'username' ? 'asc' : 'desc'
  }
}

const filteredActivityUsers = computed(() => {
  if (!stats.value) return []
  let list = [...stats.value.recentUsers]

  // Filter
  if (activitySearch.value) {
    const q = activitySearch.value.toLowerCase()
    list = list.filter((u: any) => u.username.toLowerCase().includes(q))
  }

  // Sort
  list.sort((a: any, b: any) => {
    let cmp = 0
    if (activitySortBy.value === 'username') {
      cmp = a.username.localeCompare(b.username)
    } else {
      cmp = new Date(a[activitySortBy.value]).getTime() - new Date(b[activitySortBy.value]).getTime()
    }
    return activitySortDir.value === 'asc' ? cmp : -cmp
  })

  return list
})

// Percentage helpers
const getRolePercent = (count: number) => {
  if (!stats.value || stats.value.users.total === 0) return 0
  return Math.round((count / stats.value.users.total) * 100)
}

const getLithosPercent = (count: number) => {
  if (!stats.value || stats.value.lithos.total === 0) return 0
  return Math.round((count / stats.value.lithos.total) * 100)
}

// Status helpers
const getStatusClass = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime()
  const diffHours = diffMs / 3600000
  if (diffHours < 1) return 'status-online'
  if (diffHours < 24) return 'status-recent'
  return 'status-away'
}

const getStatusLabel = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime()
  const diffHours = diffMs / 3600000
  if (diffHours < 1) return 'Online'
  if (diffHours < 24) return 'Recent'
  return 'Away'
}

// Fetch
const fetchStats = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch<any>('/api/admin/stats')
    stats.value = response.data
    lastUpdated.value = new Date().toISOString()

    // Trigger animations
    await nextTick()
    animateValue('totalUsers', response.data.users.total)
    animateValue('activeToday', response.data.users.activeToday)
    animateValue('totalLithos', response.data.lithos.total)
    animateValue('totalDecks', response.data.decks.total)
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Failed to load statistics'
  } finally {
    loading.value = false
  }
}

const refreshStats = async () => {
  refreshing.value = true
  await fetchStats()
  refreshing.value = false
}

const formatDate = (date: string) => new Date(date).toLocaleDateString()

const formatRelative = (date: string) => {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

// Auto-refresh every 60s
let autoRefreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await initAuth()
  await fetchStats()
  autoRefreshInterval = setInterval(refreshStats, 60000)
})

onUnmounted(() => {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval)
})
</script>
