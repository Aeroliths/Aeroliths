// API route to get a user's public profile with collection stats
export default defineEventHandler(async (event) => {
  try {
    getAuthUser(event)

    const username = getRouterParam(event, 'username')
    if (!username) {
      throw createError({ statusCode: 400, statusMessage: 'Username is required' })
    }

    const user = await db.postgres.user.findUnique({
      where: { username },
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
                name: true,
                sprite: true,
                rarity: true,
                elementId: true,
                element: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    // Get totals for completion
    const [totalLithos, totalElements] = await Promise.all([
      db.postgres.lithos.count(),
      db.postgres.elements.count(),
    ])

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

    const lithosByRarity = await db.postgres.lithos.groupBy({
      by: ['rarity'],
      _count: { rarity: true },
    })
    const totalPerRarity: Record<string, number> = {}
    for (const r of lithosByRarity) {
      totalPerRarity[r.rarity] = r._count.rarity
    }

    const elements = await db.postgres.elements.findMany({
      select: { id: true, name: true },
    })
    const elementNameMap = new Map(elements.map((e) => [e.id, e.name]))

    // User stats
    const totalOwned = user.collections.reduce((sum, c) => sum + c.quantity, 0)
    const uniqueOwned = user.collections.length

    const userRarityCounts: Record<string, number> = {}
    const userLithosByElement: Record<string, Set<string>> = {}

    for (const c of user.collections) {
      userRarityCounts[c.lithos.rarity] = (userRarityCounts[c.lithos.rarity] || 0) + 1
      if (c.lithos.elementId) {
        if (!userLithosByElement[c.lithos.elementId]) userLithosByElement[c.lithos.elementId] = new Set()
        userLithosByElement[c.lithos.elementId].add(c.lithos.id)
      }
    }

    // Element completion
    const elementCompletion = elements.map((el) => {
      const total = lithosPerElement[el.id]?.size || 0
      const owned = userLithosByElement[el.id]?.size || 0
      return {
        name: el.name,
        owned,
        total,
        completed: total > 0 && owned >= total,
      }
    })

    // Rarity completion
    const rarityCompletion = Object.entries(totalPerRarity).map(([rarity, total]) => ({
      rarity,
      owned: userRarityCounts[rarity] || 0,
      total,
      completed: (userRarityCounts[rarity] || 0) >= total,
    }))

    // Badges
    const badges: { name: string; description: string }[] = []

    for (const el of elementCompletion) {
      if (el.completed) {
        badges.push({ name: `${el.name} Master`, description: `Collected all ${el.name} lithos` })
      }
    }
    for (const r of rarityCompletion) {
      if (!r.completed) continue
      if (r.rarity === 'legendary') badges.push({ name: 'Legendary', description: 'Collected all legendary lithos' })
      if (r.rarity === 'epic') badges.push({ name: 'Epic Collector', description: 'Collected all epic lithos' })
      if (r.rarity === 'rare') badges.push({ name: 'Rare Hunter', description: 'Collected all rare lithos' })
      if (r.rarity === 'common') badges.push({ name: 'Completionist', description: 'Collected all common lithos' })
    }
    if (uniqueOwned >= totalLithos && totalLithos > 0) {
      badges.push({ name: 'Full Collection', description: 'Collected every lithos in the game' })
    }
    if (totalOwned >= 100) badges.push({ name: 'Hoarder', description: 'Own 100+ lithos total' })
    if (totalOwned >= 50) badges.push({ name: 'Collector', description: 'Own 50+ lithos total' })
    if (uniqueOwned >= 10) badges.push({ name: 'Explorer', description: 'Collected 10+ unique lithos' })

    const score =
      (userRarityCounts['common'] || 0) * 1 +
      (userRarityCounts['rare'] || 0) * 3 +
      (userRarityCounts['epic'] || 0) * 7 +
      (userRarityCounts['legendary'] || 0) * 15 +
      elementCompletion.filter((e) => e.completed).length * 50 +
      rarityCompletion.filter((r) => r.completed).length * 25

    // Collection grouped by element
    const collectionByElement: Record<string, any[]> = {}
    for (const c of user.collections) {
      const elName = c.lithos.element?.name || 'Unknown'
      if (!collectionByElement[elName]) collectionByElement[elName] = []
      collectionByElement[elName].push({
        name: c.lithos.name,
        sprite: c.lithos.sprite,
        rarity: c.lithos.rarity,
        quantity: c.quantity,
      })
    }

    return {
      success: true,
      data: {
        username: user.username,
        profilePicture: user.profilePicture,
        memberSince: user.createdAt,
        score,
        totalOwned,
        uniqueOwned,
        completionPercent: totalLithos > 0 ? Math.round((uniqueOwned / totalLithos) * 100) : 0,
        badges,
        elementCompletion,
        rarityCompletion,
        collectionByElement,
      },
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403 || error.statusCode === 404) throw error
    if (error.statusCode) throw error

    console.error('Error fetching user profile:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching user profile',
    })
  }
})
