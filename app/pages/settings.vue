<template>
  <SettingsComponent />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'Account Settings - Aeroliths',
  description: 'Manage your Aeroliths account settings.',
  robots: 'noindex, nofollow',
})
</script>
