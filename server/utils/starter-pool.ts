// Gives a player the lithos flagged as starter, once and only once.
//
// The marker on the user row is claimed with updateMany inside the transaction:
// it only matches while starterPoolGrantedAt is still null, so two concurrent
// calls (registration racing the admin backfill) cannot both hand out the pool.
export async function grantStarterPool(userId: string): Promise<{ granted: boolean }> {
  const user = await db.postgres.user.findUnique({
    where: { id: userId },
    select: { starterPoolGrantedAt: true },
  })

  // Unknown user, or already served.
  if (!user || user.starterPoolGrantedAt) {
    return { granted: false }
  }

  const starterLithos = await db.postgres.lithos.findMany({
    where: { isStarter: true },
    select: { id: true, starterQuantity: true },
  })

  // An empty pool must not burn the marker: the player stays eligible for when
  // the pool is filled in.
  if (starterLithos.length === 0) {
    return { granted: false }
  }

  const granted = await db.postgres.$transaction(async (tx: any) => {
    const claim = await tx.user.updateMany({
      where: { id: userId, starterPoolGrantedAt: null },
      data: { starterPoolGrantedAt: new Date() },
    })

    if (claim.count === 0) {
      return false
    }

    for (const lithos of starterLithos) {
      const quantity = Math.max(1, lithos.starterQuantity)

      await tx.collections.upsert({
        where: { userId_lithosId: { userId, lithosId: lithos.id } },
        create: { userId, lithosId: lithos.id, quantity },
        update: { quantity: { increment: quantity } },
      })
    }

    return true
  })

  return { granted }
}

// Registration wrapper: a player who cannot be served must still get their
// account. Their marker stays null, so the admin backfill picks them up later.
export async function grantStarterPoolSafely(userId: string): Promise<void> {
  try {
    await grantStarterPool(userId)
  } catch (error) {
    console.error('Failed to grant the starter pool:', error)
  }
}
