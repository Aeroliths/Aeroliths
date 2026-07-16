<template>
  <div class="friends-container">
    <div class="friends-panel">
      <h1>{{ $t('friends.title') }}</h1>

      <!-- Tab Navigation -->
      <div class="tabs">
        <button :class="{ active: activeTab === 'list' }" @click="activeTab = 'list'">
          {{ $t('friends.tabs.myFriends') }}
        </button>
        <button :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'" class="tab-with-badge">
          {{ $t('friends.tabs.requests') }}
          <span v-if="pendingCount > 0" class="tab-badge">{{ pendingCount }}</span>
        </button>
        <button :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">
          {{ $t('friends.tabs.search') }}
        </button>
      </div>

      <FriendsList v-if="activeTab === 'list'" />
      <FriendsRequests v-if="activeTab === 'requests'" />
      <FriendsSearch v-if="activeTab === 'search'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFriendRequests } from '~/composables/useFriendRequests'

const activeTab = ref<'list' | 'requests' | 'search'>('list')
const { pendingCount, fetchPendingCount } = useFriendRequests()

onMounted(() => fetchPendingCount())
</script>

<style src="~/assets/css/friends.css"></style>
