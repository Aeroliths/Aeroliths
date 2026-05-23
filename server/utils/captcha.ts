import type { H3Event } from 'h3'

interface HCaptchaVerifyResponse {
  success: boolean
  'error-codes'?: string[]
  hostname?: string
  challenge_ts?: string
}

/**
 * Verify an hCaptcha token against the hCaptcha siteverify endpoint.
 * Throws a 400 on missing/invalid token. Fail-closed on network errors (500).
 */
export async function verifyCaptcha(token: string | undefined | null, event: H3Event) {
  if (!token || typeof token !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Captcha is required',
    })
  }

  const { hcaptchaSecret } = useRuntimeConfig(event)

  const remoteIp =
    getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    getHeader(event, 'x-real-ip') ||
    event.node.req.socket.remoteAddress ||
    ''

  const params = new URLSearchParams({
    secret: hcaptchaSecret,
    response: token,
  })
  if (remoteIp) params.set('remoteip', remoteIp)

  const result = await $fetch<HCaptchaVerifyResponse>('https://api.hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!result.success) {
    const codes = result['error-codes']?.join(', ') || 'unknown'
    console.error(`[captcha] hCaptcha verification failed: ${codes}`)
    throw createError({
      statusCode: 400,
      message: `Captcha verification failed${process.env.NODE_ENV !== 'production' ? ` (${codes})` : ''}`,
    })
  }
}
