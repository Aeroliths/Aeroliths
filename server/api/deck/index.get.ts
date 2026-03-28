// Get or auto-create the user's deck with all entries
export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)

  let deck = await db.postgres.deck.findUnique({
    where: { userId: user.userId },
    include: {
      entries: {
        include: { lithos: true },
      },
    },
  })

  if (!deck) {
    deck = await db.postgres.deck.create({
      data: { userId: user.userId },
      include: {
        entries: {
          include: { lithos: true },
        },
      },
    })
  }

  return { success: true, data: deck }
})
