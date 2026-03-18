// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
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
  // Exclude test files from Nuxt
  ignore: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/tests/**',
    '**/vitest.config.ts'
  ]
})
