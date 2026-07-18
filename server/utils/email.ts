import crypto from 'crypto'
import type { EmailLocale, WarningType } from './email-i18n'
import {
  buildVerificationEmail,
  buildPasswordResetEmail,
  buildDeletionRequestEmail,
  buildDeletionReminderEmail,
  buildInactivityWarningEmail,
} from './email-i18n'

function getResendConfig() {
  const resendApiKey = process.env.RESEND_API_KEY || ''
  const emailFrom = process.env.EMAIL_FROM || 'noreply@aeroliths.fr'
  if (!resendApiKey) {
    throw new Error('[Email] RESEND_API_KEY is not configured')
  }
  return { resendApiKey, emailFrom }
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const { resendApiKey, emailFrom } = getResendConfig()

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Aeroliths <${emailFrom}>`,
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`[Email] Resend API error: ${response.status} - ${error}`)
  }
}

export function generateVerificationToken(): { raw: string; hashed: string } {
  const raw = crypto.randomBytes(32).toString('hex')
  const hashed = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, hashed }
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export async function sendDeletionRequestEmail(email: string, username: string, deletionDate: Date, locale: EmailLocale): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const formattedDate = deletionDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  console.log(`[Email] Sending deletion request confirmation to ${email}`)
  const { subject, html } = buildDeletionRequestEmail(locale, username, formattedDate, appUrl)
  await sendEmail(email, subject, html)
  console.log(`[Email] Deletion request confirmation sent to ${email}`)
}

export async function sendDeletionReminderEmail(email: string, username: string, deletionDate: Date, locale: EmailLocale): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const formattedDate = deletionDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  console.log(`[Email] Sending deletion reminder (1 week) to ${email}`)
  const { subject, html } = buildDeletionReminderEmail(locale, username, formattedDate, appUrl)
  await sendEmail(email, subject, html)
  console.log(`[Email] Deletion reminder sent to ${email}`)
}

export async function sendInactivityWarningEmail(
  email: string,
  username: string,
  warningType: WarningType,
  deletionDate: Date,
  locale: EmailLocale
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const formattedDate = deletionDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  console.log(`[Email] Sending inactivity warning (${warningType}) to ${email}`)
  const { subject, html } = buildInactivityWarningEmail(locale, username, warningType, formattedDate, appUrl)
  await sendEmail(email, subject, html)
  console.log(`[Email] Inactivity warning (${warningType}) sent to ${email}`)
}

export async function sendPasswordResetEmail(email: string, username: string, token: string, locale: EmailLocale): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

  console.log(`[Email] Sending password reset email to ${email}`)
  const { subject, html } = buildPasswordResetEmail(locale, username, resetUrl)
  await sendEmail(email, subject, html)
  console.log(`[Email] Password reset email sent to ${email}`)
}

export async function sendVerificationEmail(email: string, token: string, locale: EmailLocale): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const verificationUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  console.log(`[Email] Sending verification email to ${email} via Resend`)
  const { subject, html } = buildVerificationEmail(locale, verificationUrl)
  await sendEmail(email, subject, html)
  console.log(`[Email] Verification email sent successfully to ${email}`)
}
