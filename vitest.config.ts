import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts', './tests/setup-component.ts'],
    // Vitest 4 + happy-dom on Node 24 / Windows intermittently fails to spawn
    // workers, and whole files then fail to collect. The suite still reports
    // green while having silently run a third fewer tests, so this is not a
    // speed setting: it is what makes the result trustworthy.
    // fileParallelism keeps it to one worker. Turning isolation off as well
    // would run the suite in about 15s instead of several minutes, but 33 test
    // files still mock ~~/server/utils/db per file with conflicting shapes, and
    // a shared module registry makes whichever file loads first win. Isolation
    // stays on until those files are gone.
    pool: 'forks',
    fileParallelism: false,
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
    // Same meaning as Nuxt gives them: `~`/`@` are app/, `~~`/`@@` are the
    // project root. Component tests pull source files through this resolver,
    // so the specifiers written in app/ have to work here unchanged.
    alias: {
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      '@@': fileURLToPath(new URL('./', import.meta.url)),
      '~': fileURLToPath(new URL('./app/', import.meta.url)),
      '@': fileURLToPath(new URL('./app/', import.meta.url))
    }
  }
})
