<template>
  <div class="play-page">
    <div class="play-container">
      <div class="play-header">
        <h1>Play Aeroliths</h1>
        <p>Welcome, <strong>{{ user?.username }}</strong>! Build your deck below.</p>
      </div>
      <DeckBuilder />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()
</script>

<style scoped src="~/assets/css/play.css"></style>
