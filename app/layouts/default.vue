<template>
  <div class="app-layout">
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
  // Pages that set no title of their own fall back to the full site title.
  titleTemplate: (title?: string) =>
    title ? `${title} | Aeroliths` : 'Aeroliths - Strategy Board Game Inspired by Skystones',
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
  background-color: var(--color-bg-base);
  overflow-x: clip;
}

.main-content {
  position: relative;
  flex: 1;
  padding-top: var(--spacing-xl);
  padding-bottom: var(--spacing-3xl);
  z-index: 1;
}
</style>
