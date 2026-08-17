// API route to get current authenticated user information
export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user from token
    const user = getAuthUser(event)

    // Fetch user details (only fields needed by the frontend - internal flags excluded)
    const userDetails = await db.postgres.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
        emailVerified: true,
        lastActiveAt: true,
        deletionRequestedAt: true,
        createdAt: true,
        xp: true,
        level: true,
        role: { select: { id: true, name: true } },
        authentication: { select: { tokenVersion: true } },
      },
    })

    if (!userDetails) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    // Verify token version (invalidates old tokens after password change)
    if (
      user.tokenVersion !== undefined &&
      userDetails.authentication &&
      user.tokenVersion !== userDetails.authentication.tokenVersion
    ) {
      throw createError({
        statusCode: 401,
        message: 'Session expired. Please log in again.',
      })
    }

    // Remove authentication from response
    const { authentication, ...userWithoutAuth } = userDetails

    // The threshold of the next level, resolved here so the client never needs
    // to read the curve table, which is admin-only. Null once the top of the
    // curve is reached, or while no curve is configured.
    const nextEntry = await db.postgres.progressionLevel.findFirst({
      where: { level: userDetails.level + 1 },
      select: { xpRequired: true },
    })

    // Update last active date
    await db.postgres.user.update({
      where: { id: user.userId },
      data: { lastActiveAt: new Date() },
    })

    return {
      success: true,
      data: { ...userWithoutAuth, nextLevelXp: nextEntry?.xpRequired ?? null },
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Error fetching user details:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch user details',
    })
  }
})
