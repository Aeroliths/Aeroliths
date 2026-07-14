<template>
  <RulesComponent />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('rules.meta.title'),
  description: () => t('rules.meta.description'),
  ogTitle: () => t('rules.meta.title'),
  ogDescription: () => t('rules.meta.description'),
  twitterTitle: () => t('rules.meta.title'),
  twitterDescription: () => t('rules.meta.description'),
})

// FAQPage structured data - eligible for Google rich results
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Aeroliths?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Aeroliths is a free fan-made online strategy board game inspired by Skylanders Skystones. Two players take turns placing elemental Lithos on a tactical grid to capture their opponent\'s pieces.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do you win a game of Aeroliths?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The player who controls the most Lithos on the board at the end of the match wins. Capture your opponent\'s pieces by placing a stronger Lithos adjacent to a weaker one.',
            },
          },
          {
            '@type': 'Question',
            name: 'What are the elements in Aeroliths?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Aeroliths features four elements: Fire, Water, Earth and Air. Each element has strengths and weaknesses against the others, adding a layer of strategy to placement and deck building.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is Aeroliths free to play?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Aeroliths is completely free, with no ads, no paywalls and no microtransactions. You only need a free account to start playing.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do I need to install anything to play Aeroliths?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. Aeroliths runs entirely in your web browser on desktop and mobile. No download or installation is required.',
            },
          },
        ],
      }),
    },
  ],
})
</script>
