<template>
  <article class="news-article" v-if="news">
    <!-- Back nav row, sits above the hero -->
    <div class="news-article__nav">
      <NuxtLink to="/news" class="news-article__back">
        <span aria-hidden="true">←</span> {{ $t('news.backToAll') }}
      </NuxtLink>
    </div>

    <!-- Hero: cover with title overlay, or solid hero when no cover -->
    <header
      class="news-article__hero"
      :class="{ 'news-article__hero--no-cover': !news.coverImage }"
    >
      <img
        v-if="news.coverImage"
        :src="news.coverImage"
        :alt="news.title"
        class="news-article__hero-img"
      />
      <div class="news-article__hero-shade" />

      <div class="news-article__hero-content">
        <span class="news-article__chip">{{ $t('news.chip') }}</span>
        <h1 class="news-article__title">{{ news.title }}</h1>
        <div class="news-article__meta">
          <time :datetime="news.publishedAt || ''">{{ formatDate(news.publishedAt) }}</time>
        </div>
      </div>
    </header>

    <div class="news-article__body">
      <p v-if="news.excerpt" class="news-article__excerpt">{{ news.excerpt }}</p>
      <div class="news-article__content" v-html="news.content" />
    </div>
  </article>
</template>

<script setup lang="ts">
type NewsItem = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  publishedAt: string | null
}

const { t, locale } = useI18n()
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data, error } = await useFetch<{ success: boolean; data: NewsItem }>(
  () => `/api/news/${slug.value}`,
  { query: { locale } }
)

if (error.value || !data.value?.data) {
  throw createError({ statusCode: 404, statusMessage: t('news.notFound'), fatal: true })
}

const news = computed(() => data.value!.data)

const SITE_URL = 'https://aeroliths.fr'
// og:image needs an absolute URL; coverImage is stored as a relative path.
// Fall back to undefined so the global site og:image applies when there's no cover.
const shareImage = computed(() =>
  news.value.coverImage ? `${SITE_URL}${news.value.coverImage}` : undefined
)

useSeoMeta({
  title: () => `${news.value.title} - Aeroliths News`,
  description: () => news.value.excerpt || t('news.meta.articleFallbackDesc'),
  ogTitle: () => news.value.title,
  ogDescription: () => news.value.excerpt || t('news.meta.articleFallbackDesc'),
  ogType: 'article',
  ogUrl: () => `${SITE_URL}/news/${news.value.slug}`,
  ogImage: () => shareImage.value,
  twitterTitle: () => news.value.title,
  twitterDescription: () => news.value.excerpt || t('news.meta.articleFallbackDesc'),
  twitterImage: () => shareImage.value,
})

const formatDate = (iso: string | null) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}
</script>

<style scoped>
.news-article {
  max-width: 980px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-4xl);
}

/* =========================================
   BACK NAV
   ========================================= */
.news-article__nav {
  margin-bottom: var(--spacing-lg);
}

.news-article__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-brand-light);
  background: rgba(122, 184, 212, 0.08);
  color: var(--color-brand-primary);
  text-decoration: none;
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  transition: var(--transition-all);
}

.news-article__back:hover {
  background: rgba(122, 184, 212, 0.18);
  border-color: var(--color-border-brand);
  transform: translateX(-2px);
}

/* =========================================
   HERO
   ========================================= */
.news-article__hero {
  position: relative;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  border: 1px solid var(--color-border-brand-light);
  min-height: 320px;
  display: flex;
  align-items: flex-end;
  background: var(--color-bg-dark);
}

.news-article__hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.news-article__hero-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(19, 21, 28, 0.15) 0%, rgba(19, 21, 28, 0.45) 55%, rgba(19, 21, 28, 0.92) 100%),
    radial-gradient(circle at 30% 0%, rgba(122, 184, 212, 0.12), transparent 60%);
  z-index: 1;
  pointer-events: none;
}

