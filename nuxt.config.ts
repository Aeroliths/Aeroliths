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
  },
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/'
  },
  icon: {
    provider: 'iconify',
    serverBundle: false
  },
  vite: {
    server: {
      allowedHosts: ['aeroliths.fr']
    }
  },
  nitro: {
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
          // Content Security Policy — restrict script/style/connect sources
          'Content-Security-Policy': [
            "default-src 'self'",
            // 'unsafe-inline' kept for Nuxt hydration scripts; tighten with nonces later
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self'",
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
