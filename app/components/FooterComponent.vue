<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-left">
          <p>{{ SITE_INFO.copyright }}</p>
          <p class="footer-hosting">Hosted by <a :href="SITE_INFO.hosting.website" target="_blank" rel="noopener noreferrer">{{ SITE_INFO.hosting.provider }}</a></p>
        </div>
        <div class="footer-links">
          <NuxtLink href="/legal">Legal</NuxtLink>
          <a :href="SITE_INFO.discord.url" target="_blank" rel="noopener noreferrer" class="discord-link">
            <UIcon name="i-simple-icons-discord" class="discord-icon" />
            Discord
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { SITE_INFO } from '~/constants/site'
</script>

<style scoped src="~/assets/css/footer.css"></style>
