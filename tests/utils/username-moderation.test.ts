import { describe, it, expect } from 'vitest'

const { validateUsernameContent } = await import('~/server/utils/username-moderation')

describe('validateUsernameContent', () => {
  it('allows clean usernames', () => {
    for (const name of ['CoolDragon', 'Fydyr', 'PlayerOne', 'Aeroliths', 'master_chief']) {
      expect(validateUsernameContent(name)).toBeNull()
    }
  })

  it('does not flag clean names that merely contain profane substrings', () => {
    // Scunthorpe problem: these are legitimate words/names
    for (const name of ['Scunthorpe', 'Matsushita', 'Shasta']) {
      expect(validateUsernameContent(name)).toBeNull()
    }
  })

  it('blocks English profanity', () => {
    for (const name of ['shit', 'fuck', 'bitch']) {
      expect(validateUsernameContent(name)).toMatch(/inappropriate language/)
    }
  })

  it('blocks profanity in other languages', () => {
    // fr: connard/merde, es: mierda, de: scheisse
    for (const name of ['connard', 'merde', 'mierda', 'scheisse']) {
      expect(validateUsernameContent(name)).toMatch(/inappropriate language/)
    }
  })

  it('blocks leetspeak-obfuscated profanity (digit substitutions)', () => {
    // 1->i, 5->s : these only use characters allowed in usernames
    for (const name of ['sh1t', '5hit', 'b1tch']) {
      expect(validateUsernameContent(name)).toMatch(/inappropriate language/)
    }
  })

  it('blocks profanity split by separators', () => {
    for (const name of ['s_h_i_t', 'f-u-c-k', 'Fuck-You']) {
      expect(validateUsernameContent(name)).toMatch(/inappropriate language/)
    }
  })

  it('is case-insensitive', () => {
    expect(validateUsernameContent('SHIT')).toMatch(/inappropriate language/)
    expect(validateUsernameContent('FuCk')).toMatch(/inappropriate language/)
  })
})
