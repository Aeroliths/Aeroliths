<template>
  <section class="features">
    <div class="feature" v-for="feature in features" :key="feature.titleKey">
      <div class="feature-icon" :class="`feature-icon--${feature.tone}`">
        <Papicon :name="feature.icon" :size="24" />
      </div>
      <h3 class="feature-title">{{ $t(feature.titleKey) }}</h3>
      <p class="feature-desc">{{ $t(feature.descKey) }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import Papicon from '~/components/Papicon.vue'
import type { PapiconName } from '~/utils/papicons'

const features: { icon: PapiconName; titleKey: string; descKey: string; tone: string }[] = [
  {
    icon: 'sparkles',
    titleKey: 'home.features.fastMatches.title',
    descKey: 'home.features.fastMatches.desc',
    tone: 'gold',
  },
  {
    icon: 'grid',
    titleKey: 'home.features.deepStrategy.title',
    descKey: 'home.features.deepStrategy.desc',
    tone: 'sky',
  },
  {
    icon: 'crown',
    titleKey: 'home.features.rankedPlay.title',
    descKey: 'home.features.rankedPlay.desc',
    tone: 'azure',
  },
]
</script>
