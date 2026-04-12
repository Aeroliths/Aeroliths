// API route to request a password reset email
export default defineEventHandler(async (event) => {
  // Rate limit: 5 requests per 15 minutes per IP
  rateLimit(event, { key: 'forgot-password', limit: 5, windowMs: 15 * 60 * 1000 })

  const body = await readBody(event) as { email?: string }
  const { email } = body

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required',
    })
  }

  // Always return success to prevent email enumeration
  const successResponse = {
    success: true,
    message: 'If an account exists with this email, a reset link has been sent.',
  }

  try {
    const user = await db.postgres.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return successResponse
    }

    // Generate reset token (same pattern as verification token)
    const { raw, hashed } = generateVerificationToken()

    // Store hashed token with 1-hour expiry
    await db.postgres.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashed,
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    await sendPasswordResetEmail(user.email, user.username, raw)

    return successResponse
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error in forgot-password:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred. Please try again later.',
    })
  }
})
