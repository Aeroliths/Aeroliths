import { vi } from 'vitest'
import {
  isMediaCategory,
  countMediaUsage,
  registerMediaAsset,
} from '~~/server/utils/media'
import { grantStarterPool, grantStarterPoolSafely } from '~~/server/utils/starter-pool'

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_EXPIRES_IN = '7d'

// Mock Nuxt auto-imported functions
global.defineEventHandler = (handler: any) => handler
global.createError = (error: any) => error
global.readBody = vi.fn()
global.getQuery = vi.fn()
global.getRouterParam = vi.fn()

// Mock auth utilities (auto-imported by Nuxt)
global.getAuthUser = vi.fn()
global.requireRole = vi.fn()

// Mock the upload helpers (auto-imported by Nuxt)
global.upload_image = vi.fn()
global.delete_image = vi.fn()

// Media helpers (auto-imported by Nuxt). The real implementations are exposed
// rather than mocked: they run against the mocked db above, and the route tests
// assert on their actual behaviour.
global.isMediaCategory = isMediaCategory
global.countMediaUsage = countMediaUsage
global.registerMediaAsset = registerMediaAsset

// Starter pool helpers (auto-imported by Nuxt). Real implementations again:
// they run against the mocked db and the tests assert on their behaviour.
global.grantStarterPool = grantStarterPool
global.grantStarterPoolSafely = grantStarterPoolSafely

// Mock database (auto-imported by Nuxt)
global.db = {
  postgres: {
    lithos: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    elements: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    mediaAsset: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    collections: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}

// Prisma accepts both an array of promises and an interactive callback. The mock
// mirrors that so route code can use either form against the mocked models.
// vi.clearAllMocks() clears calls but keeps this implementation.
global.db.postgres.$transaction.mockImplementation((arg: any) =>
  typeof arg === 'function' ? arg(global.db.postgres) : Promise.all(arg)
)

// Global test utilities can be added here
