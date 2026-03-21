<template>
  <section class="cta">
    <h2 class="cta-title">Ready to play?</h2>
    <p class="cta-desc">Join the community and start your first game today.</p>
    <div class="cta-buttons">
      <NuxtLink to="/register" class="btn btn--primary btn--lg">
        Get Started
      </NuxtLink>
      <a
        :href="SITE_INFO.discord.url"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn--discord btn--lg"
      >
        <UIcon name="i-simple-icons-discord" />
        Discord
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { SITE_INFO } from '~/constants/site'
</script>
