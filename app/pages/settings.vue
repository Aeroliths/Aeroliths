<template>
  <SettingsComponent />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('settings.meta.title'),
  description: () => t('settings.meta.description'),
  robots: 'noindex, nofollow',
})
</script>
