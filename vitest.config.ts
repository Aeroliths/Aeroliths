import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    // Run every test file in a single child process. Vitest 4 + happy-dom on
    // Node 24 / Windows intermittently crashes worker spawns, which surfaces as
    // whole files failing to collect ("Cannot read properties of undefined
    // (reading 'config')"). A single fork removes the worker-spawn race.
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'app/**/*.{js,ts,vue}',
        'server/**/*.{js,ts}',
        'utils/**/*.{js,ts}'
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
        '**/*.config.{js,ts}',
        '**/dist/**',
        '**/.nuxt/**'
      ]
    }
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url))
    }
  }
})
