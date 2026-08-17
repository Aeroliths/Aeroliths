// Ambient declarations for the Nuxt/h3 auto-imports and DB helpers that
// tests/setup.ts assigns onto the global scope. These let test files call the
// bare names (e.g. `createError(...)`) and assign `global.X = ...` without
// TypeScript "Cannot find name" errors.
import type { Mock } from 'vitest'

declare global {
  // eslint-disable-next-line no-var
  var createError: (error: any) => any
  // eslint-disable-next-line no-var
  var defineEventHandler: (handler: any) => any
  // eslint-disable-next-line no-var
  var readBody: Mock
  // eslint-disable-next-line no-var
  var getQuery: Mock
  // eslint-disable-next-line no-var
  var getRouterParam: Mock
  // eslint-disable-next-line no-var
  var upload_image: Mock
  // eslint-disable-next-line no-var
  var delete_image: Mock
  // eslint-disable-next-line no-var
  var getAuthUser: Mock
  // eslint-disable-next-line no-var
  var requireRole: Mock
  // eslint-disable-next-line no-var
  var db: any
  // eslint-disable-next-line no-var
  var isMediaCategory: typeof import('../server/utils/media').isMediaCategory
  // eslint-disable-next-line no-var
  var countMediaUsage: typeof import('../server/utils/media').countMediaUsage
  // eslint-disable-next-line no-var
  var registerMediaAsset: typeof import('../server/utils/media').registerMediaAsset
  // eslint-disable-next-line no-var
  var grantStarterPool: typeof import('../server/utils/starter-pool').grantStarterPool
  // eslint-disable-next-line no-var
  var grantStarterPoolSafely: typeof import('../server/utils/starter-pool').grantStarterPoolSafely
  // Assigned by tests/setup-component.ts for the tests that mount components.
  // eslint-disable-next-line no-var
  var useI18n: () => { t: (key: string) => string; locale: { value: string } }
  // eslint-disable-next-line no-var
  var $fetch: Mock
}

export {}
