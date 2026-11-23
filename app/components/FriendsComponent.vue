<template>
  <div class="friends-container">
    <div class="friends-panel">
      <h1>{{ $t('friends.title') }}</h1>

      <!-- Tab Navigation -->
      <div class="tabs">
        <button :class="{ active: activeTab === 'list' }" @click="activeTab = 'list'">
          <Papicon name="user" :size="16" />
          <span>{{ $t('friends.tabs.myFriends') }}</span>
        </button>
        <button :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'" class="tab-with-badge">
          <Papicon name="bell" :size="16" />
          <span>{{ $t('friends.tabs.requests') }}</span>
          <span v-if="pendingCount > 0" class="tab-badge">{{ pendingCount }}</span>
        </button>
        <button :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">
          <Papicon name="search" :size="16" />
          <span>{{ $t('friends.tabs.search') }}</span>
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
import Papicon from '~/components/Papicon.vue'
import { useFriendRequests } from '~/composables/useFriendRequests'

const activeTab = ref<'list' | 'requests' | 'search'>('list')
const { pendingCount, fetchPendingCount } = useFriendRequests()

onMounted(() => fetchPendingCount())
</script>

<style src="~/assets/css/friends.css"></style>
