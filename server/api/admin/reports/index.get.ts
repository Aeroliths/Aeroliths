// Admin: list user reports
export default defineEventHandler(async (event) => {
  try {
    const authUser = getAuthUser(event)
    requireRole(authUser, ['admin'])

    const query = getQuery(event)
    const statusFilter = typeof query.status === 'string' ? query.status : undefined

    const reports = await db.postgres.userReport.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      include: {
        reporter: {
          select: { id: true, username: true, email: true },
        },
        reportedUser: {
          select: { id: true, username: true, email: true, profilePicture: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return {
      success: true,
      data: {
        reports,
        count: reports.length,
        pendingCount: reports.filter((r) => r.status === 'pending').length,
      },
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error listing reports:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load reports' })
  }
})
