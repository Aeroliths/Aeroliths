import crypto from 'crypto'
import nodemailer from 'nodemailer'

export function generateVerificationToken(): { raw: string; hashed: string } {
  const raw = crypto.randomBytes(32).toString('hex')
  const hashed = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, hashed }
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const smtpHost = process.env.SMTP_HOST || 'localhost'
  const smtpPort = Number(process.env.SMTP_PORT || '587')
  const smtpUser = process.env.SMTP_USER || ''
  const smtpPass = process.env.SMTP_PASS || ''
  const smtpFrom = process.env.SMTP_FROM || 'noreply@aeroliths.fr'
  const appUrl = process.env.APP_URL || 'http://localhost:3000'

  const verificationUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  console.log(`[Email] Connecting to SMTP: ${smtpHost}:${smtpPort}`)

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  await transporter.sendMail({
    from: `Aeroliths <${smtpFrom}>`,
    to: email,
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
  })
}
