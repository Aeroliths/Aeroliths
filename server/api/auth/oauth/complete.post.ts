// Finalizes a brand-new OAuth account once the user has chosen a username.
export default defineEventHandler(async (event) => {
  try {
    rateLimit(event, { key: 'oauth-complete', limit: 10, windowMs: 15 * 60 * 1000 })

    const pending = readOAuthPending(event)
    if (!pending) {
      throw createError({
        statusCode: 400,
        message: 'No pending sign-in. Please start again with Discord.',
      })
    }

    const body = await readBody(event)
    const username = typeof body?.username === 'string' ? body.username.trim() : ''

    // Same username rules as standard registration
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
    if (!usernameRegex.test(username)) {
      throw createError({
        statusCode: 400,
        message:
          'Username must be 3-30 characters and contain only letters, numbers, underscores, or hyphens',
      })
    }

    const finishWithSession = async (user: {
      id: string
      email: string
      username: string
      profilePicture: string | null
      emailVerified: boolean
      lastActiveAt: Date
      deletionRequestedAt: Date | null
      createdAt: Date
      role: { id: string; name: string }
      tokenVersion?: number
    }) => {
      clearOAuthPending(event)
      await issueAuthSession(event, {
        id: user.id,
        email: user.email,
        username: user.username,
        role: { name: user.role.name },
        tokenVersion: user.tokenVersion,
      })
      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            profilePicture: user.profilePicture,
            emailVerified: user.emailVerified,
            lastActiveAt: user.lastActiveAt,
            deletionRequestedAt: user.deletionRequestedAt,
            createdAt: user.createdAt,
            role: user.role,
          },
        },
      }
    }

    // If the provider identity already got linked (e.g. double submit), just sign in
    const existingAccount = await db.postgres.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: pending.provider,
          providerAccountId: pending.providerAccountId,
        },
      },
      include: {
        user: { include: { role: true, authentication: { select: { tokenVersion: true } } } },
      },
    })
    if (existingAccount) {
      return finishWithSession({
        ...existingAccount.user,
        tokenVersion: existingAccount.user.authentication?.tokenVersion,
      })
    }

    // If the email got registered during the pending window, link instead of creating
    const userByEmail = await db.postgres.user.findUnique({
      where: { email: pending.email },
      include: { role: true, authentication: { select: { tokenVersion: true } } },
    })
    if (userByEmail) {
      await db.postgres.oAuthAccount.create({
        data: {
          provider: pending.provider,
          providerAccountId: pending.providerAccountId,
          userId: userByEmail.id,
        },
      })
      return finishWithSession({
        ...userByEmail,
        tokenVersion: userByEmail.authentication?.tokenVersion,
      })
    }

    // Username must be free
    const usernameTaken = await db.postgres.user.findUnique({ where: { username } })
    if (usernameTaken) {
      throw createError({ statusCode: 409, message: 'Username already exists' })
    }

    // Ensure the default "user" role exists
    let userRole = await db.postgres.role.findUnique({ where: { name: 'user' } })
    if (!userRole) {
      userRole = await db.postgres.role.create({ data: { name: 'user' } })
    }

    const user = await db.postgres.user.create({
      data: {
        email: pending.email,
        username,
        emailVerified: true, // provider already verified the email
        profilePicture: pending.avatarUrl || null,
        roleId: userRole.id,
        oauthAccounts: {
          create: {
            provider: pending.provider,
            providerAccountId: pending.providerAccountId,
          },
        },
      },
      include: { role: true },
    })

    return finishWithSession({ ...user, tokenVersion: 0 })
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Error completing OAuth sign-in:', error)
    throw createError({ statusCode: 500, message: 'Failed to complete sign-in' })
  }
})
