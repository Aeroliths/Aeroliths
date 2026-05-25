<template>
  <footer class="footer">
    <div class="footer-glow" />
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-info">
          <NuxtLink href="/" class="footer-brand" aria-label="Aeroliths home">Aeroliths</NuxtLink>
          <p class="footer-desc">{{ SITE_INFO.description }}</p>
          <div class="footer-counters">
            <div class="footer-counter">
              <span class="footer-counter-value">{{ animatedUsers }}</span>
              <span class="footer-counter-label">Registered players</span>
            </div>
            <div class="footer-counter">
              <span class="footer-counter-value">{{ animatedLithos }}</span>
              <span class="footer-counter-label">Lithos</span>
            </div>
            <div class="footer-counter">
              <span class="footer-counter-value">{{ animatedCollections }}</span>
              <span class="footer-counter-label">Collected</span>
            </div>
            <div class="footer-counter footer-counter--dev">
              <span class="footer-counter-value">{{ animatedGames }}</span>
              <span class="footer-counter-label">Games</span>
              <span class="footer-counter-badge">Soon</span>
            </div>
          </div>
        </div>
        <div class="footer-groups">
          <div class="footer-group">
            <span class="footer-group-label">Community</span>
            <NuxtLink href="/friends">Friends</NuxtLink>
            <NuxtLink href="/leaderboard">Leaderboard</NuxtLink>
            <a :href="SITE_INFO.discord.url" target="_blank" rel="noopener noreferrer">Discord</a>
          </div>
          <div class="footer-group">
            <span class="footer-group-label">About</span>
            <NuxtLink href="/legal">Legal</NuxtLink>
            <NuxtLink href="/rules">Rules</NuxtLink>
            <a :href="`mailto:${SITE_INFO.support.email}`">Contact</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>{{ SITE_INFO.copyright }}</p>
        <p class="footer-disclaimer">Not affiliated with Activision or Toys For Bob.</p>
        <p>Hosted by <a :href="SITE_INFO.hosting.website" target="_blank" rel="noopener noreferrer">{{ SITE_INFO.hosting.provider }}</a></p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { SITE_INFO } from '~/constants/site'

const stats = ref({ users: 0, lithos: 0, collections: 0, games: 0 })
const animatedUsers = ref(0)
const animatedLithos = ref(0)
const animatedCollections = ref(0)
const animatedGames = ref(0)

function animateCounter(target: Ref<number>, end: number, duration = 1500) {
  const start = target.value
  const diff = end - start
  if (diff === 0) return
  const startTime = performance.now()

  function step(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 3)
    target.value = Math.round(start + diff * ease)
    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

onMounted(async () => {
  try {
    const data = await $fetch('/api/stats/public')
    stats.value = data
    animateCounter(animatedUsers, data.users)
    animateCounter(animatedLithos, data.lithos)
    animateCounter(animatedCollections, data.collections)
    animateCounter(animatedGames, data.games)
  } catch {
    // Silently fail - counters stay at 0
  }
})
</script>

<style scoped src="~/assets/css/footer.css"></style>
