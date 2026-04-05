<template>
  <div class="admin-container">

    <!-- Check if user is admin -->
    <div v-if="!isAdmin" class="unauthorized">
      <h1>Access Denied</h1>
      <p>You do not have permission to access this page.</p>
      <button @click="navigateTo('/')">Go Home</button>
    </div>

    <!-- Admin Panel -->
    <div v-else class="admin-panel">
      <h1>Admin Panel</h1>

      <!-- Tab Navigation -->
      <div class="tabs">
        <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
          User Management
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
        <button :class="{ active: activeTab === 'stats' }" @click="activeTab = 'stats'">
          Statistics
        </button>
      </div>

      <AdminUsers v-if="activeTab === 'users'" />
      <AdminElements v-if="activeTab === 'elements'" />
      <AdminLithos v-if="activeTab === 'lithos'" />
      <AdminCollections v-if="activeTab === 'collections'" />
      <AdminStats v-if="activeTab === 'stats'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user, initAuth } = useAuth()

const isAdmin = computed(() => user.value?.role?.name === 'admin')
const activeTab = ref<'users' | 'elements' | 'lithos' | 'collections' | 'stats'>('users')

onMounted(async () => {
  await initAuth()
})
</script>

<style src="~/assets/css/admin.css"></style>
