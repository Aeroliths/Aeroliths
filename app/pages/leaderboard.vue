<template>
  <LeaderboardComponent />
</template>

<script setup lang="ts">
const { t } = useI18n()

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: t('leaderboard.meta.title'),
  description: t('leaderboard.meta.description'),
  robots: 'noindex, nofollow',
})
</script>
