/**
 * Site-wide constants
 * Centralized configuration for consistent data across the application
 */

export const SITE_INFO = {
  name: 'Aeroliths',
  description: 'A strategic board game inspired by Skylanders Skystones',
  tagline: 'Discover the legendary strategy game inspired by Skylanders Skystones',

  // Social & Contact
  discord: {
    url: 'https://discord.gg/zUSjypxYdR',
    label: 'Join our Discord'
  },

  // Developer Info
  developer: {
    name: 'Enzo Fournier & Julien Behani',
    status: 'Student Project',
    director: 'Enzo Fournier & Julien Behani'
  },

  // Hosting Info
  hosting: {
    provider: 'JrCanDev',
    address: '19 rue Louis David, 62100 Calais, France',
    website: 'https://jrcan.dev'
  },

  // Legal
  copyright: `© ${new Date().getFullYear()} Aeroliths. All rights reserved.`,
  lastUpdated: 'December 2025'
} as const

export const EXTERNAL_LINKS = {
  skylanders: 'https://skylanders.com',
  activision: 'https://www.activision.com'
} as const
