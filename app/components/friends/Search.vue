<template>
  <div class="tab-content">
    <h2>{{ $t('friends.search.title') }}</h2>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <div class="search-input-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="$t('friends.search.placeholder')"
      />
    </div>

    <div v-if="filteredResults.length" class="friends-list">
      <div v-for="result in filteredResults" :key="result.id" class="user-item">
        <div class="user-info">
          <div class="user-avatar">
            <img v-if="result.profilePicture" :src="result.profilePicture" :alt="result.username" />
            <span v-else>{{ result.username.charAt(0) }}</span>
          </div>
          <span class="username-text">{{ result.username }}</span>
        </div>
        <div class="item-actions">
          <button
            v-if="!isFriend(result.id) && !hasPendingRequest(result.id)"
            class="add-btn"
            :disabled="sendingTo === result.username"
            @click="sendRequest(result.username)"
          >
            {{ $t('friends.search.addFriend') }}
          </button>
          <span v-else-if="isFriend(result.id)" class="pending-label">{{ $t('friends.search.alreadyFriends') }}</span>
          <span v-else class="pending-label">{{ $t('friends.search.requestPending') }}</span>
          <button class="report-btn" @click="openReport(result)" :title="$t('friends.search.reportTitle')">
            {{ $t('friends.search.report') }}
          </button>
        </div>
      </div>
    </div>
    <div v-else-if="allUsers.length && searchQuery.trim()" class="empty-state">{{ $t('friends.search.noPlayersFound') }}</div>

    <FriendsReportModal
      v-if="reportTarget"
      :target-user-id="reportTarget.id"
      :target-username="reportTarget.username"
      :has-profile-picture="!!reportTarget.profilePicture"
      @close="reportTarget = null"
      @submitted="onReportSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const { t } = useI18n()

const searchQuery = ref('')
const allUsers = ref<any[]>([])
const sendingTo = ref('')
const friends = ref<any[]>([])
const pendingRequests = ref<{ received: any[]; sent: any[] }>({ received: [], sent: [] })
const errorMessage = ref('')
const successMessage = ref('')
const reportTarget = ref<any | null>(null)

const openReport = (target: any) => {
  reportTarget.value = target
}

const onReportSubmitted = () => {
  showMessage('success', t('friends.search.reportSubmitted'))
}

const fuzzyMatch = (username: string, query: string): boolean => {
  const a = username.toLowerCase()
  const b = query.toLowerCase()
  if (a.includes(b)) return true
  // Levenshtein distance for short queries
  if (b.length <= 1) return false
  const maxDistance = b.length <= 3 ? 1 : 2
  const len1 = a.length
  const len2 = b.length
  // Check each substring of username with same length as query
  for (let start = 0; start <= len1 - len2; start++) {
    const sub = a.substring(start, start + len2)
    let dist = 0
    for (let i = 0; i < len2; i++) {
      if (sub[i] !== b[i]) dist++
    }
    if (dist <= maxDistance) return true
  }
  return false
}

const filteredResults = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return allUsers.value
  return allUsers.value.filter((u) => fuzzyMatch(u.username, query))
})

const showMessage = (type: 'error' | 'success', message: string) => {
  errorMessage.value = type === 'error' ? message : ''
  successMessage.value = type === 'success' ? message : ''
  setTimeout(() => { errorMessage.value = ''; successMessage.value = '' }, 4000)
}

const isFriend = (userId: number) => {
  return friends.value.some((f) => String(f.friendId) === String(userId))
}

const hasPendingRequest = (userId: number) => {
  return (
    pendingRequests.value.sent.some((r) => String(r.targetId) === String(userId)) ||
    pendingRequests.value.received.some((r) => String(r.senderId) === String(userId))
  )
}

const fetchData = async () => {
  try {
    const [friendsRes, requestsRes, usersRes] = await Promise.all([
      $fetch<{ data: any[] }>('/api/friends'),
      $fetch<{ data: { received: any[]; sent: any[] } }>('/api/friends/requests'),
      $fetch<{ data: any[] }>('/api/friends/search'),
    ])
    friends.value = friendsRes.data
    pendingRequests.value = requestsRes.data
    allUsers.value = usersRes.data
  } catch (e: any) {
    showMessage('error', t('friends.search.loadFailed'))
  }
}

const sendRequest = async (username: string) => {
  sendingTo.value = username
  try {
    await $fetch('/api/friends/request', {
      method: 'POST', body: { targetUsername: username },
    })
    showMessage('success', `${t('friends.search.requestSentPrefix')}${username}`)
    await fetchData()
  } catch (e: any) {
    showMessage('error', e.data?.message || t('friends.search.sendFailed'))
  } finally {
    sendingTo.value = ''
  }
}

onMounted(() => fetchData())
</script>
