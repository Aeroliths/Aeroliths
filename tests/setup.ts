import { vi } from 'vitest'

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
  },
}

// Global test utilities can be added here
