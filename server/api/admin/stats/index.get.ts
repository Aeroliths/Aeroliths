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

    // Login chart windows: inclusive of today
    const loginWeekStart = new Date(todayStart)
    loginWeekStart.setDate(loginWeekStart.getDate() - 6)
    const loginMonthStart = new Date(todayStart)
    loginMonthStart.setDate(loginMonthStart.getDate() - 29)

    // Run all queries in parallel
    const [
      totalUsers,
      usersToday,
      usersThisWeek,
      usersThisMonth,
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

    // Login & visit history for charts: fetch last 30 days once, bucket by period
    const [loginRows, visitRows] = await Promise.all([
      db.postgres.loginHistory.findMany({
        where: { loggedAt: { gte: loginMonthStart } },
        select: { loggedAt: true },
      }),
      // siteVisit was added later; degrade gracefully if it's not yet available
      // (e.g., dev server holding an older Prisma client instance)
      (async () => {
        try {
          return await db.postgres.siteVisit.findMany({
            where: { visitedAt: { gte: loginMonthStart } },
            select: { visitedAt: true, visitorId: true },
          })
        } catch (err) {
          console.warn('siteVisit query failed, returning empty list:', err instanceof Error ? err.message : err)
          return [] as { visitedAt: Date; visitorId: string }[]
        }
      })(),
    ])

    // Bucket: today by hour (0-23)
    const loginsByHour = new Array(24).fill(0) as number[]
    // Bucket: week by day (index 0 = 6 days ago ... index 6 = today)
    const loginsByDayWeek = new Array(7).fill(0) as number[]
    // Bucket: month by day (index 0 = 29 days ago ... index 29 = today)
    const loginsByDayMonth = new Array(30).fill(0) as number[]

    const visitsByHour = new Array(24).fill(0) as number[]
    const visitsByDayWeek = new Array(7).fill(0) as number[]
    const visitsByDayMonth = new Array(30).fill(0) as number[]

    const dayMs = 24 * 60 * 60 * 1000
    for (const row of loginRows) {
      const d = row.loggedAt
      const daysFromMonthStart = Math.floor(
        (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - loginMonthStart.getTime()) / dayMs
      )
      if (daysFromMonthStart >= 0 && daysFromMonthStart < 30) {
        loginsByDayMonth[daysFromMonthStart]++
      }
      if (d.getTime() >= loginWeekStart.getTime()) {
        const daysFromWeekStart = Math.floor(
          (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - loginWeekStart.getTime()) / dayMs
        )
        if (daysFromWeekStart >= 0 && daysFromWeekStart < 7) {
          loginsByDayWeek[daysFromWeekStart]++
        }
      }
      if (d.getTime() >= todayStart.getTime()) {
        loginsByHour[d.getHours()]++
      }
    }

    const uniqueVisitorsToday = new Set<string>()
    const uniqueVisitorsWeek = new Set<string>()
    const uniqueVisitorsMonth = new Set<string>()
    for (const row of visitRows) {
      const d = row.visitedAt
      const daysFromMonthStart = Math.floor(
        (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - loginMonthStart.getTime()) / dayMs
      )
      if (daysFromMonthStart >= 0 && daysFromMonthStart < 30) {
        visitsByDayMonth[daysFromMonthStart]++
        uniqueVisitorsMonth.add(row.visitorId)
      }
      if (d.getTime() >= loginWeekStart.getTime()) {
        const daysFromWeekStart = Math.floor(
          (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - loginWeekStart.getTime()) / dayMs
        )
        if (daysFromWeekStart >= 0 && daysFromWeekStart < 7) {
          visitsByDayWeek[daysFromWeekStart]++
          uniqueVisitorsWeek.add(row.visitorId)
        }
      }
      if (d.getTime() >= todayStart.getTime()) {
        visitsByHour[d.getHours()]++
        uniqueVisitorsToday.add(row.visitorId)
      }
    }

    // Build labels (ISO date strings for days, hour labels for today)
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}h`)
    const buildDayLabels = (start: Date, count: number) => {
      const labels: string[] = []
      for (let i = 0; i < count; i++) {
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        labels.push(d.toISOString().slice(0, 10))
      }
      return labels
    }
    const weekDayLabels = buildDayLabels(loginWeekStart, 7)
    const monthDayLabels = buildDayLabels(loginMonthStart, 30)

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
        },
        visits: {
          uniqueToday: uniqueVisitorsToday.size,
          uniqueThisWeek: uniqueVisitorsWeek.size,
          uniqueThisMonth: uniqueVisitorsMonth.size,
          totalToday: visitsByHour.reduce((s, n) => s + n, 0),
          totalThisWeek: visitsByDayWeek.reduce((s, n) => s + n, 0),
          totalThisMonth: visitsByDayMonth.reduce((s, n) => s + n, 0),
          today: { labels: hourLabels, counts: visitsByHour },
          week: { labels: weekDayLabels, counts: visitsByDayWeek },
          month: { labels: monthDayLabels, counts: visitsByDayMonth },
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
        logins: {
          today: { labels: hourLabels, counts: loginsByHour },
          week: { labels: weekDayLabels, counts: loginsByDayWeek },
          month: { labels: monthDayLabels, counts: loginsByDayMonth },
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
