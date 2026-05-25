import { resolveMx } from 'node:dns/promises'
import disposableDomains from 'disposable-email-domains'

const disposableSet = new Set<string>(disposableDomains as string[])

const MX_CACHE_TTL_MS = 60 * 60 * 1000
const mxCache = new Map<string, { hasMx: boolean; expiresAt: number }>()

async function domainHasMx(domain: string): Promise<boolean | null> {
  const cached = mxCache.get(domain)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.hasMx
  }

  try {
    const records = await resolveMx(domain)
    const hasMx = Array.isArray(records) && records.length > 0
    mxCache.set(domain, { hasMx, expiresAt: Date.now() + MX_CACHE_TTL_MS })
    return hasMx
  } catch (err: any) {
    if (err?.code === 'ENOTFOUND' || err?.code === 'ENODATA') {
      mxCache.set(domain, { hasMx: false, expiresAt: Date.now() + MX_CACHE_TTL_MS })
      return false
    }
    console.error('MX lookup failed for domain', domain, err?.code || err)
    return null
  }
}

/**
 * Validate that an email is not from a disposable provider and that its
 * domain has at least one MX record.
 *
 * Returns null if the email passes both checks (or input is malformed -
 * the caller's regex check handles format errors), or a user-facing error
 * message string if it fails.
 */
export async function validateEmailTrust(email: string): Promise<string | null> {
  const atIndex = email.lastIndexOf('@')
  if (atIndex < 1 || atIndex === email.length - 1) {
    return null
  }

  const domain = email.slice(atIndex + 1).toLowerCase().trim()
  if (!domain) {
    return null
  }

  if (disposableSet.has(domain)) {
    return 'Disposable email addresses are not allowed. Please use a permanent email address.'
  }

  const hasMx = await domainHasMx(domain)
  if (hasMx === false) {
    return 'This email domain does not appear to be valid. Please check the spelling.'
  }

  return null
}
