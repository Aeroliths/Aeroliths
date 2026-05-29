// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@nuxt/ui', '@vueuse/nuxt'],
  css: ['~/assets/css/global.css'],
  runtimeConfig: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    emailFrom: process.env.EMAIL_FROM || 'noreply@aeroliths.fr',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    // hCaptcha test secret (always validates) - replace in production
    hcaptchaSecret: process.env.HCAPTCHA_SECRET || '0x0000000000000000000000000000000000000000',
    public: {
      // hCaptcha test site key (always passes) - replace in production
      hcaptchaSiteKey: process.env.HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001',
    },
  },
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: (title?: string) =>
        title ? `${title} | Aeroliths` : 'Aeroliths - Strategy Board Game Inspired by Skystones',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Aeroliths is a free fan-made online strategy board game inspired by Skylanders Skystones. Build your deck, master the elements, and climb the leaderboard.' },
        // Open Graph defaults
        { property: 'og:site_name', content: 'Aeroliths' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:title', content: 'Aeroliths - Strategy Board Game Inspired by Skystones' },
        { property: 'og:description', content: 'Free online strategy game inspired by Skylanders Skystones. Build your deck, master the elements, dominate the board.' },
        { property: 'og:url', content: 'https://aeroliths.fr' },
        { property: 'og:image', content: 'https://aeroliths.fr/placeholder-background.jpg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Aeroliths - Strategy Board Game Inspired by Skystones' },
        { name: 'twitter:description', content: 'Free online strategy game inspired by Skylanders Skystones. Build your deck, master the elements, dominate the board.' },
        { name: 'twitter:image', content: 'https://aeroliths.fr/placeholder-background.jpg' },
        // Theme
        { name: 'theme-color', content: '#1e2028' },
      ],
    },
  },
  icon: {
    provider: 'iconify',
    serverBundle: false
  },
  vite: {
    server: {
      allowedHosts: ['aeroliths.fr', 'aeroliths.kinator.fr']
    }
  },
  nitro: {
    compressPublicAssets: { gzip: true, brotli: true },
    routeRules: {
      '/**': {
        headers: {
          // Remove framework fingerprinting
          'X-Powered-By': '',
          // Defense-in-depth security headers
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          // Content Security Policy - restrict script/style/connect sources
          'Content-Security-Policy': [
            "default-src 'self'",
            // 'unsafe-inline' kept for Nuxt hydration scripts; tighten with nonces later
            "script-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com",
            "style-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://hcaptcha.com https://*.hcaptcha.com",
            "frame-src https://hcaptcha.com https://*.hcaptcha.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
            'upgrade-insecure-requests',
          ].join('; '),
        },
      },
    },
  },
  // Exclude test files from Nuxt
  ignore: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/tests/**',
    '**/vitest.config.ts'
  ]
})
