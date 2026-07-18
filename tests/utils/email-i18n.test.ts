import { describe, it, expect } from 'vitest'
import {
  buildVerificationEmail,
  buildPasswordResetEmail,
  buildDeletionRequestEmail,
  buildDeletionReminderEmail,
  buildInactivityWarningEmail,
} from '~/server/utils/email-i18n'

describe('email-i18n templates', () => {
  it('buildVerificationEmail: en subject and content', () => {
    const { subject, html } = buildVerificationEmail('en', 'https://aeroliths.fr/verify-email?token=abc')
    expect(subject).toBe('Verify your email - Aeroliths')
    expect(html).toContain('Verify your email address')
    expect(html).toContain('https://aeroliths.fr/verify-email?token=abc')
  })

  it('buildVerificationEmail: fr subject and content', () => {
    const { subject, html } = buildVerificationEmail('fr', 'https://aeroliths.fr/verify-email?token=abc')
    expect(subject).toBe('Vérifiez votre email - Aeroliths')
    expect(html).toContain('Vérifiez votre adresse email')
  })

  it('buildPasswordResetEmail: en includes username and reset link', () => {
    const { subject, html } = buildPasswordResetEmail('en', 'Alice', 'https://aeroliths.fr/reset-password?token=xyz')
    expect(subject).toBe('Reset your password - Aeroliths')
    expect(html).toContain('Alice')
    expect(html).toContain('https://aeroliths.fr/reset-password?token=xyz')
  })

  it('buildPasswordResetEmail: fr includes username and reset link', () => {
    const { subject, html } = buildPasswordResetEmail('fr', 'Alice', 'https://aeroliths.fr/reset-password?token=xyz')
    expect(subject).toBe('Réinitialisez votre mot de passe - Aeroliths')
    expect(html).toContain('Alice')
  })

  it('buildDeletionRequestEmail: en includes username, date and login link', () => {
    const { subject, html } = buildDeletionRequestEmail('en', 'Bob', 'January 1, 2027', 'https://aeroliths.fr')
    expect(subject).toBe('Account deletion request - Aeroliths')
    expect(html).toContain('Bob')
    expect(html).toContain('January 1, 2027')
    expect(html).toContain('https://aeroliths.fr/login')
  })

  it('buildDeletionRequestEmail: fr includes username, date and login link', () => {
    const { subject, html } = buildDeletionRequestEmail('fr', 'Bob', '1 janvier 2027', 'https://aeroliths.fr')
    expect(subject).toBe('Demande de suppression de compte - Aeroliths')
    expect(html).toContain('Bob')
    expect(html).toContain('1 janvier 2027')
  })

  it('buildDeletionReminderEmail: en subject and content', () => {
    const { subject, html } = buildDeletionReminderEmail('en', 'Carol', 'January 8, 2027', 'https://aeroliths.fr')
    expect(subject).toBe('Your account will be deleted in 7 days - Aeroliths')
    expect(html).toContain('Carol')
    expect(html).toContain('January 8, 2027')
  })

  it('buildDeletionReminderEmail: fr subject and content', () => {
    const { subject, html } = buildDeletionReminderEmail('fr', 'Carol', '8 janvier 2027', 'https://aeroliths.fr')
    expect(subject).toBe('Votre compte sera supprimé dans 7 jours - Aeroliths')
    expect(html).toContain('Carol')
  })

  it.each(['6months', '2months', '1month', '1week'] as const)(
    'buildInactivityWarningEmail: en subject for %s',
    (warningType) => {
      const { subject } = buildInactivityWarningEmail('en', 'Dave', warningType, 'March 1, 2027', 'https://aeroliths.fr')
      expect(subject).toContain('Aeroliths')
      expect(subject.toLowerCase()).not.toContain('compte') // sanity: not French
    }
  )

  it.each(['6months', '2months', '1month', '1week'] as const)(
    'buildInactivityWarningEmail: fr subject for %s',
    (warningType) => {
      const { subject } = buildInactivityWarningEmail('fr', 'Dave', warningType, '1 mars 2027', 'https://aeroliths.fr')
      expect(subject).toContain('Aeroliths')
      expect(subject.toLowerCase()).toContain('compte')
    }
  )

  it('buildInactivityWarningEmail: 6months uses the inactivity message, not the deletion-date message', () => {
    const { html } = buildInactivityWarningEmail('en', 'Dave', '6months', 'March 1, 2027', 'https://aeroliths.fr')
    expect(html).toContain('inactive for 6 months')
  })
})
