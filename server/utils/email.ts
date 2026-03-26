import crypto from 'crypto'

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

export async function sendDeletionRequestEmail(email: string, username: string, deletionDate: Date): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const formattedDate = deletionDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  console.log(`[Email] Sending deletion request confirmation to ${email}`)
  await sendEmail(email, 'Demande de suppression de compte - Aeroliths', `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #7ab8d4; text-align: center;">Aeroliths</h1>
      <h2 style="color: #333; text-align: center;">Demande de suppression de compte</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Bonjour <strong>${username}</strong>,
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Nous avons bien reçu votre demande de suppression de compte. Si vous ne vous reconnectez pas avant le <strong>${formattedDate}</strong>, votre compte sera définitivement supprimé.
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Pour annuler cette demande, il vous suffit de vous reconnecter à votre compte avant cette date.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/login"
           style="background-color: #7ab8d4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
          Se connecter pour annuler
        </a>
      </div>
      <p style="color: #888; font-size: 13px; text-align: center;">
        Si vous n'êtes pas à l'origine de cette demande, connectez-vous immédiatement pour sécuriser votre compte.
      </p>
    </div>
  `)
  console.log(`[Email] Deletion request confirmation sent to ${email}`)
}

export async function sendDeletionReminderEmail(email: string, username: string, deletionDate: Date): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const formattedDate = deletionDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  console.log(`[Email] Sending deletion reminder (1 week) to ${email}`)
  await sendEmail(email, 'Votre compte sera supprimé dans 7 jours - Aeroliths', `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #7ab8d4; text-align: center;">Aeroliths</h1>
      <h2 style="color: #e57373; text-align: center;">⚠️ Suppression imminente de votre compte</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Bonjour <strong>${username}</strong>,
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Votre compte Aeroliths sera <strong>définitivement supprimé le ${formattedDate}</strong> (dans 7 jours) suite à votre demande de suppression.
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Si vous souhaitez conserver votre compte, reconnectez-vous avant cette date pour annuler automatiquement la suppression.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/login"
           style="background-color: #7ab8d4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
          Annuler la suppression
        </a>
      </div>
      <p style="color: #888; font-size: 13px; text-align: center;">
        Sans action de votre part, votre compte et toutes vos données seront supprimés définitivement.
      </p>
    </div>
  `)
  console.log(`[Email] Deletion reminder sent to ${email}`)
}

export async function sendInactivityWarningEmail(
  email: string,
  username: string,
  warningType: '6months' | '2months' | '1month' | '1week',
  deletionDate: Date
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const formattedDate = deletionDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const warningLabels: Record<string, string> = {
    '6months': '6 mois',
    '2months': '2 mois',
    '1month': '1 mois',
    '1week': '7 jours',
  }

  const subjects: Record<string, string> = {
    '6months': 'Votre compte Aeroliths est inactif depuis 6 mois',
    '2months': 'Votre compte Aeroliths sera supprimé dans 2 mois',
    '1month': 'Votre compte Aeroliths sera supprimé dans 1 mois',
    '1week': 'Votre compte Aeroliths sera supprimé dans 7 jours',
  }

  const label = warningLabels[warningType]
  const isUrgent = warningType === '1week' || warningType === '1month'

  console.log(`[Email] Sending inactivity warning (${warningType}) to ${email}`)
  await sendEmail(email, subjects[warningType], `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #7ab8d4; text-align: center;">Aeroliths</h1>
      <h2 style="color: ${isUrgent ? '#e57373' : '#333'}; text-align: center;">
        ${isUrgent ? '⚠️ ' : ''}Compte inactif — suppression dans ${label}
      </h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Bonjour <strong>${username}</strong>,
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        ${warningType === '6months'
          ? `Votre compte Aeroliths est inactif depuis 6 mois. Conformément à notre politique, les comptes inactifs pendant 3 ans sont supprimés automatiquement.`
          : `Votre compte Aeroliths sera <strong>définitivement supprimé le ${formattedDate}</strong> en raison d'une inactivité prolongée.`
        }
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Pour conserver votre compte, il vous suffit de vous connecter.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/login"
           style="background-color: #7ab8d4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
          Me connecter
        </a>
      </div>
      <p style="color: #888; font-size: 13px; text-align: center;">
        Si vous ne souhaitez plus utiliser Aeroliths, vous pouvez ignorer cet e-mail.
        Votre compte sera supprimé automatiquement le ${formattedDate}.
      </p>
    </div>
  `)
  console.log(`[Email] Inactivity warning (${warningType}) sent to ${email}`)
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const verificationUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  console.log(`[Email] Sending verification email to ${email} via Resend`)
  await sendEmail(email, 'Verify your email - Aeroliths', `
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
  `)
  console.log(`[Email] Verification email sent successfully to ${email}`)
}
