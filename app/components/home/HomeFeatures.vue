<template>
  <section class="features">
    <div class="feature" v-for="feature in features" :key="feature.title">
      <div class="feature-icon" :style="{ background: feature.color }">
        <UIcon :name="feature.icon" />
      </div>
      <h3 class="feature-title">{{ feature.title }}</h3>
      <p class="feature-desc">{{ feature.desc }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    icon: 'i-heroicons-bolt-solid',
    title: 'Fast Matches',
    desc: 'Quick games on a 3x3 board. Every move counts.',
    color: 'linear-gradient(135deg, #d4a76a, #b8864e)'
  },
  {
    icon: 'i-heroicons-puzzle-piece-solid',
    title: 'Deep Strategy',
    desc: '4 directional values per stone. Master the mechanics.',
    color: 'linear-gradient(135deg, #5898b8, #4a7fa5)'
  },
  {
    icon: 'i-heroicons-trophy-solid',
    title: 'Ranked Play',
    desc: 'Climb the leaderboard and prove your skills.',
    color: 'linear-gradient(135deg, #7ab8d4, #6ba5c8)'
  }
]
</script>
