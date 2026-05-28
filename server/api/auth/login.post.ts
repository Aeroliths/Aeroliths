import bcrypt from 'bcrypt'

// API route to authenticate user and return JWT token
export default defineEventHandler(async (event) => {
  try {
    // Rate limit: 10 attempts per 15 minutes per IP
    rateLimit(event, { key: 'login', limit: 10, windowMs: 15 * 60 * 1000 })

    const body = await readBody(event)
    const { email, password, captchaToken } = body || {}

    // Verify captcha before any DB work
    await verifyCaptcha(captchaToken, event)

    // Validate required fields
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Email and password are required',
      })
    }

    // Find user by email with authentication
    const user = await db.postgres.user.findUnique({
      where: { email },
      include: {
        authentication: true,
        role: true,
      },
    })

    if (!user || !user.authentication) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password',
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.authentication.password)

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password',
      })
    }

    // Check email verification
    if (!user.emailVerified) {
      throw createError({
        statusCode: 403,
        statusMessage: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email before logging in. Check your inbox for a verification link.',
      })
    }

    // Sign JWT, set the auth cookie, and record the login
    await issueAuthSession(event, {
      id: user.id,
      email: user.email,
      username: user.username,
      role: { name: user.role.name },
      tokenVersion: user.authentication.tokenVersion,
    })

    // Only expose fields needed by the frontend (internal flags excluded)
    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      profilePicture: user.profilePicture,
      emailVerified: user.emailVerified,
      lastActiveAt: user.lastActiveAt,
      deletionRequestedAt: user.deletionRequestedAt,
      createdAt: user.createdAt,
      role: { id: user.role.id, name: user.role.name },
    }

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: safeUser,
      },
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Error during login:', error)
    throw createError({
      statusCode: 500,
      message: 'Login failed',
    })
  }
})
