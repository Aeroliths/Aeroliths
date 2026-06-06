import BadWordsNext from 'bad-words-next'
import en from 'bad-words-next/lib/en'
import fr from 'bad-words-next/lib/fr'
import es from 'bad-words-next/lib/es'
import de from 'bad-words-next/lib/de'
import pl from 'bad-words-next/lib/pl'
import ru from 'bad-words-next/lib/ru'
import ruLat from 'bad-words-next/lib/ru_lat'
import ua from 'bad-words-next/lib/ua'
import ch from 'bad-words-next/lib/ch'

// Single multilingual filter instance, built once per server process.
// bad-words-next bundles dictionaries for several languages and handles
// unicode look-alikes (confusables) out of the box.
const filter = new BadWordsNext({ data: en })
for (const dictionary of [fr, es, de, pl, ru, ruLat, ua, ch]) {
  filter.add(dictionary)
}

/**
 * Normalize common "leetspeak" digit/symbol substitutions back to letters
 * (e.g. "sh1t" -> "shit", "f@g" -> "fag") so obfuscated usernames are still
 * caught. bad-words-next handles confusable letters but not digit swaps.
 */
function leetNormalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/8/g, 'b')
    .replace(/3/g, 'e')
    .replace(/[6]/g, 'g')
    .replace(/[1!|]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/7/g, 't')
}

/**
 * Check a username against the multilingual profanity wordlist.
 *
 * The username is checked as-is, with leetspeak normalized, and with
 * separators stripped, so variants like "sh1t", "s_h_i_t" or "shit-head"
 * are all caught.
 *
 * Returns null if the username is clean, or a user-facing error message.
 */
export function validateUsernameContent(username: string): string | null {
  const lower = username.toLowerCase()
  const stripped = lower.replace(/[_\-.]/g, '')

  const variants = new Set<string>([
    lower,
    stripped,
    leetNormalize(lower),
    leetNormalize(stripped),
  ])

  for (const variant of variants) {
    if (variant && filter.check(variant)) {
      return 'This username contains inappropriate language. Please choose another.'
    }
  }

  return null
}
