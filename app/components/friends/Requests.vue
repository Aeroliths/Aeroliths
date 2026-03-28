<template>
  <div class="tab-content">
    <h2>
      Requests received
      <span v-if="receivedRequests.length" class="badge">{{ receivedRequests.length }}</span>
    </h2>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <div v-if="receivedRequests.length" class="friends-list">
      <div v-for="req in receivedRequests" :key="req.requestId" class="request-item">
        <div class="user-info">
          <div class="user-avatar">
            <span>{{ req.senderUsername.charAt(0) }}</span>
          </div>
          <span class="username-text">{{ req.senderUsername }}</span>
        </div>
        <div class="item-actions">
          <button class="accept-btn" @click="acceptRequest(req)">Accept</button>
          <button class="reject-btn" @click="rejectRequest(req)">Reject</button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">No pending requests received.</div>

    <h2>Requests sent</h2>
    <div v-if="sentRequests.length" class="friends-list">
      <div v-for="req in sentRequests" :key="req.requestId" class="request-item">
        <div class="user-info">
          <div class="user-avatar">
            <span>{{ req.targetUsername.charAt(0) }}</span>
          </div>
          <span class="username-text">{{ req.targetUsername }}</span>
        </div>
        <div class="item-actions">
          <button class="cancel-btn" @click="cancelRequest(req)">Cancel</button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">No sent requests.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useFriendRequests } from '~/composables/useFriendRequests'

const { token } = useAuth()
const { fetchPendingCount } = useFriendRequests()

const receivedRequests = ref<any[]>([])
const sentRequests = ref<any[]>([])
const errorMessage = ref('')
const successMessage = ref('')

const headers = () => ({ Authorization: `Bearer ${token.value}` })

const showMessage = (type: 'error' | 'success', message: string) => {
  errorMessage.value = type === 'error' ? message : ''
  successMessage.value = type === 'success' ? message : ''
  setTimeout(() => { errorMessage.value = ''; successMessage.value = '' }, 4000)
}

const fetchRequests = async () => {
  try {
    const res = await $fetch<{ data: { received: any[]; sent: any[] } }>('/api/friends/requests', {
      headers: headers(),
    })
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
      method: 'POST', headers: headers(), body: { requestId: req.requestId },
    })
    showMessage('success', `Friend request from ${req.senderUsername} accepted!`)
    await fetchRequests()
  } catch (e: any) {
    showMessage('error', e.data?.message || 'Failed to accept request')
  }
}

const rejectRequest = async (req: any) => {
  try {
    await $fetch('/api/friends/reject', {
      method: 'POST', headers: headers(), body: { requestId: req.requestId },
    })
    showMessage('success', 'Friend request rejected')
    await fetchRequests()
  } catch (e: any) {
    showMessage('error', e.data?.message || 'Failed to reject request')
  }
}

const cancelRequest = async (req: any) => {
  try {
    await $fetch(`/api/friends/${req.requestId}`, { method: 'DELETE', headers: headers() })
    showMessage('success', 'Request cancelled')
    await fetchRequests()
  } catch (e: any) {
    showMessage('error', e.data?.message || 'Failed to cancel request')
  }
}

onMounted(() => fetchRequests())
</script>
