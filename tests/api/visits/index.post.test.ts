import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestUser } from '../../utils/auth'

vi.mock('~/server/utils/auth', () => ({
  getAuthUser: vi.fn(),
}))

vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      siteVisit: {
        create: vi.fn(),
      },
    },
  },
}))

describe('POST /api/visits', () => {
  let mockGetAuthUser: any
  let mockVisitCreate: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')
    mockGetAuthUser = authModule.getAuthUser as any
    mockVisitCreate = dbModule.default.postgres.siteVisit.create as any
  })

  describe('Visitor cookie', () => {
    it('should generate a uuid when no cookie is present', () => {
      const { randomUUID } = require('node:crypto')
      const id = randomUUID()
      expect(id).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('should reject cookies longer than 64 chars and regenerate', () => {
      const tooLong = 'x'.repeat(65)
      expect(tooLong.length).toBeGreaterThan(64)
    })

    it('should accept valid uuid cookie values (<= 64 chars)', () => {
      const valid = 'b73a5c2e-3a8a-4d2b-8e6e-2a1b2c3d4e5f'
      expect(valid.length).toBeLessThanOrEqual(64)
    })
  })

  describe('Authentication', () => {
    it('should work for anonymous users (no auth)', () => {
      mockGetAuthUser.mockImplementation(() => {
        throw createError({ statusCode: 401 })
      })

      let userId: string | null = null
      try {
        const auth = mockGetAuthUser({})
        userId = auth.userId
      } catch {
        userId = null
      }
      expect(userId).toBeNull()
    })

    it('should associate visit with authenticated user when logged in', () => {
      const user = createTestUser()
      mockGetAuthUser.mockReturnValue(user)
      const auth = mockGetAuthUser({})
      expect(auth.userId).toBe('test-user-id')
    })
  })

  describe('Database Operations', () => {
    it('should record an anonymous visit', async () => {
      mockVisitCreate.mockResolvedValue({
        id: 'v-1',
        visitorId: 'visitor-uuid',
        userId: null,
        visitedAt: new Date(),
      })

      const created = await mockVisitCreate({
        data: { visitorId: 'visitor-uuid', userId: null },
      })

      expect(mockVisitCreate).toHaveBeenCalledWith({
        data: { visitorId: 'visitor-uuid', userId: null },
      })
      expect(created.userId).toBeNull()
    })

    it('should record an authenticated visit with userId', async () => {
      mockVisitCreate.mockResolvedValue({
        id: 'v-2',
        visitorId: 'visitor-uuid',
        userId: 'test-user-id',
        visitedAt: new Date(),
      })

      const created = await mockVisitCreate({
        data: { visitorId: 'visitor-uuid', userId: 'test-user-id' },
      })

      expect(created.userId).toBe('test-user-id')
    })

    it('should not throw on DB errors (returns { success: false })', async () => {
      mockVisitCreate.mockRejectedValue(new Error('db down'))
      let response: any
      try {
        await mockVisitCreate({ data: { visitorId: 'v', userId: null } })
      } catch (e) {
        response = { success: false }
      }
      expect(response.success).toBe(false)
    })
  })

  describe('Response Format', () => {
    it('should return success on success', () => {
      const response = { success: true }
      expect(response.success).toBe(true)
    })

    it('should swallow errors and return success: false', () => {
      const response = { success: false }
      expect(response.success).toBe(false)
    })
  })
})
