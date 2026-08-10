<template>
  <section class="cta">
    <h2 class="cta-title">{{ $t('home.cta.title') }}</h2>
    <p class="cta-desc">{{ $t('home.cta.desc') }}</p>
    <div class="cta-buttons">
      <NuxtLinkLocale to="/register" class="btn btn--primary btn--lg">
        {{ $t('home.cta.getStarted') }}
      </NuxtLinkLocale>
      <a
        :href="SITE_INFO.discord.url"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn--discord btn--lg"
      >
        <UIcon name="i-simple-icons-discord" />
        {{ $t('home.cta.discord') }}
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { SITE_INFO } from '~/constants/site'
</script>
