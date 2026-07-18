import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LOCALES_DIR = resolve(__dirname, '../../app/i18n/locales')

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, path)
    }
    return [path]
  })
}

const namespaceFiles = readdirSync(resolve(LOCALES_DIR, 'en')).filter((f) => f.endsWith('.json'))

describe('translation key parity', () => {
  it.each(namespaceFiles)('en/%s and fr/%s expose the same keys', (filename) => {
    const en = JSON.parse(readFileSync(resolve(LOCALES_DIR, 'en', filename), 'utf-8'))
    const fr = JSON.parse(readFileSync(resolve(LOCALES_DIR, 'fr', filename), 'utf-8'))

    const enKeys = flattenKeys(en).sort()
    const frKeys = flattenKeys(fr).sort()

    const missingInFr = enKeys.filter((k) => !frKeys.includes(k))
    const missingInEn = frKeys.filter((k) => !enKeys.includes(k))

    expect(missingInFr, `keys missing in fr/${filename}`).toEqual([])
    expect(missingInEn, `keys missing in en/${filename}`).toEqual([])
  })
})
