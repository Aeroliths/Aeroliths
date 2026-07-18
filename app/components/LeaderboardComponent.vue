<template>
  <div class="leaderboard-page">
    <div class="leaderboard-container">
      <h1>{{ $t('leaderboard.title') }}</h1>
      <p class="subtitle">{{ $t('leaderboard.subtitle') }}</p>

      <!-- Tab Navigation -->
      <div class="leaderboard-tabs">
        <button :class="{ active: activeTab === 'collection' }" @click="activeTab = 'collection'">
          {{ $t('leaderboard.tabs.collection') }}
        </button>
        <button :class="{ active: activeTab === 'battles' }" @click="activeTab = 'battles'" class="tab-dev">
          {{ $t('leaderboard.tabs.battles') }}
          <span class="tab-dev-badge">{{ $t('leaderboard.tabs.inDev') }}</span>
        </button>
      </div>

      <!-- Battles Tab (In Development) -->
      <div v-if="activeTab === 'battles'" class="leaderboard-dev">
        <div class="dev-icon">&#x2694;&#xFE0F;</div>
        <h2>{{ $t('leaderboard.battleSection.title') }}</h2>
        <span class="dev-badge">{{ $t('leaderboard.battleSection.badge') }}</span>
        <p>{{ $t('leaderboard.battleSection.desc') }}</p>
        <div class="dev-preview">
          <div class="dev-preview-header">
            <span class="col-rank">{{ $t('leaderboard.battleSection.rank') }}</span>
            <span class="col-player">{{ $t('leaderboard.battleSection.player') }}</span>
            <span>{{ $t('leaderboard.battleSection.wins') }}</span>
            <span>{{ $t('leaderboard.battleSection.losses') }}</span>
            <span>{{ $t('leaderboard.battleSection.winRate') }}</span>
            <span>{{ $t('leaderboard.battleSection.streak') }}</span>
          </div>
          <div v-for="i in 5" :key="i" class="dev-preview-row">
            <span class="col-rank">{{ i }}</span>
            <span class="dev-placeholder-bar" :style="{ width: (120 - i * 15) + 'px' }"></span>
            <span class="dev-placeholder-num"></span>
            <span class="dev-placeholder-num"></span>
            <span class="dev-placeholder-num"></span>
            <span class="dev-placeholder-num"></span>
          </div>
        </div>
      </div>

      <div v-if="loading && activeTab === 'collection'" class="loading">{{ $t('leaderboard.loading') }}</div>
      <div v-if="error && activeTab === 'collection'" class="error-message">{{ error }}</div>

      <div v-if="!loading && leaderboard.length > 0 && activeTab === 'collection'" class="leaderboard-content">
        <!-- Podium -->
        <div v-if="leaderboard.length >= 3" class="podium">
          <div class="podium-spot podium-2" @click="openProfile(leaderboard[1].username)">
            <div class="podium-avatar">
              <img v-if="leaderboard[1].profilePicture" :src="leaderboard[1].profilePicture" :alt="leaderboard[1].username" />
              <span v-else class="avatar-placeholder">{{ leaderboard[1].username[0].toUpperCase() }}</span>
            </div>
            <span class="podium-rank">2</span>
            <span class="podium-name">{{ leaderboard[1].username }}</span>
            <span class="podium-score">{{ leaderboard[1].score }}{{ $t('leaderboard.ptsSuffix') }}</span>
            <div v-if="leaderboard[1].badges.length > 0" class="podium-badges">
              <span v-for="badge in leaderboard[1].badges.slice(0, 2)" :key="badge.name" class="badge-mini" :title="badge.description">
                {{ getBadgeIcon(badge.name) }}
              </span>
            </div>
          </div>

          <div class="podium-spot podium-1" @click="openProfile(leaderboard[0].username)">
            <div class="podium-crown">&#x1F451;</div>
            <div class="podium-avatar podium-avatar--gold">
              <img v-if="leaderboard[0].profilePicture" :src="leaderboard[0].profilePicture" :alt="leaderboard[0].username" />
              <span v-else class="avatar-placeholder">{{ leaderboard[0].username[0].toUpperCase() }}</span>
            </div>
            <span class="podium-rank">1</span>
            <span class="podium-name">{{ leaderboard[0].username }}</span>
            <span class="podium-score">{{ leaderboard[0].score }}{{ $t('leaderboard.ptsSuffix') }}</span>
            <div v-if="leaderboard[0].badges.length > 0" class="podium-badges">
              <span v-for="badge in leaderboard[0].badges.slice(0, 3)" :key="badge.name" class="badge-mini" :title="badge.description">
                {{ getBadgeIcon(badge.name) }}
              </span>
            </div>
          </div>

          <div class="podium-spot podium-3" @click="openProfile(leaderboard[2].username)">
            <div class="podium-avatar">
              <img v-if="leaderboard[2].profilePicture" :src="leaderboard[2].profilePicture" :alt="leaderboard[2].username" />
              <span v-else class="avatar-placeholder">{{ leaderboard[2].username[0].toUpperCase() }}</span>
            </div>
            <span class="podium-rank">3</span>
            <span class="podium-name">{{ leaderboard[2].username }}</span>
            <span class="podium-score">{{ leaderboard[2].score }}{{ $t('leaderboard.ptsSuffix') }}</span>
            <div v-if="leaderboard[2].badges.length > 0" class="podium-badges">
              <span v-for="badge in leaderboard[2].badges.slice(0, 2)" :key="badge.name" class="badge-mini" :title="badge.description">
                {{ getBadgeIcon(badge.name) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Stats summary -->
        <div class="leaderboard-stats">
          <div class="leaderboard-stat">
            <span class="stat-num">{{ totalPlayers }}</span>
            <span class="stat-text">{{ $t('leaderboard.stats.players') }}</span>
          </div>
          <div class="leaderboard-stat">
            <span class="stat-num">{{ totalLithos }}</span>
            <span class="stat-text">{{ $t('leaderboard.stats.lithosAvailable') }}</span>
          </div>
          <div class="leaderboard-stat">
            <span class="stat-num">{{ totalElements }}</span>
            <span class="stat-text">{{ $t('leaderboard.stats.elements') }}</span>
          </div>
        </div>

        <!-- Full ranking table -->
        <div class="ranking-table">
          <div class="ranking-header">
            <span class="col-rank">{{ $t('leaderboard.ranking.rank') }}</span>
            <span class="col-player">{{ $t('leaderboard.ranking.player') }}</span>
            <span class="col-unique">{{ $t('leaderboard.ranking.unique') }}</span>
            <span class="col-total">{{ $t('leaderboard.ranking.total') }}</span>
            <span class="col-completion">{{ $t('leaderboard.ranking.completion') }}</span>
            <span class="col-badges">{{ $t('leaderboard.ranking.badges') }}</span>
            <span class="col-score">{{ $t('leaderboard.ranking.score') }}</span>
          </div>

          <div
            v-for="(player, index) in leaderboard"
            :key="player.id"
            class="ranking-row"
            :class="{
              'ranking-row--gold': index === 0,
              'ranking-row--silver': index === 1,
              'ranking-row--bronze': index === 2,
              'ranking-row--self': player.username === currentUsername,
            }"
            @click="openProfile(player.username)"
          >
            <span class="col-rank">
              <span v-if="index === 0" class="rank-medal">&#x1F947;</span>
              <span v-else-if="index === 1" class="rank-medal">&#x1F948;</span>
              <span v-else-if="index === 2" class="rank-medal">&#x1F949;</span>
              <span v-else>{{ index + 1 }}</span>
            </span>
            <span class="col-player">
              <div class="player-info">
                <div class="player-avatar-small">
                  <img v-if="player.profilePicture" :src="player.profilePicture" :alt="player.username" />
                  <span v-else class="avatar-placeholder-small">{{ player.username[0].toUpperCase() }}</span>
                </div>
                <span class="player-name">{{ player.username }}</span>
              </div>
            </span>
            <span class="col-unique">{{ player.uniqueOwned }}</span>
            <span class="col-total">{{ player.totalOwned }}</span>
            <span class="col-completion">
              <div class="completion-bar-wrapper">
                <div class="completion-bar" :style="{ width: player.completionPercent + '%' }"></div>
                <span class="completion-text">{{ player.completionPercent }}%</span>
              </div>
            </span>
            <span class="col-badges">
              <span v-for="badge in player.badges.slice(0, 3)" :key="badge.name" class="badge-mini" :title="badge.description">
                {{ getBadgeIcon(badge.name) }}
              </span>
              <span v-if="player.badges.length > 3" class="badge-more">+{{ player.badges.length - 3 }}</span>
            </span>
            <span class="col-score">{{ player.score }}</span>
          </div>
        </div>
      </div>

      <div v-if="!loading && leaderboard.length === 0 && !error && activeTab === 'collection'" class="no-data">
        <p>{{ $t('leaderboard.noPlayersYet') }}</p>
      </div>
    </div>

    <!-- Profile Modal -->
    <div v-if="showProfile" class="modal-overlay" @click="showProfile = false">
      <div class="profile-modal" @click.stop>
        <button class="profile-close" @click="showProfile = false">&#x2715;</button>

        <div v-if="profileLoading" class="loading">{{ $t('leaderboard.profile.loading') }}</div>
        <div v-if="profileError" class="error-message">{{ profileError }}</div>

        <div v-if="profile && !profileLoading">
          <!-- Profile Header -->
          <div class="profile-header">
            <div class="profile-avatar">
              <img v-if="profile.profilePicture" :src="profile.profilePicture" :alt="profile.username" />
              <span v-else class="avatar-placeholder-large">{{ profile.username[0].toUpperCase() }}</span>
            </div>
            <div class="profile-info">
              <h2>{{ profile.username }}</h2>
              <span class="profile-since">{{ $t('leaderboard.profile.memberSince') }}{{ formatDate(profile.memberSince) }}</span>
              <span class="profile-score">{{ profile.score }}{{ $t('leaderboard.profile.pointsSuffix') }}</span>
            </div>
            <button
              v-if="profile.username !== currentUsername"
              class="profile-report-btn"
              @click="openReport"
              :title="$t('leaderboard.profile.reportTitle')"
            >
              {{ $t('leaderboard.profile.report') }}
            </button>
          </div>

          <!-- Badges -->
          <div v-if="profile.badges.length > 0" class="profile-section">
            <h3>{{ $t('leaderboard.profile.badgesTitle') }}</h3>
            <div class="badges-grid">
              <div v-for="badge in profile.badges" :key="badge.name" class="badge-card">
                <span class="badge-icon">{{ getBadgeIcon(badge.name) }}</span>
                <span class="badge-name">{{ badge.name }}</span>
                <span class="badge-desc">{{ badge.description }}</span>
              </div>
            </div>
          </div>

          <!-- Collection Stats -->
          <div class="profile-section">
            <h3>{{ $t('leaderboard.profile.collectionTitle') }}</h3>
            <div class="profile-stats-row">
              <div class="profile-stat-card">
                <span class="profile-stat-value">{{ profile.totalOwned }}</span>
                <span class="profile-stat-label">{{ $t('leaderboard.profile.totalLithos') }}</span>
              </div>
              <div class="profile-stat-card">
                <span class="profile-stat-value">{{ profile.uniqueOwned }}</span>
                <span class="profile-stat-label">{{ $t('leaderboard.profile.uniqueLithos') }}</span>
              </div>
              <div class="profile-stat-card">
                <span class="profile-stat-value">{{ profile.completionPercent }}%</span>
                <span class="profile-stat-label">{{ $t('leaderboard.profile.completion') }}</span>
              </div>
            </div>
          </div>

          <!-- Element Progress -->
          <div v-if="profile.elementCompletion.length > 0" class="profile-section">
            <h3>{{ $t('leaderboard.profile.elementProgress') }}</h3>
            <div class="element-progress-list">
              <div v-for="el in profile.elementCompletion" :key="el.name" class="element-progress-item">
                <div class="element-progress-header">
                  <span class="element-name">{{ el.name }}</span>
                  <span class="element-count">{{ el.owned }}/{{ el.total }}</span>
                  <span v-if="el.completed" class="element-complete-badge">&#x2713;</span>
                </div>
                <div class="element-bar-bg">
                  <div
                    class="element-bar-fill"
                    :style="{ width: (el.total > 0 ? (el.owned / el.total) * 100 : 0) + '%' }"
                    :class="{ 'element-bar-complete': el.completed }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rarity Progress -->
          <div v-if="profile.rarityCompletion.length > 0" class="profile-section">
            <h3>{{ $t('leaderboard.profile.rarityProgress') }}</h3>
            <div class="element-progress-list">
              <div v-for="r in profile.rarityCompletion" :key="r.rarity" class="element-progress-item">
                <div class="element-progress-header">
                  <span :class="['rarity-tag', 'rarity-' + r.rarity.toLowerCase()]">{{ r.rarity }}</span>
                  <span class="element-count">{{ r.owned }}/{{ r.total }}</span>
                  <span v-if="r.completed" class="element-complete-badge">&#x2713;</span>
                </div>
                <div class="element-bar-bg">
                  <div
                    class="element-bar-fill"
                    :class="'bar-rarity-' + r.rarity.toLowerCase()"
                    :style="{ width: (r.total > 0 ? (r.owned / r.total) * 100 : 0) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FriendsReportModal
      v-if="reportTarget"
      :target-user-id="reportTarget.id"
      :target-username="reportTarget.username"
      :has-profile-picture="!!reportTarget.profilePicture"
      @close="reportTarget = null"
      @submitted="onReportSubmitted"
    />

    <Transition name="fade">
      <div v-if="reportFlash" class="report-flash">{{ reportFlash }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()
const { t } = useI18n()
const currentUsername = computed(() => user.value?.username || '')

const activeTab = ref<'collection' | 'battles'>('collection')
const leaderboard = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const totalLithos = ref(0)
const totalElements = ref(0)
const totalPlayers = computed(() => leaderboard.value.length)

// Profile modal
const showProfile = ref(false)
const profile = ref<any>(null)
const profileLoading = ref(false)
const profileError = ref('')

// Report
const reportTarget = ref<any | null>(null)
const reportFlash = ref('')

const openReport = () => {
  if (!profile.value) return
  reportTarget.value = {
    id: profile.value.id,
    username: profile.value.username,
    profilePicture: profile.value.profilePicture,
  }
}

const onReportSubmitted = () => {
  reportFlash.value = t('leaderboard.reportSubmitted')
  setTimeout(() => (reportFlash.value = ''), 4000)
}

const fetchLeaderboard = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch<any>('/api/leaderboard')
    leaderboard.value = response.data.leaderboard
    totalLithos.value = response.data.totalLithos
    totalElements.value = response.data.totalElements
  } catch (e: any) {
    error.value = e.data?.statusMessage || t('leaderboard.loadFailed')
  } finally {
    loading.value = false
  }
}

const openProfile = async (username: string) => {
  showProfile.value = true
  profileLoading.value = true
  profileError.value = ''
  profile.value = null
  try {
    const response = await $fetch<any>(`/api/leaderboard/${username}`)
    profile.value = response.data
  } catch (e: any) {
    profileError.value = e.data?.statusMessage || t('leaderboard.profileLoadFailed')
  } finally {
    profileLoading.value = false
  }
}

const getBadgeIcon = (name: string): string => {
  const icons: Record<string, string> = {
    'Full Collection': '\u{1F3C6}',
    'Legendary': '\u{2B50}',
    'Epic Collector': '\u{1F48E}',
    'Rare Hunter': '\u{1F50D}',
    'Completionist': '\u{2705}',
    'Hoarder': '\u{1F4E6}',
    'Collector': '\u{1F392}',
    'Explorer': '\u{1F9ED}',
  }
  // Element mastery badges
  if (name.endsWith(' Master')) return '\u{1F525}'
  return icons[name] || '\u{1F3C5}'
}

const formatDate = (date: string) => new Date(date).toLocaleDateString()

onMounted(() => {
  fetchLeaderboard()
})
</script>

<style scoped src="~/assets/css/leaderboard.css"></style>
