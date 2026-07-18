<template>
  <div class="news-page">
    <section class="news-hero">
      <span class="news-hero__tag">{{ $t('news.tag') }}</span>
      <h1 class="news-hero__title">
        <span class="news-hero__gradient">{{ $t('news.heroTitle') }}</span>
      </h1>
      <p class="news-hero__desc">{{ $t('news.heroDesc') }}</p>
    </section>

    <section class="news-list-wrapper">
      <div v-if="pending" class="news-state">{{ $t('news.loading') }}</div>
      <div v-else-if="error" class="news-state news-state--error">{{ $t('news.loadFailed') }}</div>
      <div v-else-if="items.length === 0" class="news-state">{{ $t('news.empty') }}</div>

      <div v-else class="news-grid">
        <NuxtLink
          v-for="item in items"
          :key="item.id"
          :to="`/news/${item.slug}`"
          class="news-card"
        >
          <div class="news-card__cover">
            <img :src="item.coverImage || '/placeholder-background.jpg'" :alt="item.title" />
            <div class="news-card__cover-overlay" />
          </div>
          <div class="news-card__body">
            <p class="news-card__date">{{ formatDate(item.publishedAt) }}</p>
            <h2 class="news-card__title">{{ item.title }}</h2>
            <p v-if="item.excerpt" class="news-card__excerpt">{{ item.excerpt }}</p>
            <span class="news-card__cta">{{ $t('news.readMore') }}</span>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
type NewsListItem = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  publishedAt: string | null
}

const { t, locale } = useI18n()

useSeoMeta({
  title: () => t('news.meta.listTitle'),
  description: 'Project updates, changelog and announcements about Aeroliths.',
})

const { data, pending, error } = await useFetch<{ success: boolean; data: NewsListItem[] }>('/api/news', {
  query: { locale },
})
const items = computed(() => data.value?.data || [])

const formatDate = (iso: string | null) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}
</script>

<style scoped>
.news-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
}

/* =========================================
   HERO
   ========================================= */
.news-hero {
  position: relative;
  text-align: center;
  padding: var(--spacing-4xl) 0 var(--spacing-3xl);
}

.news-hero__tag {
  display: inline-block;
  padding: 6px 18px;
  border-radius: var(--radius-full);
  background: rgba(122, 184, 212, 0.1);
  border: 1px solid var(--color-border-brand-light);
  color: var(--color-brand-primary);
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: var(--spacing-lg);
}

.news-hero__title {
  font-size: clamp(2.5rem, 7vw, 4.5rem);
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 0 var(--spacing-md);
}

.news-hero__gradient {
  background: linear-gradient(135deg, var(--color-brand-primary), #5898b8, #d4a76a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.news-hero__desc {
  font-size: var(--font-xl);
  color: var(--color-text-muted);
  line-height: var(--line-height-relaxed);
  max-width: 640px;
  margin: 0 auto;
}

/* =========================================
   STATE MESSAGES
   ========================================= */
.news-state {
  text-align: center;
  padding: var(--spacing-4xl) var(--spacing-xl);
  color: var(--color-text-muted);
  background: var(--bg-glass-lighter);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-2xl);
  font-size: var(--font-lg);
}

.news-state--error {
  color: var(--color-error-light);
  background: var(--color-error-bg);
  border-color: var(--color-error-border);
}

/* =========================================
   GRID + CARDS
   ========================================= */
.news-list-wrapper {
  padding-bottom: var(--spacing-4xl);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.news-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-glass-lighter);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: all 0.25s ease;
}

.news-card:hover {
  background: var(--bg-glass-light);
  border-color: var(--color-border-brand-light);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.news-card__cover {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--color-bg-dark);
}

.news-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}

.news-card__cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 60%, rgba(19, 21, 28, 0.55));
  pointer-events: none;
}

.news-card:hover .news-card__cover img {
  transform: scale(1.05);
}

.news-card__body {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.news-card__date {
  margin: 0;
  font-size: var(--font-xs);
  color: var(--color-brand-primary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: var(--font-semibold);
}

.news-card__title {
  margin: var(--spacing-xxs) 0 var(--spacing-xs);
  font-size: var(--font-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  line-height: 1.3;
}

.news-card__excerpt {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-sm);
  line-height: var(--line-height-relaxed);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-card__cta {
  margin-top: var(--spacing-md);
  font-size: var(--font-sm);
  color: var(--color-brand-primary);
  font-weight: var(--font-semibold);
  letter-spacing: 0.02em;
}

/* =========================================
   RESPONSIVE
   ========================================= */
@media (max-width: 768px) {
  .news-page {
    padding: 0 var(--spacing-md);
  }

  .news-hero {
    padding: var(--spacing-3xl) 0 var(--spacing-xl);
  }
}
</style>
