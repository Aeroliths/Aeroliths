<template>
  <AdminComponent />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Admin Panel – Aeroliths',
  description: 'Admin panel for managing users and lithos.',
  robots: 'noindex, nofollow',
})
</script>
