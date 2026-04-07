<template>
  <LeaderboardComponent />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Leaderboard – Aeroliths',
  description: 'View the top players on the Aeroliths ranked leaderboard.',
  robots: 'noindex, nofollow',
})
</script>
