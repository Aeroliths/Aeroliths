<template>
  <div class="tab-content">
    <h2>Search players</h2>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <div class="search-input-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by username..."
        @keyup.enter="searchUsers"
      />
      <button class="search-btn" :disabled="searchQuery.length < 2" @click="searchUsers">
        Search
      </button>
    </div>

    <div v-if="searchResults.length" class="friends-list">
      <div v-for="result in searchResults" :key="result.id" class="user-item">
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
            Add friend
          </button>
          <span v-else-if="isFriend(result.id)" class="pending-label">Already friends</span>
          <span v-else class="pending-label">Request pending</span>
        </div>
      </div>
    </div>
    <div v-else-if="hasSearched" class="empty-state">No players found.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const searchQuery = ref('')
const searchResults = ref<any[]>([])
const hasSearched = ref(false)
const sendingTo = ref('')
const friends = ref<any[]>([])
const pendingRequests = ref<{ received: any[]; sent: any[] }>({ received: [], sent: [] })
const errorMessage = ref('')
const successMessage = ref('')

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

const fetchContext = async () => {
  try {
    const [friendsRes, requestsRes] = await Promise.all([
      $fetch<{ data: any[] }>('/api/friends'),
      $fetch<{ data: { received: any[]; sent: any[] } }>('/api/friends/requests'),
    ])
    friends.value = friendsRes.data
    pendingRequests.value = requestsRes.data
  } catch (e: any) {
    console.error('Failed to fetch context:', e)
  }
}

const searchUsers = async () => {
  if (searchQuery.value.length < 2) return
  hasSearched.value = true
  try {
    const res = await $fetch<{ data: any[] }>(`/api/friends/search?q=${encodeURIComponent(searchQuery.value)}`)
    searchResults.value = res.data
  } catch (e: any) {
    showMessage('error', e.data?.message || 'Search failed')
  }
}

const sendRequest = async (username: string) => {
  sendingTo.value = username
  try {
    await $fetch('/api/friends/request', {
      method: 'POST', body: { targetUsername: username },
    })
    showMessage('success', `Friend request sent to ${username}`)
    await fetchContext()
  } catch (e: any) {
    showMessage('error', e.data?.message || 'Failed to send request')
  } finally {
    sendingTo.value = ''
  }
}

onMounted(() => fetchContext())
</script>
