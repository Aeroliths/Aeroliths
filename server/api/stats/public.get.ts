// Public stats endpoint for footer counters (no auth required)
export default defineCachedEventHandler(async () => {
  const [totalUsers, totalLithos, totalCollections] = await Promise.all([
    db.postgres.user.count(),
    db.postgres.lithos.count(),
    db.postgres.collections.count(),
  ])

  return {
    users: totalUsers,
    lithos: totalLithos,
    collections: totalCollections,
    games: 0,
  }
}, {
  maxAge: 60,
  name: 'public-stats',
})
