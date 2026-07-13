<template>
  <section class="hero">
    <div class="hero-content">
      <span class="hero-tag">{{ $t('home.hero.tag') }}</span>
      <h1 class="hero-title">
        <span class="hero-gradient-text">Aeroliths</span>
      </h1>
      <p class="hero-tagline">{{ $t('home.hero.tagline') }}</p>
      <p class="hero-desc">
        {{ $t('home.hero.desc') }}
      </p>
      <div class="hero-buttons">
        <NuxtLink to="/play" class="btn btn--primary">
          {{ $t('home.hero.playNow') }}
        </NuxtLink>
        <NuxtLink to="/rules" class="btn btn--ghost">
          {{ $t('home.hero.rules') }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
