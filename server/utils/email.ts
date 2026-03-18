import crypto from 'crypto'

export function generateVerificationToken(): { raw: string; hashed: string } {
  const raw = crypto.randomBytes(32).toString('hex')
  const hashed = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, hashed }
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY || ''
  const emailFrom = process.env.EMAIL_FROM || 'noreply@aeroliths.fr'
  const appUrl = process.env.APP_URL || 'http://localhost:3000'

  if (!resendApiKey) {
    throw new Error('[Email] RESEND_API_KEY is not configured')
  }

  const verificationUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  console.log(`[Email] Sending verification email to ${email} via Resend`)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Aeroliths <${emailFrom}>`,
      to: [email],
      subject: 'Verify your email - Aeroliths',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #7ab8d4; text-align: center;">Aeroliths</h1>
          <h2 style="color: #333; text-align: center;">Verify your email address</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Thank you for creating an Aeroliths account! Please click the button below to verify your email address.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #7ab8d4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Verify Email
            </a>
          </div>
          <p style="color: #888; font-size: 13px; text-align: center;">
            This link expires in 24 hours. If you didn't create an account, you can ignore this email.
          </p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`[Email] Resend API error: ${response.status} - ${error}`)
  }

  console.log(`[Email] Verification email sent successfully to ${email}`)
}
