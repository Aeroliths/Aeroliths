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
            <div class="stat-card stat-card--info">
              <span class="stat-value">{{ visitsPeriodData.unique }}</span>
              <span class="stat-label">Unique Visitors {{ userPeriodLabel }}</span>
              <span class="stat-hint">{{ visitsPeriodData.total }} total visit{{ visitsPeriodData.total === 1 ? '' : 's' }}</span>
            </div>
          </div>

          <!-- Metric Chart (Logins / Visits) -->
          <div class="stats-table-small">
            <div class="stats-table-header">
              <h4>{{ activityMetric === 'logins' ? 'Logins' : 'Visits' }} {{ userPeriodLabel }}</h4>
              <div class="stats-sort-toggle">
                <button
                  :class="{ active: activityMetric === 'logins' }"
                  @click="activityMetric = 'logins'"
                >
                  Logins
                </button>
                <button
                  :class="{ active: activityMetric === 'visits' }"
                  @click="activityMetric = 'visits'"
                >
                  Visits
                </button>
              </div>
              <span class="stats-chart-total">Total: {{ activityChartTotal }}</span>
            </div>
            <div v-if="activityChartTotal === 0" class="no-data">
              No {{ activityMetric }} recorded for this period yet.
            </div>
            <div
              v-else
              class="activity-chart"
              :aria-label="`${activityMetric} chart for ${userPeriodLabel}`"
            >
              <svg
                ref="chartSvgRef"
                class="activity-chart-svg"
                :viewBox="`0 0 ${CHART_VB_W} ${CHART_VB_H}`"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="activityAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="chartColor" stop-opacity="0.35" />
                    <stop offset="100%" :stop-color="chartColor" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path :d="chartAreaPath" fill="url(#activityAreaGradient)" />
                <path
                  :d="chartLinePath"
                  fill="none"
                  :stroke="chartColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <g v-for="(pt, i) in chartPoints" :key="i">
                  <circle :cx="pt.x" :cy="pt.y" r="4" :fill="chartColor" stroke="var(--color-bg-primary)" stroke-width="2" />
                  <text v-if="pt.count > 0" :x="pt.x" :y="pt.y - 12" text-anchor="middle" class="activity-chart-point-label">{{ pt.count }}</text>
                </g>
              </svg>
              <div class="activity-chart-labels">
                <span
                  v-for="(count, i) in activityChartData.counts"
                  :key="activityChartData.labels[i]"
                  class="activity-chart-label"
                  :title="`${activityChartData.labels[i]}: ${count} ${activityMetric === 'logins' ? 'login' : 'visit'}${count === 1 ? '' : 's'}`"
                >{{ formatChartLabel(activityChartData.labels[i] ?? '', i) }}</span>
              </div>
            </div>
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

          <div class="stats-table-small stats-activity-table">
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
                  <td class="status-cell">
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
  { label: 'This Year', value: 'year' },
]
const userPeriod = ref('today')

const userPeriodLabel = computed(() => {
  switch (userPeriod.value) {
    case 'today': return 'Today'
    case 'week': return 'This Week'
    case 'month': return 'This Month'
    case 'year': return 'This Year'
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
    case 'year':
      return { new: stats.value.users.newThisYear, active: stats.value.users.newThisYear }
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

// Activity metric: logins vs visits
const activityMetric = ref<'logins' | 'visits'>('logins')

const activityChartData = computed<{ labels: string[]; counts: number[] }>(() => {
  const empty = { labels: [], counts: [] }
  if (!stats.value) return empty
  const source = activityMetric.value === 'logins' ? stats.value.logins : stats.value.visits
  return source?.[userPeriod.value] || empty
})

const activityChartTotal = computed(() =>
  activityChartData.value.counts.reduce((sum, n) => sum + n, 0)
)

const activityChartMax = computed(() =>
  Math.max(1, ...activityChartData.value.counts)
)

// Activity chart geometry: a smoothed line + gradient area. The viewBox
// width is measured from the live SVG element so its coordinate space has
// the same aspect ratio as the rendered box — otherwise `preserveAspectRatio
//="none"` stretches text and circles non-uniformly (they render squashed).
const chartSvgRef = ref<SVGSVGElement | null>(null)
const { width: chartSvgWidth } = useElementSize(chartSvgRef)

const CHART_VB_H = 180
const CHART_PAD_TOP = 14
const CHART_PAD_BOTTOM = 7
const CHART_VB_W = computed(() => Math.round(chartSvgWidth.value) || 600)

const chartColor = computed(() => (activityMetric.value === 'visits' ? '#c8a050' : '#4a7fa5'))

const chartPoints = computed(() => {
  const counts = activityChartData.value.counts
  const n = counts.length
  if (n === 0) return []
  const max = activityChartMax.value
  const vbW = CHART_VB_W.value
  const usableH = CHART_VB_H - CHART_PAD_TOP - CHART_PAD_BOTTOM
  return counts.map((count, i) => {
    const x = ((i + 0.5) / n) * vbW
    const ratio = max === 0 ? 0 : count / max
    const y = CHART_PAD_TOP + (1 - ratio) * usableH
    return { x, y, count }
  })
})

// Smooth cubic-bezier interpolation between points (horizontal tangents),
// giving a curved line without needing a full Catmull-Rom spline.
const chartLinePath = computed(() => {
  const pts = chartPoints.value
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0]!.x} ${pts[0]!.y} L ${pts[0]!.x} ${pts[0]!.y}`
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i]!
    const p1 = pts[i + 1]!
    const midX = (p0.x + p1.x) / 2
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`
  }
  return d
})

const chartAreaPath = computed(() => {
  const pts = chartPoints.value
  if (pts.length === 0) return ''
  const baseline = CHART_VB_H - CHART_PAD_BOTTOM
  return `${chartLinePath.value} L ${pts[pts.length - 1]!.x} ${baseline} L ${pts[0]!.x} ${baseline} Z`
})

const visitsPeriodData = computed(() => {
  if (!stats.value?.visits) return { unique: 0, total: 0 }
  switch (userPeriod.value) {
    case 'today':
      return { unique: stats.value.visits.uniqueToday, total: stats.value.visits.totalToday }
    case 'week':
      return { unique: stats.value.visits.uniqueThisWeek, total: stats.value.visits.totalThisWeek }
    case 'month':
      return { unique: stats.value.visits.uniqueThisMonth, total: stats.value.visits.totalThisMonth }
    case 'year':
      return { unique: stats.value.visits.uniqueThisYear, total: stats.value.visits.totalThisYear }
    default:
      return { unique: 0, total: 0 }
  }
})

const formatChartLabel = (label: string, index: number) => {
  if (userPeriod.value === 'today') {
    // Show every 3rd hour to reduce clutter
    return index % 3 === 0 ? label : ''
  }
  if (userPeriod.value === 'week') {
    // Day short name (Mon, Tue...)
    const d = new Date(label + 'T00:00:00')
    return d.toLocaleDateString(undefined, { weekday: 'short' })
  }
  if (userPeriod.value === 'year') {
    // Month short name (Jan, Feb...); labels are 'YYYY-MM'
    const d = new Date(label + '-01T00:00:00')
    return d.toLocaleDateString(undefined, { month: 'short' })
  }
  // month: show day number, every 3rd for readability
  if (index % 3 !== 0 && index !== activityChartData.value.labels.length - 1) return ''
  const d = new Date(label + 'T00:00:00')
  return String(d.getDate())
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
