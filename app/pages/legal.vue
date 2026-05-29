<template>
  <div class="legal-page">
    <LegalContentComponent />
  </div>
</template>

<script setup lang="ts">
import type LegalContentComponent from '~/components/LegalContentComponent.vue';

definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Legal Notice & Terms of Use - Aeroliths',
  description: 'Legal notice, terms of use, privacy policy and GDPR information for Aeroliths, the free fan-made strategy game inspired by Skystones.',
  ogTitle: 'Legal Notice & Terms of Use - Aeroliths',
  ogDescription: 'Terms of use, privacy policy and GDPR information for the Aeroliths game.',
  robots: 'noindex, follow',
})
</script>
