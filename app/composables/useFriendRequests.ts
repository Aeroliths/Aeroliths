import { useState } from '#app'
import { useAuth } from '~/composables/useAuth'

export const useFriendRequests = () => {
  const pendingCount = useState<number>('friendRequestsCount', () => 0)
  const { token, isAuthenticated } = useAuth()

  const fetchPendingCount = async () => {
    if (!isAuthenticated.value || !token.value) {
      pendingCount.value = 0
      return
    }
    try {
      const res = await $fetch<{ data: { received: any[]; sent: any[] } }>('/api/friends/requests', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      pendingCount.value = res.data.received.length
    } catch {
      pendingCount.value = 0
    }
  }

  return { pendingCount, fetchPendingCount }
}
