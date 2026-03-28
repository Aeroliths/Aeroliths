// Add or update a litho in the deck (max 2, must own enough in collection)
export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const body = await readBody(event)
  const { lithosId, quantity } = body

  if (!lithosId || typeof quantity !== 'number') {
    throw createError({ statusCode: 400, message: 'lithosId and quantity are required' })
  }

  if (quantity < 0 || quantity > 2) {
    throw createError({ statusCode: 400, message: 'Quantity must be between 0 and 2' })
  }

  // Check collection ownership
  const collection = await db.postgres.collections.findUnique({
    where: { userId_lithosId: { userId: user.userId, lithosId } },
  })

  if (!collection) {
    throw createError({ statusCode: 400, message: 'You do not own this lithos' })
  }

  if (quantity > collection.quantity) {
    throw createError({
      statusCode: 400,
      message: `You only own ${collection.quantity} of this lithos`,
    })
  }

  // Get or create deck
  let deck = await db.postgres.deck.findUnique({ where: { userId: user.userId } })
  if (!deck) {
    deck = await db.postgres.deck.create({ data: { userId: user.userId } })
  }

  // quantity 0 = remove entry
  if (quantity === 0) {
    await db.postgres.deckEntry.deleteMany({
      where: { deckId: deck.id, lithosId },
    })
    return { success: true, data: null }
  }

  const entry = await db.postgres.deckEntry.upsert({
    where: { deckId_lithosId: { deckId: deck.id, lithosId } },
    create: { deckId: deck.id, lithosId, quantity },
    update: { quantity },
    include: { lithos: true },
  })

  return { success: true, data: entry }
})
