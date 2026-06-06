export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const query = getQuery(event)
  const search = (query.q as string || '').trim()

  const users = await db.postgres.user.findMany({
    where: {
      NOT: { id: user.userId },
      emailVerified: true,
      ...(search.length >= 2 && {
        username: { contains: search, mode: 'insensitive' },
      }),
    },
    select: {
      id: true,
      username: true,
      profilePicture: true,
    },
    take: 50,
  })

  return { success: true, data: users }
})
