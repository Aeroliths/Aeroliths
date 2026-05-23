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
  support: {
    email: 'support@aeroliths.fr'
  },

  // Developer Info
  developer: {
    name: 'Enzo Fournier & Julien Behani',
    status: 'Personal Project',
    director: 'Enzo Fournier & Julien Behani'
  },

  // Hosting Info
  hosting: {
    provider: 'IONOS SARL',
    address: '7 place de la Gare, 57200 Sarreguemines, France',
    website: 'https://www.ionos.fr'
  },

  // Legal
  copyright: `© ${new Date().getFullYear()} Aeroliths. All rights reserved.`,
  lastUpdated: 'May 2026'
} as const

export const EXTERNAL_LINKS = {
  skylanders: 'https://skylanders.com',
  activision: 'https://www.activision.com'
} as const
