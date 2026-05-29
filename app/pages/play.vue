<template>
  <PlayComponent />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Play - Aeroliths',
  description: 'Play Aeroliths online.',
  robots: 'noindex, nofollow',
})
</script>
