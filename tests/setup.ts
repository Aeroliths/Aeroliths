import { vi } from 'vitest'
import {
  isMediaCategory,
  countMediaUsage,
  registerMediaAsset,
} from '~~/server/utils/media'
import { grantStarterPool, grantStarterPoolSafely } from '~~/server/utils/starter-pool'
import { generateVerificationToken, hashToken } from '~~/server/utils/email'
import { validatePassword } from '~~/server/utils/password-validation'

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

// Rate limiting is auto-imported by Nuxt. The default lets the handler through;
// tests that care about it override this to throw.
global.rateLimit = vi.fn()

// Session, captcha, cookies and outbound email are auto-imported by Nuxt too.
// The defaults are permissive so a handler runs end to end; tests that assert
// on them override the relevant one.
global.verifyCaptcha = vi.fn()
global.issueAuthSession = vi.fn()
global.validateEmailTrust = vi.fn()
global.deleteCookie = vi.fn()
global.getCookie = vi.fn()
global.setCookie = vi.fn()
global.readOAuthPending = vi.fn()
global.clearOAuthPending = vi.fn()
global.sendVerificationEmail = vi.fn()
global.sendPasswordResetEmail = vi.fn()
global.sendDeletionRequestEmail = vi.fn()

// Real implementations, like the media and starter pool helpers above. Token
// hashing and password strength are exactly what the auth tests need to assert
// on, so mocking them would hollow out the tests that matter most.
global.generateVerificationToken = generateVerificationToken
global.hashToken = hashToken
global.validatePassword = validatePassword

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
    match: {
      create: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    authentication: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    role: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    oAuthAccount: {
      create: vi.fn(),
      findUnique: vi.fn(),
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
