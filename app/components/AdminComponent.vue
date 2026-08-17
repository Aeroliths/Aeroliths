<template>
  <div class="admin-container">

    <!-- Check if user is admin -->
    <div v-if="!isAdmin" class="unauthorized">
      <h1>Access Denied</h1>
      <p>You do not have permission to access this page.</p>
      <button @click="navigateTo($localePath('/'))">Go Home</button>
    </div>

    <!-- Admin Panel -->
    <div v-else class="admin-panel">
      <h1>Admin Panel</h1>

      <!-- Tab Navigation -->
      <div class="tabs">
        <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
          User Management
        </button>
        <button :class="{ active: activeTab === 'reports' }" @click="activeTab = 'reports'">
          Reports
          <span v-if="pendingReportsCount > 0" class="tab-badge">{{ pendingReportsCount }}</span>
        </button>
        <button :class="{ active: activeTab === 'elements' }" @click="activeTab = 'elements'">
          Elements Management
        </button>
        <button :class="{ active: activeTab === 'lithos' }" @click="activeTab = 'lithos'">
          Lithos Management
        </button>
        <button :class="{ active: activeTab === 'collections' }" @click="activeTab = 'collections'">
          Collections Management
        </button>
        <button :class="{ active: activeTab === 'starterPool' }" @click="activeTab = 'starterPool'">
          Starter Pool
        </button>
        <button :class="{ active: activeTab === 'progression' }" @click="activeTab = 'progression'">
          Progression
        </button>
        <button :class="{ active: activeTab === 'news' }" @click="activeTab = 'news'">
          News
        </button>
        <button :class="{ active: activeTab === 'stats' }" @click="activeTab = 'stats'">
          Statistics
        </button>
      </div>

      <AdminUsers v-if="activeTab === 'users'" />
      <AdminReports
        v-if="activeTab === 'reports'"
        @pending-count-changed="pendingReportsCount = $event"
      />
      <AdminElements v-if="activeTab === 'elements'" />
      <AdminLithos v-if="activeTab === 'lithos'" />
      <AdminCollections v-if="activeTab === 'collections'" />
      <AdminStarterPool v-if="activeTab === 'starterPool'" />
      <AdminProgression v-if="activeTab === 'progression'" />
      <AdminNews v-if="activeTab === 'news'" />
      <AdminStats v-if="activeTab === 'stats'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user, initAuth } = useAuth()

const isAdmin = computed(() => user.value?.role?.name === 'admin')
const activeTab = ref<'users' | 'reports' | 'elements' | 'lithos' | 'collections' | 'starterPool' | 'progression' | 'news' | 'stats'>('users')
const pendingReportsCount = ref(0)

const fetchPendingReportsCount = async () => {
  if (!isAdmin.value) return
  try {
    const res = await $fetch<any>('/api/admin/reports', { query: { status: 'pending' } })
    pendingReportsCount.value = res.data.count
  } catch {
    pendingReportsCount.value = 0
  }
}

onMounted(async () => {
  await initAuth()
  await fetchPendingReportsCount()
})
</script>

<style src="~/assets/css/admin.css"></style>
