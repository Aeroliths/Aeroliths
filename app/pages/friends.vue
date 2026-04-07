<template>
  <FriendsComponent />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Friends – Aeroliths',
  description: 'Manage your Aeroliths friends list.',
  robots: 'noindex, nofollow',
})
</script>
