<template>
  <section class="features">
    <div class="feature" v-for="feature in features" :key="feature.titleKey">
      <div class="feature-icon" :style="{ background: feature.color }">
        <UIcon :name="feature.icon" />
      </div>
      <h3 class="feature-title">{{ $t(feature.titleKey) }}</h3>
      <p class="feature-desc">{{ $t(feature.descKey) }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    icon: 'i-heroicons-bolt-solid',
    titleKey: 'home.features.fastMatches.title',
    descKey: 'home.features.fastMatches.desc',
    color: 'linear-gradient(135deg, #d4a76a, #b8864e)'
  },
  {
    icon: 'i-heroicons-puzzle-piece-solid',
    titleKey: 'home.features.deepStrategy.title',
    descKey: 'home.features.deepStrategy.desc',
    color: 'linear-gradient(135deg, #5898b8, #4a7fa5)'
  },
  {
    icon: 'i-heroicons-trophy-solid',
    titleKey: 'home.features.rankedPlay.title',
    descKey: 'home.features.rankedPlay.desc',
    color: 'linear-gradient(135deg, #7ab8d4, #6ba5c8)'
  }
]
</script>
