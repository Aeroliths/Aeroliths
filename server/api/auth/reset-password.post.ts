import bcrypt from 'bcrypt'

// API route to reset password using a valid token
export default defineEventHandler(async (event) => {
  // Rate limit: 5 attempts per 15 minutes per IP
  rateLimit(event, { key: 'reset-password', limit: 5, windowMs: 15 * 60 * 1000 })

  const body = await readBody(event) as { token?: string; email?: string; password?: string }
  const { token, email, password } = body

  if (!token || !email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token, email and new password are required',
    })
  }

  // Validate password strength
  const passwordError = validatePassword(password)
  if (passwordError) {
    throw createError({
      statusCode: 400,
      statusMessage: passwordError,
    })
  }

  try {
    const user = await db.postgres.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { authentication: true },
    })

    if (!user || !user.authentication) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired reset link',
      })
    }

    // Verify token
    if (!user.resetToken || !user.resetTokenExpiresAt) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired reset link',
      })
    }

    // Check expiry
    if (new Date() > user.resetTokenExpiresAt) {
      // Clean up expired token
      await db.postgres.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiresAt: null },
      })
      throw createError({
        statusCode: 400,
        statusMessage: 'Reset link has expired. Please request a new one.',
      })
    }

    // Compare hashed tokens
    const hashedToken = hashToken(token)
    if (hashedToken !== user.resetToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired reset link',
      })
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(password, 10)

    await db.postgres.$transaction([
      db.postgres.authentication.update({
        where: { userId: user.id },
        data: {
          password: hashedPassword,
          tokenVersion: { increment: 1 },
        },
      }),
      db.postgres.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiresAt: null,
        },
      }),
    ])

    return {
      success: true,
      message: 'Password has been reset successfully.',
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error in reset-password:', error instanceof Error ? error.name : 'UnknownError')
    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred. Please try again later.',
    })
  }
})
