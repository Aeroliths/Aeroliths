// Reports whether an OAuth onboarding session is in progress (cookie is httpOnly,
// so the client cannot read it directly). Used by the choose-username page.
export default defineEventHandler((event) => {
  const pending = readOAuthPending(event)
  if (!pending) {
    return { pending: false }
  }

  let suggestedUsername = (pending.displayName || pending.email.split('@')[0] || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 30)
  if (suggestedUsername.length < 3) {
    suggestedUsername = ''
  }

  return {
    pending: true,
    provider: pending.provider,
    email: pending.email,
    suggestedUsername,
  }
})
