<template>
  <PlayComponent />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('play.meta.title'),
  description: () => t('play.meta.description'),
  robots: 'noindex, nofollow',
})
</script>
