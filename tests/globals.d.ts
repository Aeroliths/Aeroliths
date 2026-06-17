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
  var getRouterParam: Mock
  // eslint-disable-next-line no-var
  var getAuthUser: Mock
  // eslint-disable-next-line no-var
  var requireRole: Mock
  // eslint-disable-next-line no-var
  var db: any
}

export {}
