// OAuth route: initiates the Discord flow and handles the callback on the same URL.
// Authorized redirect URI to register with Discord: <origin>/auth/discord
export default defineOAuthDiscordEventHandler({
  config: {
    scope: ['identify', 'email'],
  },
  async onSuccess(event, { user }) {
    const profile = user as {
      id: string
      username?: string
      global_name?: string
      email?: string
      verified?: boolean
      avatar?: string | null
    }

    const avatarUrl = profile.avatar
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
      : null

    return handleOAuthLogin(event, {
      provider: 'discord',
      providerAccountId: profile.id,
      email: profile.email ?? null,
      emailVerified: profile.verified === true,
      displayName:
        profile.global_name || profile.username || profile.email?.split('@')[0] || 'player',
      avatarUrl,
    })
  },
  onError(event, error) {
    console.error('Discord OAuth error:', error.message)
    return localeRedirect(event, '/login?error=oauth_failed')
  },
})
