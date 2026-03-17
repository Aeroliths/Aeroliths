export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { token, email } = query

  if (!token || !email || typeof token !== 'string' || typeof email !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Token and email are required',
    })
  }

  const hashedToken = hashToken(token)

  const user = await db.postgres.user.findUnique({
    where: { email },
  })

  if (!user || user.verificationToken !== hashedToken) {
    throw createError({
      statusCode: 400,
      message: 'Invalid verification token',
    })
  }

  if (user.emailVerified) {
    return { success: true, message: 'Email already verified' }
  }

  if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
    throw createError({
      statusCode: 400,
      message: 'Verification token has expired. Please request a new one.',
    })
  }

  await db.postgres.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    },
  })

  return { success: true, message: 'Email verified successfully' }
})
