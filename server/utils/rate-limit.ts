import type { H3Event } from 'h3'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (cleared on server restart)
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Rate limit a request by IP + route key.
 * Throws 429 if limit exceeded.
 */
export function rateLimit(
  event: H3Event,
  options: {
    key: string         // Unique identifier for this limiter (e.g., 'login', 'register')
    limit: number       // Max requests allowed in the window
    windowMs: number    // Time window in milliseconds
  }
) {
  const ip =
    getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    getHeader(event, 'x-real-ip') ||
    event.node.req.socket.remoteAddress ||
    'unknown'

  const storeKey = `${options.key}:${ip}`
  const now = Date.now()

  let entry = store.get(storeKey)

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + options.windowMs }
    store.set(storeKey, entry)
  }

  entry.count++

  // Set rate limit headers
  const remaining = Math.max(0, options.limit - entry.count)
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000)

  setHeader(event, 'X-RateLimit-Limit', String(options.limit))
  setHeader(event, 'X-RateLimit-Remaining', String(remaining))
  setHeader(event, 'X-RateLimit-Reset', String(entry.resetAt))

  if (entry.count > options.limit) {
    setHeader(event, 'Retry-After', String(retryAfter))
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please try again later.',
    })
  }
}