.news-article__hero--no-cover {
  min-height: 240px;
  background:
    linear-gradient(135deg, rgba(122, 184, 212, 0.10), rgba(88, 152, 184, 0.04)),
    var(--color-bg-primary);
}

.news-article__hero--no-cover .news-article__hero-shade {
  background: none;
}

.news-article__hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: var(--spacing-2xl) var(--spacing-2xl) var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.news-article__chip {
  align-self: flex-start;
  padding: 4px 14px;
  border-radius: var(--radius-full);
  background: rgba(122, 184, 212, 0.15);
  border: 1px solid var(--color-border-brand-light);
  color: var(--color-brand-primary);
  font-size: var(--font-xs);
  font-weight: var(--font-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.news-article__title {
  margin: 0;
  font-size: clamp(2rem, 5.5vw, 3.25rem);
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.6);
}

.news-article__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
  color: var(--color-text-highlight);
  font-size: var(--font-sm);
  letter-spacing: 0.04em;
}

.news-article__meta time {
  text-transform: uppercase;
  font-weight: var(--font-semibold);
  color: var(--color-brand-primary-light);
}

/* =========================================
   BODY
   ========================================= */
.news-article__body {
  padding: var(--spacing-2xl) var(--spacing-md) 0;
  max-width: 760px;
  margin: 0 auto;
}

.news-article__excerpt {
  margin: 0 0 var(--spacing-2xl);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-xl);
  color: var(--color-text-highlight);
  font-style: italic;
  border-left: 3px solid var(--color-brand-primary);
  background: var(--bg-glass-lighter);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  line-height: var(--line-height-relaxed);
}

.news-article__content {
  line-height: var(--line-height-relaxed);
  font-size: var(--font-lg);
  color: var(--color-text-highlight);
}

.news-article__content :deep(h2) {
  font-size: var(--font-4xl);
  font-weight: var(--font-semibold);
  color: var(--color-brand-primary);
  margin: var(--spacing-2xl) 0 var(--spacing-sm);
  letter-spacing: -0.01em;
}

.news-article__content :deep(h3) {
  font-size: var(--font-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: var(--spacing-xl) 0 var(--spacing-sm);
}

.news-article__content :deep(p) {
  margin: 0 0 var(--spacing-md);
}

.news-article__content :deep(strong) {
  color: var(--color-text-primary);
  font-weight: var(--font-semibold);
}

.news-article__content :deep(ul),
.news-article__content :deep(ol) {
  margin: 0 0 var(--spacing-md);
  padding-left: var(--spacing-lg);
}

.news-article__content :deep(li) {
  margin-bottom: var(--spacing-xs);
}

.news-article__content :deep(blockquote) {
  border-left: 3px solid var(--color-border-brand);
  padding: var(--spacing-xs) var(--spacing-lg);
  margin: var(--spacing-md) 0;
  color: var(--color-text-muted);
  background: var(--bg-glass-lighter);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.news-article__content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  margin: var(--spacing-lg) 0;
  display: block;
  box-shadow: var(--shadow-md);
}

.news-article__content :deep(a) {
  color: var(--color-brand-primary);
  text-decoration: none;
  border-bottom: 1px solid var(--color-border-brand);
  transition: var(--transition-all);
}

.news-article__content :deep(a:hover) {
  color: var(--color-brand-primary-light);
  border-bottom-color: var(--color-brand-primary-light);
}

.news-article__content :deep(pre) {
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border-light);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  font-size: var(--font-sm);
  margin: var(--spacing-md) 0;
}

.news-article__content :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.92em;
  background: var(--bg-glass-light);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  color: var(--color-brand-primary-light);
}

.news-article__content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: var(--color-text-primary);
}

/* =========================================
   RESPONSIVE
   ========================================= */
@media (max-width: 768px) {
  .news-article {
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-2xl);
  }

  .news-article__hero {
    min-height: 240px;
    border-radius: var(--radius-xl);
  }

  .news-article__hero-content {
    padding: var(--spacing-lg);
  }

  .news-article__body {
    padding: var(--spacing-xl) 0 0;
  }
}
</style>
