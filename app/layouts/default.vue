<template>
  <div class="app-layout">
    <!-- Ambient glows - stone & sky theme -->
    <div class="ambient-glow ambient-glow--sky"></div>
    <div class="ambient-glow ambient-glow--stone"></div>
    <div class="ambient-glow ambient-glow--ember"></div>

    <HeaderComponent />
    <main class="main-content">
      <slot />
    </main>
    <FooterComponent />
    <CookieBanner />
  </div>
</template>

<script setup lang="ts">
// Inject a canonical URL for every page based on the current route (no query string)
const route = useRoute()
const canonical = computed(() => `https://aeroliths.fr${route.path}`)
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  meta: [{ property: 'og:url', content: canonical }],
})
</script>

<style scoped>
.app-layout {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #1e2028;
  overflow: hidden;
}

.main-content {
  position: relative;
  flex: 1;
  padding-top: var(--spacing-3xl);
  padding-bottom: var(--spacing-3xl);
  z-index: 1;
}

/* Ambient glows - subtle, thematic */
.ambient-glow {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

/* Cerulean blue - sky / atmosphere */
.ambient-glow--sky {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(122, 184, 212, 0.12) 0%, transparent 70%);
  top: -10%;
  right: -8%;
  animation: drift 16s ease-in-out infinite alternate;
}

/* Warm slate - stone / earth */
.ambient-glow--stone {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(160, 140, 110, 0.08) 0%, transparent 70%);
  bottom: 5%;
  left: -5%;
  animation: drift 20s ease-in-out infinite alternate-reverse;
}

/* Amber ember - elemental warmth */
.ambient-glow--ember {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(200, 160, 80, 0.06) 0%, transparent 70%);
  top: 40%;
  left: 50%;
  transform: translateX(-50%);
  animation: drift 14s ease-in-out infinite alternate;
  animation-delay: -5s;
}

@keyframes drift {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(15px, -20px) scale(1.08); }
}
</style>
