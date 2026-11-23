<template>
  <section class="cta">
    <h2 class="cta-title">{{ $t('home.cta.title') }}</h2>
    <p class="cta-desc">{{ $t('home.cta.desc') }}</p>
    <div class="cta-buttons">
      <NuxtLinkLocale to="/register" class="btn btn--primary btn--lg">
        <span>{{ $t('home.cta.getStarted') }}</span>
        <Papicon name="arrow-right" :size="18" />
      </NuxtLinkLocale>
      <a
        :href="SITE_INFO.discord.url"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn--discord btn--lg"
      >
        <svg class="discord-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.036A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.2 14.2 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.42 0-1.332.956-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.086-2.157-2.42 0-1.332.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419z"/>
        </svg>
        <span>{{ $t('home.cta.discord') }}</span>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import Papicon from '~/components/Papicon.vue'
import { SITE_INFO } from '~/constants/site'
</script>
