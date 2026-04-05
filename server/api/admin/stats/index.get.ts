// API route to get admin statistics
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(todayStart)
    monthStart.setDate(monthStart.getDate() - 30)

    // Run all queries in parallel
    const [
      totalUsers,
      usersToday,
      usersThisWeek,
      usersThisMonth,
      usersByRole,
      activeToday,
      activeThisWeek,
      totalLithos,
      lithosByRarity,
      lithosByElement,
      totalCollectionEntries,
      totalDecks,
      mostCollectedLithos,
      recentUsers,
      usersWithCollections,
    ] = await Promise.all([
      // Total unique accounts
      db.postgres.user.count(),

      // New users today
      db.postgres.user.count({
        where: { createdAt: { gte: todayStart } },
      }),

      // New users this week
      db.postgres.user.count({
        where: { createdAt: { gte: weekStart } },
      }),

      // New users this month (30 days)
      db.postgres.user.count({
        where: { createdAt: { gte: monthStart } },
      }),

      // Users by role
      db.postgres.role.findMany({
        select: {
          name: true,
          _count: { select: { users: true } },
        },
      }),

      // Active users today
      db.postgres.user.count({
        where: { lastActiveAt: { gte: todayStart } },
      }),

      // Active users this week
      db.postgres.user.count({
        where: { lastActiveAt: { gte: weekStart } },
      }),

      // Total lithos
      db.postgres.lithos.count(),

      // Lithos by rarity
      db.postgres.lithos.groupBy({
        by: ['rarity'],
        _count: { rarity: true },
        orderBy: { _count: { rarity: 'desc' } },
      }),

      // Lithos by element
      db.postgres.lithos.findMany({
        where: { elementId: { not: null } },
        select: {
          element: { select: { name: true } },
        },
      }),

      // Total collection entries
      db.postgres.collections.count(),

      // Total decks
      db.postgres.deck.count(),

      // Most collected lithos (top 10)
      db.postgres.collections.groupBy({
        by: ['lithosId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),

      // 10 most recently active users
      db.postgres.user.findMany({
        select: {
          id: true,
          username: true,
          createdAt: true,
          lastActiveAt: true,
        },
        orderBy: { lastActiveAt: 'desc' },
        take: 10,
      }),

      // Average collection size
      db.postgres.collections.groupBy({
        by: ['userId'],
        _sum: { quantity: true },
      }),
    ])

    // Process element distribution
    const elementCounts: Record<string, number> = {}
    for (const l of lithosByElement) {
      const name = l.element?.name || 'Unknown'
      elementCounts[name] = (elementCounts[name] || 0) + 1
    }

    // Resolve lithos names for most collected
    const lithosIds = mostCollectedLithos.map((l) => l.lithosId)
    const lithosDetails = lithosIds.length > 0
      ? await db.postgres.lithos.findMany({
          where: { id: { in: lithosIds } },
          select: { id: true, name: true, rarity: true, sprite: true },
        })
      : []

    const lithosMap = new Map(lithosDetails.map((l) => [l.id, l]))

    const topLithos = mostCollectedLithos.map((l) => ({
      ...lithosMap.get(l.lithosId),
      totalCollected: l._sum.quantity || 0,
    }))

    // Average collection size
    const totalQuantity = usersWithCollections.reduce(
      (sum, u) => sum + (u._sum.quantity || 0),
      0
    )
    const avgCollectionSize = usersWithCollections.length > 0
      ? Math.round((totalQuantity / usersWithCollections.length) * 10) / 10
      : 0

    return {
      success: true,
      data: {
        users: {
          total: totalUsers,
          newToday: usersToday,
          newThisWeek: usersThisWeek,
          newThisMonth: usersThisMonth,
          activeToday,
          activeThisWeek,
          byRole: usersByRole.map((r) => ({
            role: r.name,
            count: r._count.users,
          })),
        },
        lithos: {
          total: totalLithos,
          byRarity: lithosByRarity.map((r) => ({
            rarity: r.rarity,
            count: r._count.rarity,
          })),
          byElement: Object.entries(elementCounts).map(([name, count]) => ({
            element: name,
            count,
          })),
        },
        collections: {
          totalEntries: totalCollectionEntries,
          usersWithCollection: usersWithCollections.length,
          avgCollectionSize,
          totalLithosOwned: totalQuantity,
          topLithos,
        },
        decks: {
          total: totalDecks,
        },
        recentUsers,
      },
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }
    if (error.statusCode) {
      throw error
    }

    console.error('Error retrieving stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error retrieving statistics',
    })
  }
})
