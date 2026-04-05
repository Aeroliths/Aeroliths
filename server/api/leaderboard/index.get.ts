// API route to get the leaderboard (authenticated users)
export default defineEventHandler(async (event) => {
  try {
    getAuthUser(event)

    // Get all users with their collection stats
    const users = await db.postgres.user.findMany({
      select: {
        id: true,
        username: true,
        profilePicture: true,
        createdAt: true,
        collections: {
          select: {
            quantity: true,
            lithos: {
              select: {
                id: true,
                rarity: true,
                elementId: true,
              },
            },
          },
        },
      },
      where: {
        emailVerified: true,
      },
    })

    // Get total counts for completion percentages
    const [totalLithos, totalElements] = await Promise.all([
      db.postgres.lithos.count(),
      db.postgres.elements.count(),
    ])

    // Get all lithos grouped by element for element completion
    const lithosByElement = await db.postgres.lithos.findMany({
      select: { id: true, elementId: true },
      where: { elementId: { not: null } },
    })

    const lithosPerElement: Record<string, Set<string>> = {}
    for (const l of lithosByElement) {
      if (!l.elementId) continue
      if (!lithosPerElement[l.elementId]) lithosPerElement[l.elementId] = new Set()
      lithosPerElement[l.elementId].add(l.id)
    }

    // Get all lithos grouped by rarity for rarity completion
    const lithosByRarity = await db.postgres.lithos.groupBy({
      by: ['rarity'],
      _count: { rarity: true },
    })
    const totalPerRarity: Record<string, number> = {}
    for (const r of lithosByRarity) {
      totalPerRarity[r.rarity] = r._count.rarity
    }

    // Get element names
    const elements = await db.postgres.elements.findMany({
      select: { id: true, name: true },
    })
    const elementNameMap = new Map(elements.map((e) => [e.id, e.name]))

    // Calculate stats for each user
    const leaderboard = users.map((user) => {
      const totalOwned = user.collections.reduce((sum, c) => sum + c.quantity, 0)
      const uniqueOwned = user.collections.length

      // Unique lithos per element
      const userElementIds = new Set<string>()
      const userRarityCounts: Record<string, number> = {}

      for (const c of user.collections) {
        if (c.lithos.elementId) userElementIds.add(c.lithos.elementId)
        const rarity = c.lithos.rarity
        userRarityCounts[rarity] = (userRarityCounts[rarity] || 0) + 1
      }

      // Element completion
      const userLithosByElement: Record<string, Set<string>> = {}
      for (const c of user.collections) {
        if (!c.lithos.elementId) continue
        if (!userLithosByElement[c.lithos.elementId]) userLithosByElement[c.lithos.elementId] = new Set()
        userLithosByElement[c.lithos.elementId].add(c.lithos.id)
      }

      const completedElements: string[] = []
      for (const [elementId, lithosSet] of Object.entries(lithosPerElement)) {
        const userSet = userLithosByElement[elementId]
        if (userSet && userSet.size >= lithosSet.size) {
          const name = elementNameMap.get(elementId)
          if (name) completedElements.push(name)
        }
      }

      // Rarity completion
      const completedRarities: string[] = []
      for (const [rarity, total] of Object.entries(totalPerRarity)) {
        if ((userRarityCounts[rarity] || 0) >= total) {
          completedRarities.push(rarity)
        }
      }

      // Badges
      const badges: { name: string; description: string }[] = []

      // Element mastery badges
      for (const element of completedElements) {
        badges.push({
          name: `${element} Master`,
          description: `Collected all ${element} lithos`,
        })
      }

      // Rarity completion badges
      if (completedRarities.includes('legendary')) {
        badges.push({ name: 'Legendary', description: 'Collected all legendary lithos' })
      }
      if (completedRarities.includes('epic')) {
        badges.push({ name: 'Epic Collector', description: 'Collected all epic lithos' })
      }
      if (completedRarities.includes('rare')) {
        badges.push({ name: 'Rare Hunter', description: 'Collected all rare lithos' })
      }
      if (completedRarities.includes('common')) {
        badges.push({ name: 'Completionist', description: 'Collected all common lithos' })
      }

      // Collection milestones
      if (uniqueOwned >= totalLithos && totalLithos > 0) {
        badges.push({ name: 'Full Collection', description: 'Collected every lithos in the game' })
      }
      if (totalOwned >= 100) {
        badges.push({ name: 'Hoarder', description: 'Own 100+ lithos total' })
      }
      if (totalOwned >= 50) {
        badges.push({ name: 'Collector', description: 'Own 50+ lithos total' })
      }
      if (uniqueOwned >= 10) {
        badges.push({ name: 'Explorer', description: 'Collected 10+ unique lithos' })
      }

      // Score: weighted by rarity and completion
      const score =
        (userRarityCounts['common'] || 0) * 1 +
        (userRarityCounts['rare'] || 0) * 3 +
        (userRarityCounts['epic'] || 0) * 7 +
        (userRarityCounts['legendary'] || 0) * 15 +
        completedElements.length * 50 +
        completedRarities.length * 25

      return {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
        totalOwned,
        uniqueOwned,
        completionPercent: totalLithos > 0 ? Math.round((uniqueOwned / totalLithos) * 100) : 0,
        completedElements,
        completedRarities,
        badges,
        score,
      }
    })

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score)

    return {
      success: true,
      data: {
        leaderboard,
        totalLithos,
        totalElements,
      },
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) throw error
    if (error.statusCode) throw error

    console.error('Error fetching leaderboard:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching leaderboard',
    })
  }
})
