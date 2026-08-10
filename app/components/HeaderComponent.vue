<template>
  <header class="header">
    <div class="header-container">
      <div class="logo">
        <NuxtLinkLocale to="/" :aria-label="$t('header.homeAriaLabel')">
          <span class="logo-text">Aeroliths</span>
        </NuxtLinkLocale>
      </div>

      <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen" :aria-label="$t('header.toggleMenuAriaLabel')">
        <span v-if="!mobileMenuOpen">☰</span>
        <span v-else>✕</span>
      </button>

      <nav class="nav" :class="{ 'nav-open': mobileMenuOpen }">
        <NuxtLinkLocale to="/" @click="mobileMenuOpen = false">{{ $t('nav.home') }}</NuxtLinkLocale>
        <NuxtLinkLocale to="/rules" @click="mobileMenuOpen = false">{{ $t('nav.rules') }}</NuxtLinkLocale>
        <NuxtLinkLocale to="/news" @click="mobileMenuOpen = false">{{ $t('nav.news') }}</NuxtLinkLocale>

        <!-- Protected links - only visible when authenticated -->
        <template v-if="isAuthenticated">
          <NuxtLinkLocale to="/play" @click="mobileMenuOpen = false">{{ $t('nav.play') }}</NuxtLinkLocale>
          <NuxtLinkLocale to="/friends" @click="mobileMenuOpen = false" class="nav-link-with-badge">
            {{ $t('nav.friends') }}
            <span v-if="pendingCount > 0" class="nav-badge">{{ pendingCount }}</span>
          </NuxtLinkLocale>
          <NuxtLinkLocale to="/leaderboard" @click="mobileMenuOpen = false">{{ $t('nav.leaderboard') }}</NuxtLinkLocale>

          <!-- Admin link - only visible for admin users -->
          <NuxtLinkLocale v-if="user?.role?.name === 'admin'" to="/admin" @click="mobileMenuOpen = false" class="admin-link">
            {{ $t('nav.admin') }}
          </NuxtLinkLocale>

          <!-- User menu -->
          <div class="user-menu">
            <NuxtLinkLocale to="/settings" class="username" @click="mobileMenuOpen = false">
              {{ user?.username }}
            </NuxtLinkLocale>
            <button @click="handleLogout" class="logout-btn">{{ $t('nav.logout') }}</button>
          </div>
        </template>

        <!-- Auth links - only visible when not authenticated -->
        <template v-else>
          <NuxtLinkLocale to="/login" @click="mobileMenuOpen = false">{{ $t('nav.login') }}</NuxtLinkLocale>
          <NuxtLinkLocale to="/register" @click="mobileMenuOpen = false">{{ $t('nav.register') }}</NuxtLinkLocale>
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
