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
        <NuxtLinkLocale to="/play" class="btn btn--primary">
          {{ $t('home.hero.playNow') }}
        </NuxtLinkLocale>
        <NuxtLinkLocale to="/rules" class="btn btn--ghost">
          {{ $t('home.hero.rules') }}
        </NuxtLinkLocale>
      </div>
      <div class="hero-wip" role="note">
        <span class="hero-wip__title">{{ $t('home.hero.wip.title') }}</span>
        <p class="hero-wip__desc">{{ $t('home.hero.wip.desc') }}</p>
      </div>
    </div>
  </section>
</template>
