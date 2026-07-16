<template>
  <div class="tab-content">
    <h2>{{ $t('friends.list.myFriendsCount', { count: friends.length }) }}</h2>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <div v-if="friends.length" class="friends-list">
      <div v-for="friend in friends" :key="friend.edgeId" class="friend-item">
        <div class="user-info">
          <div class="user-avatar">
            <img v-if="friend.profilePicture" :src="friend.profilePicture" :alt="friend.username" />
            <span v-else>{{ friend.username.charAt(0) }}</span>
          </div>
          <div>
            <div class="username-text">{{ friend.username }}</div>
            <div class="friend-since">{{ $t('friends.list.friendsSince') }}{{ formatDate(friend.since) }}</div>
          </div>
        </div>
        <div class="item-actions">
          <button class="report-btn" @click="openReport(friend)" :title="$t('friends.list.reportTitle')">{{ $t('friends.list.report') }}</button>
          <button class="remove-btn" @click="removeFriend(friend)">{{ $t('friends.list.remove') }}</button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">{{ $t('friends.list.empty') }}</div>

    <FriendsReportModal
      v-if="reportTarget"
      :target-user-id="reportTarget.friendId"
      :target-username="reportTarget.username"
      :has-profile-picture="!!reportTarget.profilePicture"
      @close="reportTarget = null"
      @submitted="onReportSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { t } = useI18n()

const friends = ref<any[]>([])
const errorMessage = ref('')
const successMessage = ref('')
const reportTarget = ref<any | null>(null)

const openReport = (friend: any) => {
  reportTarget.value = friend
}

const onReportSubmitted = () => {
  showMessage('success', t('friends.list.reportSubmitted'))
}

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
    showMessage('success', `${friend.username}${t('friends.list.removedSuffix')}`)
    await fetchFriends()
  } catch (e: any) {
    showMessage('error', e.data?.message || t('friends.list.removeFailed'))
  }
}

onMounted(() => fetchFriends())
</script>
