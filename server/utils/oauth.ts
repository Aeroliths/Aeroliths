import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

export type OAuthProvider = 'google' | 'discord'

export interface NormalizedOAuthProfile {
  provider: OAuthProvider
  providerAccountId: string
  email: string | null
  emailVerified: boolean
  displayName: string
  avatarUrl: string | null
}

export interface OAuthPendingData {
  provider: OAuthProvider
  providerAccountId: string
  email: string
  displayName: string
  avatarUrl: string | null
}

const PENDING_COOKIE = 'oauth_pending'
const PENDING_MAX_AGE = 15 * 60 // 15 minutes

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw createError({ statusCode: 500, message: 'Server configuration error' })
  }
  return secret
}

export function setOAuthPending(event: H3Event, data: OAuthPendingData) {
  const token = jwt.sign(data, getSecret(), { expiresIn: PENDING_MAX_AGE })
  setCookie(event, PENDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PENDING_MAX_AGE,
    path: '/',
  })
}

export function readOAuthPending(event: H3Event): OAuthPendingData | null {
  const token = getCookie(event, PENDING_COOKIE)
  if (!token) return null
  try {
    const { iat, exp, ...data } = jwt.verify(token, getSecret()) as OAuthPendingData & {
      iat?: number
      exp?: number
    }
    return data
  } catch {
    return null
  }
}

export function clearOAuthPending(event: H3Event) {
  deleteCookie(event, PENDING_COOKIE, { path: '/' })
}

/**
 * Core OAuth sign-in logic shared by every provider route.
 * Decides between: returning user, auto-link by verified email, or new-account onboarding.
 * Always ends with a redirect.
 */
export async function handleOAuthLogin(event: H3Event, profile: NormalizedOAuthProfile) {
  // Only trust providers that confirm the email is verified (account-takeover guard)
  if (!profile.email || !profile.emailVerified) {
    return sendRedirect(event, '/login?error=oauth_email_unverified')
  }

  const email = profile.email.toLowerCase()

  // 1. Known OAuth identity -> returning user
  const existingAccount = await db.postgres.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: {
      user: {
        include: { role: true, authentication: { select: { tokenVersion: true } } },
      },
    },
  })

  if (existingAccount) {
    const u = existingAccount.user
    await issueAuthSession(event, {
      id: u.id,
      email: u.email,
      username: u.username,
      role: { name: u.role.name },
      tokenVersion: u.authentication?.tokenVersion,
    })
    return sendRedirect(event, '/play')
  }

  // 2. Existing account with the same verified email -> link
  const userByEmail = await db.postgres.user.findUnique({
    where: { email },
    include: { role: true, authentication: { select: { tokenVersion: true } } },
  })

  if (userByEmail) {
    await db.postgres.oAuthAccount.create({
      data: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        userId: userByEmail.id,
      },
    })
    // A verified-email provider also confirms the email for unverified accounts
    if (!userByEmail.emailVerified) {
      await db.postgres.user.update({
        where: { id: userByEmail.id },
        data: { emailVerified: true, verificationToken: null, verificationTokenExpiresAt: null },
      })
    }
    await issueAuthSession(event, {
      id: userByEmail.id,
      email: userByEmail.email,
      username: userByEmail.username,
      role: { name: userByEmail.role.name },
      tokenVersion: userByEmail.authentication?.tokenVersion,
    })
    return sendRedirect(event, '/play')
  }

  // 3. Brand-new user -> let them pick a username before the account is created
  setOAuthPending(event, {
    provider: profile.provider,
    providerAccountId: profile.providerAccountId,
    email,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
  })
  return sendRedirect(event, '/choose-username')
}
