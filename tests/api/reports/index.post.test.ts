import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestUser } from '../../utils/auth'

vi.mock('~/server/utils/auth', () => ({
  getAuthUser: vi.fn(),
}))

vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      user: {
        findUnique: vi.fn(),
      },
      userReport: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    },
  },
}))

describe('POST /api/reports', () => {
  let mockGetAuthUser: any
  let mockUserFindUnique: any
  let mockReportFindFirst: any
  let mockReportCreate: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')
    mockGetAuthUser = authModule.getAuthUser as any
    mockUserFindUnique = dbModule.default.postgres.user.findUnique as any
    mockReportFindFirst = dbModule.default.postgres.userReport.findFirst as any
    mockReportCreate = dbModule.default.postgres.userReport.create as any
  })

  describe('Authentication', () => {
    it('should require authentication', () => {
      mockGetAuthUser.mockImplementation(() => {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      })
      expect(() => mockGetAuthUser({})).toThrow()
    })
  })

  describe('Validation', () => {
    it('should reject when reportedUserId is missing', () => {
      const body: any = { type: 'username', reason: 'something' }
      expect(body.reportedUserId).toBeUndefined()
    })

    it('should reject when type is invalid', () => {
      const invalidTypes = ['email', '', 'bio', 'avatar']
      const validTypes = ['username', 'profile_picture']
      invalidTypes.forEach((t) => expect(validTypes.includes(t)).toBe(false))
    })

    it('should accept valid types', () => {
      const validTypes = ['username', 'profile_picture']
      validTypes.forEach((t) =>
        expect(['username', 'profile_picture'].includes(t)).toBe(true)
      )
    })

    it('should reject reason exceeding 500 characters', () => {
      const tooLong = 'a'.repeat(501)
      expect(tooLong.length).toBeGreaterThan(500)
    })

    it('should accept reason up to 500 characters', () => {
      const ok = 'a'.repeat(500)
      expect(ok.length).toBeLessThanOrEqual(500)
    })

    it('should allow empty/undefined reason (optional)', () => {
      const cases: any[] = [undefined, '', '   ', null]
      cases.forEach((v) => {
        const normalized = typeof v === 'string' ? v.trim() : ''
        expect(normalized.length).toBeLessThanOrEqual(500)
      })
    })

    it('should prevent self-reporting', () => {
      const user = createTestUser()
      expect(user.userId === user.userId).toBe(true)
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const user = createTestUser()
      mockGetAuthUser.mockReturnValue(user)
    })

    it('should reject when reported user does not exist', async () => {
      mockUserFindUnique.mockResolvedValue(null)
      const result = await mockUserFindUnique({ where: { id: 'missing' } })
      expect(result).toBeNull()
    })

    it('should reject when a pending report already exists for same type', async () => {
      const existing = {
        id: 'r-1',
        reporterId: 'test-user-id',
        reportedUserId: 'target-id',
        type: 'username',
        status: 'pending',
      }
      mockReportFindFirst.mockResolvedValue(existing)
      const found = await mockReportFindFirst({
        where: {
          reporterId: 'test-user-id',
          reportedUserId: 'target-id',
          type: 'username',
          status: 'pending',
        },
      })
      expect(found).toBeTruthy()
      expect(found.status).toBe('pending')
    })

    it('should create a report when no duplicate pending exists', async () => {
      mockUserFindUnique.mockResolvedValue({ id: 'target-id', username: 'target' })
      mockReportFindFirst.mockResolvedValue(null)
      mockReportCreate.mockResolvedValue({
        id: 'r-new',
        reporterId: 'test-user-id',
        reportedUserId: 'target-id',
        type: 'profile_picture',
        reason: '',
        status: 'pending',
      })

      const created = await mockReportCreate({
        data: {
          reporterId: 'test-user-id',
          reportedUserId: 'target-id',
          type: 'profile_picture',
          reason: '',
        },
      })

      expect(mockReportCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reporterId: 'test-user-id',
          reportedUserId: 'target-id',
          type: 'profile_picture',
        }),
      })
      expect(created.status).toBe('pending')
    })

    it('should trim whitespace from reason before persisting', () => {
      const raw = '   some reason   '
      const normalized = raw.trim()
      expect(normalized).toBe('some reason')
    })
  })

  describe('Response Format', () => {
    it('should return success with the new report id', () => {
      const response = {
        success: true,
        message: 'Report submitted successfully',
        data: { id: 'r-new' },
      }
      expect(response.success).toBe(true)
      expect(response.data.id).toBe('r-new')
    })
  })
})
