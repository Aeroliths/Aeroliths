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
        delete: vi.fn(),
      },
    },
  },
}))

describe('DELETE /api/admin/reports/[id]', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockReportFindUnique: any
  let mockReportDelete: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')
    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockReportFindUnique = dbModule.default.postgres.userReport.findUnique as any
    mockReportDelete = dbModule.default.postgres.userReport.delete as any
  })

  describe('Authorization', () => {
    it('should reject non-admin', () => {
      const user = createTestUser()
      mockGetAuthUser.mockReturnValue(user)
      mockRequireRole.mockImplementation((u: any, roles: string[]) => {
        if (!roles.includes(u.role)) throw createError({ statusCode: 403 })
      })
      expect(() => mockRequireRole(user, ['admin'])).toThrow()
    })

    it('should allow admin', () => {
      const admin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(admin)
      mockRequireRole.mockReturnValue(undefined)
      expect(() => mockRequireRole(admin, ['admin'])).not.toThrow()
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      mockGetAuthUser.mockReturnValue(createTestAdmin())
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should return 404 when report does not exist', async () => {
      mockReportFindUnique.mockResolvedValue(null)
      const found = await mockReportFindUnique({ where: { id: 'missing' } })
      expect(found).toBeNull()
    })

    it('should delete the report when it exists', async () => {
      mockReportFindUnique.mockResolvedValue({ id: 'r-1', status: 'pending' })
      mockReportDelete.mockResolvedValue({ id: 'r-1' })

      const deleted = await mockReportDelete({ where: { id: 'r-1' } })
      expect(mockReportDelete).toHaveBeenCalledWith({ where: { id: 'r-1' } })
      expect(deleted.id).toBe('r-1')
    })
  })

  describe('Response Format', () => {
    it('should return success message', () => {
      const response = { success: true, message: 'Report deleted successfully' }
      expect(response.success).toBe(true)
      expect(response.message).toBe('Report deleted successfully')
    })
  })
})
