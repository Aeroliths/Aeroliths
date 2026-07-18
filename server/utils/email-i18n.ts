export type EmailLocale = 'en' | 'fr'
export type WarningType = '6months' | '2months' | '1month' | '1week'

interface EmailContent {
  subject: string
  html: string
}

const BUTTON_STYLE = 'background-color: #7ab8d4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;'

function wrap(heading: string, bodyHtml: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #7ab8d4; text-align: center;">Aeroliths</h1>
      <h2 style="color: #333; text-align: center;">${heading}</h2>
      ${bodyHtml}
    </div>
  `
}

export function buildVerificationEmail(locale: EmailLocale, verificationUrl: string): EmailContent {
  if (locale === 'fr') {
    return {
      subject: 'Vérifiez votre email - Aeroliths',
      html: wrap('Vérifiez votre adresse email', `
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Merci d'avoir créé un compte Aeroliths ! Cliquez sur le bouton ci-dessous pour vérifier votre adresse email.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="${BUTTON_STYLE}">Vérifier mon email</a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">
          Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
        </p>
      `),
    }
  }

  return {
    subject: 'Verify your email - Aeroliths',
    html: wrap('Verify your email address', `
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Thank you for creating an Aeroliths account! Please click the button below to verify your email address.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="${BUTTON_STYLE}">Verify Email</a>
      </div>
      <p style="color: #888; font-size: 13px; text-align: center;">
        This link expires in 24 hours. If you didn't create an account, you can ignore this email.
      </p>
    `),
  }
}

export function buildPasswordResetEmail(locale: EmailLocale, username: string, resetUrl: string): EmailContent {
  if (locale === 'fr') {
    return {
      subject: 'Réinitialisez votre mot de passe - Aeroliths',
      html: wrap('Réinitialisez votre mot de passe', `
        <p style="color: #555; font-size: 16px; line-height: 1.6;">Bonjour <strong>${username}</strong>,</p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="${BUTTON_STYLE}">Réinitialiser le mot de passe</a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">
          Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
        </p>
      `),
    }
  }

  return {
    subject: 'Reset your password - Aeroliths',
    html: wrap('Reset your password', `
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hello <strong>${username}</strong>,</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        We received a request to reset your password. Click the button below to choose a new one.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="${BUTTON_STYLE}">Reset Password</a>
      </div>
      <p style="color: #888; font-size: 13px; text-align: center;">
        This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </p>
    `),
  }
}

export function buildDeletionRequestEmail(locale: EmailLocale, username: string, formattedDate: string, appUrl: string): EmailContent {
  if (locale === 'fr') {
    return {
      subject: 'Demande de suppression de compte - Aeroliths',
      html: wrap('Demande de suppression de compte', `
        <p style="color: #555; font-size: 16px; line-height: 1.6;">Bonjour <strong>${username}</strong>,</p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Nous avons bien reçu votre demande de suppression de compte. Si vous ne vous reconnectez pas avant le <strong>${formattedDate}</strong>, votre compte sera définitivement supprimé.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Pour annuler cette demande, reconnectez-vous simplement à votre compte avant cette date.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/login" style="${BUTTON_STYLE}">Se connecter pour annuler</a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">
          Si vous n'êtes pas à l'origine de cette demande, reconnectez-vous immédiatement pour sécuriser votre compte.
        </p>
      `),
    }
  }

  return {
    subject: 'Account deletion request - Aeroliths',
    html: wrap('Account deletion request', `
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hello <strong>${username}</strong>,</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        We have received your account deletion request. If you do not log in before <strong>${formattedDate}</strong>, your account will be permanently deleted.
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        To cancel this request, simply log back into your account before that date.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/login" style="${BUTTON_STYLE}">Log in to cancel</a>
      </div>
      <p style="color: #888; font-size: 13px; text-align: center;">
        If you did not make this request, log in immediately to secure your account.
      </p>
    `),
  }
}

export function buildDeletionReminderEmail(locale: EmailLocale, username: string, formattedDate: string, appUrl: string): EmailContent {
  if (locale === 'fr') {
    return {
      subject: 'Votre compte sera supprimé dans 7 jours - Aeroliths',
      html: wrap('⚠️ Suppression imminente de votre compte', `
        <p style="color: #555; font-size: 16px; line-height: 1.6;">Bonjour <strong>${username}</strong>,</p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Votre compte Aeroliths sera <strong>définitivement supprimé le ${formattedDate}</strong> (dans 7 jours) suite à votre demande de suppression.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Si vous souhaitez conserver votre compte, reconnectez-vous avant cette date pour annuler automatiquement la suppression.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/login" style="${BUTTON_STYLE}">Annuler la suppression</a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">
          Sans action de votre part, votre compte et toutes vos données seront supprimés définitivement.
        </p>
      `),
    }
  }

  return {
    subject: 'Your account will be deleted in 7 days - Aeroliths',
    html: wrap('⚠️ Your account deletion is imminent', `
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hello <strong>${username}</strong>,</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Your Aeroliths account will be <strong>permanently deleted on ${formattedDate}</strong> (in 7 days) following your deletion request.
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        If you'd like to keep your account, log back in before that date to automatically cancel the deletion.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/login" style="${BUTTON_STYLE}">Cancel deletion</a>
      </div>
      <p style="color: #888; font-size: 13px; text-align: center;">
        Without action on your part, your account and all your data will be permanently deleted.
      </p>
    `),
  }
}

export function buildInactivityWarningEmail(
  locale: EmailLocale,
  username: string,
  warningType: WarningType,
  formattedDate: string,
  appUrl: string
): EmailContent {
  const isUrgent = warningType === '1week' || warningType === '1month'

  if (locale === 'fr') {
    const labels: Record<WarningType, string> = { '6months': '6 mois', '2months': '2 mois', '1month': '1 mois', '1week': '7 jours' }
    const subjects: Record<WarningType, string> = {
      '6months': 'Votre compte Aeroliths est inactif depuis 6 mois',
      '2months': 'Votre compte Aeroliths sera supprimé dans 2 mois',
      '1month': 'Votre compte Aeroliths sera supprimé dans 1 mois',
      '1week': 'Votre compte Aeroliths sera supprimé dans 7 jours',
    }
    const bodyMessage = warningType === '6months'
      ? `Votre compte Aeroliths est inactif depuis 6 mois. Conformément à notre politique, les comptes inactifs pendant 3 ans sont supprimés automatiquement.`
      : `Votre compte Aeroliths sera <strong>définitivement supprimé le ${formattedDate}</strong> en raison d'une inactivité prolongée.`

    return {
      subject: subjects[warningType],
      html: wrap(`${isUrgent ? '⚠️ ' : ''}Compte inactif - suppression dans ${labels[warningType]}`, `
        <p style="color: #555; font-size: 16px; line-height: 1.6;">Bonjour <strong>${username}</strong>,</p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">${bodyMessage}</p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">Pour conserver votre compte, il vous suffit de vous connecter.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/login" style="${BUTTON_STYLE}">Me connecter</a>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">
          Si vous ne souhaitez plus utiliser Aeroliths, vous pouvez ignorer cet e-mail. Votre compte sera supprimé automatiquement le ${formattedDate}.
        </p>
      `),
    }
  }

  const labels: Record<WarningType, string> = { '6months': '6 months', '2months': '2 months', '1month': '1 month', '1week': '7 days' }
  const subjects: Record<WarningType, string> = {
    '6months': 'Your Aeroliths account has been inactive for 6 months',
    '2months': 'Your Aeroliths account will be deleted in 2 months',
    '1month': 'Your Aeroliths account will be deleted in 1 month',
    '1week': 'Your Aeroliths account will be deleted in 7 days',
  }
  const bodyMessage = warningType === '6months'
    ? `Your Aeroliths account has been inactive for 6 months. In accordance with our policy, accounts inactive for 3 years are automatically deleted.`
    : `Your Aeroliths account will be <strong>permanently deleted on ${formattedDate}</strong> due to prolonged inactivity.`

  return {
    subject: subjects[warningType],
    html: wrap(`${isUrgent ? '⚠️ ' : ''}Inactive account - deletion in ${labels[warningType]}`, `
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hello <strong>${username}</strong>,</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">${bodyMessage}</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">To keep your account, simply log in.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}/login" style="${BUTTON_STYLE}">Log in</a>
      </div>
      <p style="color: #888; font-size: 13px; text-align: center;">
        If you no longer wish to use Aeroliths, you can ignore this email. Your account will be automatically deleted on ${formattedDate}.
      </p>
    `),
  }
}
