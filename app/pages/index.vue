<template>
  <div>
    <HeroComponent />

    <section class="home-about">
      <div class="home-about__inner">
        <img
          src="/placeholder-background.jpg"
          alt="Aeroliths gameplay preview showing the tactical board with elemental Lithos"
          class="home-about__image"
          width="1200"
          height="630"
          loading="lazy"
        />

        <div class="home-about__content">
          <h2>{{ $t('home.about.title') }}</h2>
          <p>{{ $t('home.about.p1') }}</p>
          <p>{{ $t('home.about.p2') }}</p>

          <h2>{{ $t('home.about.featuresTitle') }}</h2>
          <ul class="home-about__features">
            <li><strong>{{ $t('home.about.features.free.title') }}</strong> - {{ $t('home.about.features.free.desc') }}</li>
            <li><strong>{{ $t('home.about.features.strategy.title') }}</strong> - {{ $t('home.about.features.strategy.desc') }}</li>
            <li><strong>{{ $t('home.about.features.deckBuilding.title') }}</strong> - {{ $t('home.about.features.deckBuilding.desc') }}</li>
            <li><strong>{{ $t('home.about.features.online.title') }}</strong> - {{ $t('home.about.features.online.desc') }}</li>
            <li><strong>{{ $t('home.about.features.browser.title') }}</strong> - {{ $t('home.about.features.browser.desc') }}</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('home.meta.title'),
  description: () => t('home.meta.description'),
  ogTitle: () => t('home.meta.ogTitle'),
  ogDescription: () => t('home.meta.ogDescription'),
  twitterTitle: () => t('home.meta.ogTitle'),
  twitterDescription: () => t('home.meta.ogDescription'),
})

// Structured data - WebSite + VideoGame
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': 'https://aeroliths.fr/#website',
            url: 'https://aeroliths.fr',
            name: 'Aeroliths',
            description: 'Free online strategy board game inspired by Skylanders Skystones.',
            inLanguage: 'en',
          },
          {
            '@type': 'VideoGame',
            name: 'Aeroliths',
            url: 'https://aeroliths.fr',
            description: 'A free fan-made online strategy board game inspired by Skylanders Skystones, where players build decks of elemental Lithos and battle on a tactical grid.',
            genre: ['Strategy', 'Board Game', 'Card Game'],
            applicationCategory: 'Game',
            operatingSystem: 'Web Browser',
            inLanguage: 'en',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          },
        ],
      }),
    },
  ],
})
</script>

<style scoped>
.home-about {
  padding: var(--spacing-3xl) var(--spacing-xl);
  max-width: 1100px;
  margin: 0 auto;
}

.home-about__inner {
  display: grid;
  gap: var(--spacing-2xl);
  align-items: center;
}

@media (min-width: 768px) {
  .home-about__inner {
    grid-template-columns: 1fr 1fr;
  }
}

.home-about__image {
  width: 100%;
  height: auto;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xl);
}

.home-about__content h2 {
  font-size: var(--font-2xl);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.home-about__content h2:not(:first-child) {
  margin-top: var(--spacing-xl);
}

.home-about__content p {
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--spacing-md) 0;
}

.home-about__features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.home-about__features li {
  color: var(--color-text-secondary);
  padding: var(--spacing-xs) 0;
  line-height: var(--line-height-relaxed);
}

.home-about__features li::before {
  content: "→ ";
  color: var(--color-brand-primary);
  font-weight: var(--font-bold);
}
</style>