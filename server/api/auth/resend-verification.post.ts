export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body || {}

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'Email is required',
    })
  }

  const user = await db.postgres.user.findUnique({
    where: { email },
  })

  // Always return success to prevent email enumeration
  if (!user || user.emailVerified) {
    return { success: true, message: 'If that email exists and is unverified, a new verification link has been sent.' }
  }

  // Rate limiting: check if the last token was created less than 60 seconds ago
  if (user.verificationTokenExpiresAt) {
    const tokenAgeMs = 24 * 60 * 60 * 1000 - (user.verificationTokenExpiresAt.getTime() - Date.now())
    if (tokenAgeMs < 60 * 1000) {
      throw createError({
        statusCode: 429,
        message: 'Please wait before requesting another verification email.',
      })
    }
  }

  const { raw, hashed } = generateVerificationToken()
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await db.postgres.user.update({
    where: { id: user.id },
    data: {
      verificationToken: hashed,
      verificationTokenExpiresAt: tokenExpiry,
    },
  })

  try {
    await sendVerificationEmail(email, raw)
  } catch (emailError) {
    console.error('Failed to resend verification email:', emailError)
    throw createError({
      statusCode: 500,
      message: 'Failed to send verification email. Please try again later.',
    })
  }

  return { success: true, message: 'If that email exists and is unverified, a new verification link has been sent.' }
})
