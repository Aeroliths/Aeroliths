// OAuth route: initiates the Google flow and handles the callback on the same URL.
// Authorized redirect URI to register with Google: <origin>/auth/google
export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile'],
  },
  async onSuccess(event, { user }) {
    const profile = user as {
      sub: string
      email?: string
      email_verified?: boolean | string
      name?: string
      given_name?: string
      picture?: string
    }

    return handleOAuthLogin(event, {
      provider: 'google',
      providerAccountId: profile.sub,
      email: profile.email ?? null,
      emailVerified: profile.email_verified === true || profile.email_verified === 'true',
      displayName:
        profile.name || profile.given_name || (profile.email ? profile.email.split('@')[0] : 'player'),
      avatarUrl: profile.picture ?? null,
    })
  },
  onError(event, error) {
    console.error('Google OAuth error:', error.message)
    return sendRedirect(event, '/login?error=oauth_failed')
  },
})
