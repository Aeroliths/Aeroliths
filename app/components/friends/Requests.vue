<template>
  <div class="tab-content">
    <h2>
      {{ $t('friends.requests.received') }}
      <span v-if="receivedRequests.length" class="badge">{{ receivedRequests.length }}</span>
    </h2>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <div v-if="receivedRequests.length" class="friends-list">
      <div v-for="req in receivedRequests" :key="req.requestId" class="request-item">
        <div class="user-info">
          <div class="user-avatar">
            <img v-if="req.senderProfilePicture" :src="req.senderProfilePicture" :alt="req.senderUsername" />
            <span v-else>{{ req.senderUsername.charAt(0) }}</span>
          </div>
          <span class="username-text">{{ req.senderUsername }}</span>
        </div>
        <div class="item-actions">
          <button class="accept-btn" @click="acceptRequest(req)">{{ $t('friends.requests.accept') }}</button>
          <button class="reject-btn" @click="rejectRequest(req)">{{ $t('friends.requests.reject') }}</button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">{{ $t('friends.requests.noneReceived') }}</div>

    <h2>{{ $t('friends.requests.sent') }}</h2>
    <div v-if="sentRequests.length" class="friends-list">
      <div v-for="req in sentRequests" :key="req.requestId" class="request-item">
        <div class="user-info">
          <div class="user-avatar">
            <img v-if="req.targetProfilePicture" :src="req.targetProfilePicture" :alt="req.targetUsername" />
            <span v-else>{{ req.targetUsername.charAt(0) }}</span>
          </div>
          <span class="username-text">{{ req.targetUsername }}</span>
        </div>
        <div class="item-actions">
          <button class="cancel-btn" @click="cancelRequest(req)">{{ $t('friends.requests.cancel') }}</button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">{{ $t('friends.requests.noneSent') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useFriendRequests } from '~/composables/useFriendRequests'

const { t } = useI18n()
const { fetchPendingCount } = useFriendRequests()

const receivedRequests = ref<any[]>([])
const sentRequests = ref<any[]>([])
const errorMessage = ref('')
const successMessage = ref('')

const showMessage = (type: 'error' | 'success', message: string) => {
  errorMessage.value = type === 'error' ? message : ''
  successMessage.value = type === 'success' ? message : ''
  setTimeout(() => { errorMessage.value = ''; successMessage.value = '' }, 4000)
}

const fetchRequests = async () => {
  try {
    const res = await $fetch<{ data: { received: any[]; sent: any[] } }>('/api/friends/requests')
    receivedRequests.value = res.data.received
    sentRequests.value = res.data.sent
    fetchPendingCount()
  } catch (e: any) {
    console.error('Failed to fetch requests:', e)
  }
}

const acceptRequest = async (req: any) => {
  try {
    await $fetch('/api/friends/accept', {
      method: 'POST', body: { requestId: req.requestId },
    })
    showMessage('success', `${t('friends.requests.friendRequestFromPrefix')}${req.senderUsername}${t('friends.requests.acceptedSuffix')}`)
    await fetchRequests()
  } catch (e: any) {
    showMessage('error', e.data?.message || t('friends.requests.acceptFailed'))
  }
}

const rejectRequest = async (req: any) => {
  try {
    await $fetch('/api/friends/reject', {
      method: 'POST', body: { requestId: req.requestId },
    })
    showMessage('success', t('friends.requests.rejected'))
    await fetchRequests()
  } catch (e: any) {
    showMessage('error', e.data?.message || t('friends.requests.rejectFailed'))
  }
}

const cancelRequest = async (req: any) => {
  try {
    await $fetch(`/api/friends/${req.requestId}`, { method: 'DELETE' })
    showMessage('success', t('friends.requests.cancelled'))
    await fetchRequests()
  } catch (e: any) {
    showMessage('error', e.data?.message || t('friends.requests.cancelFailed'))
  }
}

onMounted(() => fetchRequests())
</script>
