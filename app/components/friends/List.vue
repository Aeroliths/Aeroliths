<template>
  <div class="tab-content">
    <h2>My friends ({{ friends.length }})</h2>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <div v-if="friends.length" class="friends-list">
      <div v-for="friend in friends" :key="friend.edgeId" class="friend-item">
        <div class="user-info">
          <div class="user-avatar">
            <span>{{ friend.username.charAt(0) }}</span>
          </div>
          <div>
            <div class="username-text">{{ friend.username }}</div>
            <div class="friend-since">Friends since {{ formatDate(friend.since) }}</div>
          </div>
        </div>
        <div class="item-actions">
          <button class="remove-btn" @click="removeFriend(friend)">Remove</button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">You don't have any friends yet. Search for players in the Search tab!</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const friends = ref<any[]>([])
const errorMessage = ref('')
const successMessage = ref('')

const showMessage = (type: 'error' | 'success', message: string) => {
  errorMessage.value = type === 'error' ? message : ''
  successMessage.value = type === 'success' ? message : ''
  setTimeout(() => { errorMessage.value = ''; successMessage.value = '' }, 4000)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

const fetchFriends = async () => {
  try {
    const res = await $fetch<{ data: any[] }>('/api/friends')
    friends.value = res.data
  } catch (e: any) {
    console.error('Failed to fetch friends:', e)
  }
}

const removeFriend = async (friend: any) => {
  try {
    await $fetch(`/api/friends/${friend.edgeId}`, { method: 'DELETE' })
    showMessage('success', `${friend.username} removed from friends`)
    await fetchFriends()
  } catch (e: any) {
    showMessage('error', e.data?.message || 'Failed to remove friend')
  }
}

onMounted(() => fetchFriends())
</script>
