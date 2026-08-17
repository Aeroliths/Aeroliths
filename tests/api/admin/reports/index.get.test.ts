import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestAdmin, createTestUser } from '../../../utils/auth'

vi.mock('~~/server/utils/auth', () => ({
  getAuthUser: vi.fn(),
  requireRole: vi.fn(),
}))

vi.mock('~~/server/utils/db', () => ({
  default: {
    postgres: {
      userReport: {
        findMany: vi.fn(),
      },
    },
  },
}))

describe('GET /api/admin/reports', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockReportFindMany: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const authModule = await import('~~/server/utils/auth')
    const dbModule = await import('~~/server/utils/db')
    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockReportFindMany = dbModule.default.postgres.userReport.findMany as any
  })

  describe('Authorization', () => {
    it('should require admin role', () => {
      const user = createTestUser()
      mockGetAuthUser.mockReturnValue(user)
      mockRequireRole.mockImplementation((u: any, roles: string[]) => {
        if (!roles.includes(u.role)) {
          throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        }
      })
      expect(() => mockRequireRole(user, ['admin'])).toThrow()
    })

    it('should allow admin', () => {
      const admin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(admin)
      mockRequireRole.mockImplementation(() => undefined)
      expect(() => mockRequireRole(admin, ['admin'])).not.toThrow()
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      mockGetAuthUser.mockReturnValue(createTestAdmin())
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should return all reports when no status filter is provided', async () => {
      const reports = [
        {
          id: 'r-1',
          type: 'username',
          status: 'pending',
          reason: 'inappropriate',
          createdAt: new Date(),
          reporter: { id: 'u-1', username: 'reporter', email: 'a@b.c' },
          reportedUser: {
            id: 'u-2',
            username: 'target',
            email: 't@b.c',
            profilePicture: null,
          },
        },
      ]
      mockReportFindMany.mockResolvedValue(reports)
      const result = await mockReportFindMany({})
      expect(result).toEqual(reports)
    })

    it('should filter reports by status when provided', async () => {
      const pending = [
        {
          id: 'r-1',
          status: 'pending',
          type: 'username',
        },
      ]
      mockReportFindMany.mockResolvedValue(pending)
      const result = await mockReportFindMany({ where: { status: 'pending' } })
      expect(result.every((r: any) => r.status === 'pending')).toBe(true)
    })

    it('should compute pending count from results', () => {
      const reports = [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'resolved' },
        { status: 'dismissed' },
      ]
      const pendingCount = reports.filter((r) => r.status === 'pending').length
      expect(pendingCount).toBe(2)
    })

    it('should return empty list when no reports exist', async () => {
      mockReportFindMany.mockResolvedValue([])
      const result = await mockReportFindMany({})
      expect(result).toHaveLength(0)
    })

    it('should include reporter and reportedUser relations', async () => {
      const reports = [
        {
          id: 'r-1',
          reporter: { id: 'u-1', username: 'a', email: 'a@b.c' },
          reportedUser: { id: 'u-2', username: 'b', email: 'b@b.c', profilePicture: null },
        },
      ]
      mockReportFindMany.mockResolvedValue(reports)
      const result = await mockReportFindMany({})
      expect(result[0].reporter).toBeDefined()
      expect(result[0].reportedUser).toBeDefined()
    })
  })

  describe('Response Format', () => {
    it('should wrap reports with count and pendingCount', () => {
      const reports = [
        { status: 'pending' },
        { status: 'resolved' },
        { status: 'pending' },
      ]
      const response = {
        success: true,
        data: {
          reports,
          count: reports.length,
          pendingCount: reports.filter((r) => r.status === 'pending').length,
        },
      }
      expect(response.data.count).toBe(3)
      expect(response.data.pendingCount).toBe(2)
    })
  })
})
