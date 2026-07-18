<template>
  <header class="header">
    <div class="header-container">
      <div class="logo">
        <NuxtLink href="/" :aria-label="$t('header.homeAriaLabel')">
          <span class="logo-text">Aeroliths</span>
        </NuxtLink>
      </div>

      <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen" :aria-label="$t('header.toggleMenuAriaLabel')">
        <span v-if="!mobileMenuOpen">☰</span>
        <span v-else>✕</span>
      </button>

      <nav class="nav" :class="{ 'nav-open': mobileMenuOpen }">
        <NuxtLink href="/" @click="mobileMenuOpen = false">{{ $t('nav.home') }}</NuxtLink>
        <NuxtLink href="/rules" @click="mobileMenuOpen = false">{{ $t('nav.rules') }}</NuxtLink>
        <NuxtLink href="/news" @click="mobileMenuOpen = false">{{ $t('nav.news') }}</NuxtLink>

        <!-- Protected links - only visible when authenticated -->
        <template v-if="isAuthenticated">
          <NuxtLink href="/play" @click="mobileMenuOpen = false">{{ $t('nav.play') }}</NuxtLink>
          <NuxtLink href="/friends" @click="mobileMenuOpen = false" class="nav-link-with-badge">
            {{ $t('nav.friends') }}
            <span v-if="pendingCount > 0" class="nav-badge">{{ pendingCount }}</span>
          </NuxtLink>
          <NuxtLink href="/leaderboard" @click="mobileMenuOpen = false">{{ $t('nav.leaderboard') }}</NuxtLink>

          <!-- Admin link - only visible for admin users -->
          <NuxtLink v-if="user?.role?.name === 'admin'" href="/admin" @click="mobileMenuOpen = false" class="admin-link">
            {{ $t('nav.admin') }}
          </NuxtLink>

          <!-- User menu -->
          <div class="user-menu">
            <NuxtLink href="/settings" class="username" @click="mobileMenuOpen = false">
              {{ user?.username }}
            </NuxtLink>
            <button @click="handleLogout" class="logout-btn">{{ $t('nav.logout') }}</button>
          </div>
        </template>

        <!-- Auth links - only visible when not authenticated -->
        <template v-else>
          <NuxtLink href="/login" @click="mobileMenuOpen = false">{{ $t('nav.login') }}</NuxtLink>
          <NuxtLink href="/register" @click="mobileMenuOpen = false">{{ $t('nav.register') }}</NuxtLink>
        </template>

        <LanguageSwitcher />
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useFriendRequests } from '~/composables/useFriendRequests'

const mobileMenuOpen = ref(false)
const { isAuthenticated, user, logout } = useAuth()
const { pendingCount, fetchPendingCount } = useFriendRequests()

onMounted(() => {
  if (isAuthenticated.value) {
    fetchPendingCount()
  }
})

const handleLogout = () => {
  mobileMenuOpen.value = false
  logout()
}
</script>

<style scoped src="~/assets/css/header.css"></style>
