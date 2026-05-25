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
          <h2>What is Aeroliths?</h2>
          <p>
            Aeroliths is a free fan-made online strategy board game inspired by Skylanders Skystones.
            Two players face off on a tactical grid, taking turns to place elemental Lithos and capture
            their opponent's pieces. Each Lithos has its own attack values on four sides, and the player
            who controls the most stones at the end of the match wins.
          </p>
          <p>
            Build a deck that fits your playstyle, learn the strengths and weaknesses of the four
            elements (Fire, Water, Earth and Air), and climb the ranked leaderboard against players
            from around the world. The game runs entirely in your browser - no download required.
          </p>

          <h2>Key Features</h2>
          <ul class="home-about__features">
            <li><strong>Free to play</strong> - no ads, no paywalls, no microtransactions.</li>
            <li><strong>Strategic depth</strong> - every placement matters and elements counter each other.</li>
            <li><strong>Deck building</strong> - collect Lithos and assemble your perfect deck.</li>
            <li><strong>Online matches</strong> - challenge friends or climb the ranked ladder.</li>
            <li><strong>Browser-based</strong> - play instantly on desktop or mobile, no install needed.</li>
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

useSeoMeta({
  title: 'Aeroliths – Free Online Strategy Board Game Inspired by Skystones',
  description: 'Aeroliths is a free fan-made online strategy board game inspired by Skylanders Skystones. Build your deck, master the four elements, and dominate the leaderboard.',
  ogTitle: 'Aeroliths – Free Online Strategy Board Game',
  ogDescription: 'Build your deck, master the four elements, and dominate the leaderboard in this free fan-made strategy game inspired by Skylanders Skystones.',
  twitterTitle: 'Aeroliths – Free Online Strategy Board Game',
  twitterDescription: 'Build your deck, master the four elements, and dominate the leaderboard in this free fan-made strategy game inspired by Skylanders Skystones.',
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