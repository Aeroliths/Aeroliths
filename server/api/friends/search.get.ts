export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const query = getQuery(event)
  const search = (query.q as string || '').trim()

  if (!search || search.length < 2) {
    throw createError({ statusCode: 400, message: 'Search query must be at least 2 characters' })
  }

  const users = await db.postgres.user.findMany({
    where: {
      username: { contains: search, mode: 'insensitive' },
      NOT: { id: Number(user.userId) },
    },
    select: {
      id: true,
      username: true,
      profilePicture: true,
    },
    take: 10,
  })

  return { success: true, data: users }
})
