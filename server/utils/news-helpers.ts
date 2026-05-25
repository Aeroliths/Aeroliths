// server/utils/news-helpers.ts
import DOMPurify from 'isomorphic-dompurify'

export const slugify = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const ensureUniqueSlug = async (base: string, excludeId?: string): Promise<string> => {
  const safeBase = base || 'news'
  let candidate = safeBase
  let suffix = 2
  while (true) {
    const existing = await db.postgres.news.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === excludeId) return candidate
    candidate = `${safeBase}-${suffix++}`
  }
}

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4',
    'ul', 'ol', 'li',
    'blockquote',
    'a', 'img',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title'],
  ALLOW_DATA_ATTR: false,
}

export const sanitizeNewsContent = (html: string): string => {
  if (typeof html !== 'string') return ''
  return DOMPurify.sanitize(html, SANITIZE_OPTIONS)
}
