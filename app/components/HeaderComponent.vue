<template>
  <header class="header">
    <div class="header-container">
      <div class="logo">
        <NuxtLinkLocale to="/" class="logo-link" :aria-label="$t('header.homeAriaLabel')">
          <span class="logo-text">Aeroliths</span>
        </NuxtLinkLocale>
      </div>

      <button
        class="mobile-menu-btn"
        type="button"
        @click="mobileMenuOpen = !mobileMenuOpen"
        :aria-label="$t('header.toggleMenuAriaLabel')"
        :aria-expanded="mobileMenuOpen"
      >
        <Papicon :name="mobileMenuOpen ? 'cross' : 'menu'" :size="22" />
      </button>

      <nav class="nav" :class="{ 'nav-open': mobileMenuOpen }">
        <div class="nav-links">
          <NuxtLinkLocale to="/" class="nav-link" @click="mobileMenuOpen = false">{{ $t('nav.home') }}</NuxtLinkLocale>
          <NuxtLinkLocale to="/rules" class="nav-link" @click="mobileMenuOpen = false">{{ $t('nav.rules') }}</NuxtLinkLocale>
          <NuxtLinkLocale to="/news" class="nav-link" @click="mobileMenuOpen = false">{{ $t('nav.news') }}</NuxtLinkLocale>

          <!-- Protected links - only visible when authenticated -->
          <template v-if="isAuthenticated">
            <NuxtLinkLocale to="/play" class="nav-link nav-link--play" @click="mobileMenuOpen = false">
              <Papicon name="play" :size="14" />
              {{ $t('nav.play') }}
            </NuxtLinkLocale>
            <NuxtLinkLocale to="/friends" class="nav-link nav-link-with-badge" @click="mobileMenuOpen = false">
              {{ $t('nav.friends') }}
              <span v-if="pendingCount > 0" class="nav-badge">{{ pendingCount }}</span>
            </NuxtLinkLocale>
            <NuxtLinkLocale to="/leaderboard" class="nav-link" @click="mobileMenuOpen = false">{{ $t('nav.leaderboard') }}</NuxtLinkLocale>
          </template>
        </div>

        <div class="nav-actions">
          <template v-if="isAuthenticated">
            <NuxtLinkLocale
              v-if="user?.role?.name === 'admin'"
              to="/admin"
              @click="mobileMenuOpen = false"
              class="admin-link"
            >
              <Papicon name="gears" :size="15" />
              <span>{{ $t('nav.admin') }}</span>
            </NuxtLinkLocale>

            <div class="user-menu">
              <NuxtLinkLocale to="/settings" class="username" @click="mobileMenuOpen = false">
                <Papicon name="user" :size="15" />
                <span>{{ user?.username }}</span>
              </NuxtLinkLocale>
              <button @click="handleLogout" class="logout-btn" type="button">
                <Papicon name="logout" :size="15" />
                <span>{{ $t('nav.logout') }}</span>
              </button>
            </div>
          </template>

          <template v-else>
            <NuxtLinkLocale to="/login" class="nav-auth-link" @click="mobileMenuOpen = false">
              <Papicon name="login" :size="15" />
              <span>{{ $t('nav.login') }}</span>
            </NuxtLinkLocale>
            <NuxtLinkLocale to="/register" class="nav-register-btn" @click="mobileMenuOpen = false">
              {{ $t('nav.register') }}
            </NuxtLinkLocale>
          </template>

          <LanguageSwitcher />
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Papicon from '~/components/Papicon.vue'
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
