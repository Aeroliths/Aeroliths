import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import type { H3Event } from 'h3'

export interface JWTPayload {
  userId: string
  email: string
  username: string
  role: string
  tokenVersion?: number
}

/**
 * Sign a JWT, set the auth_token cookie, and record the login.
 * Shared by password login and OAuth sign-in so both stay consistent.
 */
export async function issueAuthSession(
  event: H3Event,
  user: {
    id: string
    email: string
    username: string
    role: { name: string }
    tokenVersion?: number
  }
) {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in environment variables')
    throw createError({ statusCode: 500, message: 'Server configuration error' })
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role.name,
      tokenVersion: user.tokenVersion ?? 0,
    },
    jwtSecret,
    { expiresIn: expiresIn as SignOptions['expiresIn'] }
  )

  // Update last active date, cancel any pending deletion, reset inactivity flags
  await db.postgres.user.update({
    where: { id: user.id },
    data: {
      lastActiveAt: new Date(),
      deletionRequestedAt: null,
      deletionReminderSent: false,
      warning6MonthsSent: false,
      warning2MonthsSent: false,
      warning1MonthSent: false,
      warning1WeekSent: false,
    },
  })

  await db.postgres.loginHistory.create({ data: { userId: user.id } })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return token
}

/**
 * Verify JWT token and return decoded payload
 */
export function verifyToken(token: string): JWTPayload {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw createError({
      statusCode: 500,
      message: 'Server configuration error',
    })
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    return decoded
  } catch (error) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token',
    })
  }
}

/**
 * Extract and verify token from Authorization header or cookie
 */
export function getAuthUser(event: H3Event): JWTPayload {
  // First try to get token from Authorization header
  const authHeader = getHeader(event, 'authorization')

  if (authHeader) {
    // Expected format: "Bearer <token>"
    const [type, token] = authHeader.split(' ')

    if (type === 'Bearer' && token) {
      return verifyToken(token)
    }
  }

  // If no Authorization header, try to get token from cookie
  const tokenFromCookie = getCookie(event, 'auth_token')

  if (tokenFromCookie) {
    return verifyToken(tokenFromCookie)
  }

  // No token found in header or cookie
  throw createError({
    statusCode: 401,
    message: 'Authentication required',
  })
}

/**
 * Check if user has required role
 */
export function requireRole(user: JWTPayload, allowedRoles: string[]) {
  if (!allowedRoles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Insufficient permissions',
    })
  }
}
