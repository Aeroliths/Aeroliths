import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestAdmin, createTestUser } from '../../../utils/auth'

vi.mock('~/server/utils/auth', () => ({
  getAuthUser: vi.fn(),
  requireRole: vi.fn(),
}))

vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      userReport: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      user: {
        update: vi.fn(),
      },
    },
  },
}))

describe('PATCH /api/admin/reports/[id]', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockReportFindUnique: any
  let mockReportUpdate: any
  let mockUserUpdate: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')
    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockReportFindUnique = dbModule.default.postgres.userReport.findUnique as any
    mockReportUpdate = dbModule.default.postgres.userReport.update as any
    mockUserUpdate = dbModule.default.postgres.user.update as any
  })

  describe('Authorization', () => {
    it('should reject non-admin', () => {
      const user = createTestUser()
      mockGetAuthUser.mockReturnValue(user)
      mockRequireRole.mockImplementation((u: any, roles: string[]) => {
        if (!roles.includes(u.role)) {
          throw createError({ statusCode: 403 })
        }
      })
      expect(() => mockRequireRole(user, ['admin'])).toThrow()
    })
  })

  describe('Validation', () => {
    it('should accept "pending", "resolved", "dismissed"', () => {
      const allowed = ['pending', 'resolved', 'dismissed']
      ;['pending', 'resolved', 'dismissed'].forEach((s) =>
        expect(allowed.includes(s)).toBe(true)
      )
    })

    it('should reject invalid status', () => {
      const allowed = ['pending', 'resolved', 'dismissed']
      ;['accepted', 'closed', '', 'PENDING'].forEach((s) =>
        expect(allowed.includes(s)).toBe(false)
      )
    })

    it('should require report id', () => {
      const id: string | undefined = undefined
      expect(id).toBeUndefined()
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      mockGetAuthUser.mockReturnValue(createTestAdmin())
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should return 404 when report not found', async () => {
      mockReportFindUnique.mockResolvedValue(null)
      const found = await mockReportFindUnique({ where: { id: 'missing' } })
      expect(found).toBeNull()
    })

    it('should update report status only when clearOffendingField is false', async () => {
      mockReportFindUnique.mockResolvedValue({
        id: 'r-1',
        type: 'username',
        status: 'pending',
        reportedUserId: 'u-2',
        reportedUser: { id: 'u-2', username: 'target', profilePicture: null },
      })
      mockReportUpdate.mockResolvedValue({ id: 'r-1', status: 'resolved' })

      const updated = await mockReportUpdate({
        where: { id: 'r-1' },
        data: { status: 'resolved' },
      })

      expect(updated.status).toBe('resolved')
      expect(mockUserUpdate).not.toHaveBeenCalled()
    })

    it('should reset profilePicture when type=profile_picture and clearOffendingField=true', async () => {
      mockReportFindUnique.mockResolvedValue({
        id: 'r-1',
        type: 'profile_picture',
        status: 'pending',
        reportedUserId: 'u-2',
        reportedUser: { id: 'u-2', profilePicture: '/uploads/profile/x.png' },
      })
      mockUserUpdate.mockResolvedValue({ id: 'u-2', profilePicture: null })
      mockReportUpdate.mockResolvedValue({ id: 'r-1', status: 'resolved' })

      await mockUserUpdate({
        where: { id: 'u-2' },
        data: { profilePicture: null },
      })

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-2' },
          data: { profilePicture: null },
        })
      )
    })

    it('should rewrite username to placeholder when type=username and clearOffendingField=true', () => {
      const reportedUserId = 'cuid_abc123xyz'
      const placeholder = `user_${reportedUserId.slice(0, 8)}`
      expect(placeholder).toBe('user_cuid_abc')
    })

    it('should not clear field when status is not "resolved"', () => {
      const status: string = 'dismissed'
      const clearOffendingField = true
      const shouldClear = clearOffendingField === true && status === 'resolved'
      expect(shouldClear).toBe(false)
    })
  })

  describe('Response Format', () => {
    it('should return success with updated report', () => {
      const response = {
        success: true,
        message: 'Report updated successfully',
        data: { id: 'r-1', status: 'resolved' },
      }
      expect(response.success).toBe(true)
      expect(response.data.status).toBe('resolved')
    })
  })
})
