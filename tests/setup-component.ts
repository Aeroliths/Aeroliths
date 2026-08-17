import { vi } from 'vitest'
import { ref } from 'vue'
import { config } from '@vue/test-utils'

// Nuxt auto-imports these in the app. Under Vitest the components resolve them
// from the global scope instead, so the harness has to provide them.

// The translation stub echoes the key back, plus any interpolation values:
// component tests assert on behaviour rather than wording, but they still need
// to see what was passed into a message. The i18n parity suite covers the
// catalogue itself.
const translate = (key: string, params?: Record<string, unknown>) =>
  params ? `${key} ${JSON.stringify(params)}` : key

global.useI18n = () => ({ t: translate, locale: ref('en') })
config.global.mocks = { $t: translate }

// Every test that mounts a component fetching data sets its own responses.
global.$fetch = vi.fn()
