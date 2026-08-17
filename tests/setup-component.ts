import { vi } from 'vitest'
import { ref } from 'vue'
import { config } from '@vue/test-utils'

// Nuxt auto-imports these in the app. Under Vitest the components resolve them
// from the global scope instead, so the harness has to provide them.

// The translation stub echoes the key back: component tests assert on
// behaviour, not on wording, and the i18n parity suite already covers the
// catalogue itself.
const translate = (key: string) => key

global.useI18n = () => ({ t: translate, locale: ref('en') })
config.global.mocks = { $t: translate }

// Every test that mounts a component fetching data sets its own responses.
global.$fetch = vi.fn()
