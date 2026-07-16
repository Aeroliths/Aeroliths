<template>
  <FriendsComponent />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()

useSeoMeta({
  title: t('friends.meta.title'),
  description: t('friends.meta.description'),
  robots: 'noindex, nofollow',
})
</script>
