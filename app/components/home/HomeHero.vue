<template>
  <section class="hero">
    <div class="hero-content">
      <span class="hero-tag">
        <Papicon name="sparkles" :size="14" />
        <span>{{ $t('home.hero.tag') }}</span>
      </span>
      <h1 class="hero-title">
        <span class="hero-gradient-text">Aeroliths</span>
      </h1>
      <p class="hero-tagline">{{ $t('home.hero.tagline') }}</p>
      <p class="hero-desc">
        {{ $t('home.hero.desc') }}
      </p>
      <div class="hero-buttons">
        <NuxtLinkLocale to="/play" class="btn btn--primary">
          <Papicon name="play" :size="17" />
          <span>{{ $t('home.hero.playNow') }}</span>
        </NuxtLinkLocale>
        <NuxtLinkLocale to="/rules" class="btn btn--ghost">
          <Papicon name="bookmark" :size="17" />
          <span>{{ $t('home.hero.rules') }}</span>
        </NuxtLinkLocale>
      </div>
      <div class="hero-wip" role="note">
        <span class="hero-wip__icon" aria-hidden="true">
          <Papicon name="alert-triangle" :size="18" />
        </span>
        <div class="hero-wip__body">
          <span class="hero-wip__title">{{ $t('home.hero.wip.title') }}</span>
          <p class="hero-wip__desc">{{ $t('home.hero.wip.desc') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Papicon from '~/components/Papicon.vue'
</script>
