// Security headers middleware
export default defineEventHandler((event) => {
  // Only apply to responses (not internal Nuxt routes)
  const headers = event.node.res

  // Prevent clickjacking
  headers.setHeader('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  headers.setHeader('X-Content-Type-Options', 'nosniff')

  // Control referrer information
  headers.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Prevent XSS in older browsers
  headers.setHeader('X-XSS-Protection', '1; mode=block')

  // Restrict permissions/features
  headers.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )

  // HSTS — force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    headers.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }
})
