// Shared helpers for the admin media library.
import { createHash } from 'node:crypto'

export const MEDIA_CATEGORIES = ['lithos', 'elements'] as const
export type MediaCategory = (typeof MEDIA_CATEGORIES)[number]

export interface ParsedImage {
  mimeType: string
  data: Buffer
}

export const isMediaCategory = (value: unknown): value is MediaCategory =>
  typeof value === 'string' && (MEDIA_CATEGORIES as readonly string[]).includes(value)

// Splits a "data:image/png;base64,..." string into its mime type and bytes.
// Returns null when the value is not a base64 image data url.
export const parseImageDataUrl = (value: unknown): ParsedImage | null => {
  if (typeof value !== 'string' || !value.startsWith('data:image/')) return null

  const matches = value.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!matches || !matches[1] || !matches[2]) return null

  return { mimeType: matches[1], data: Buffer.from(matches[2], 'base64') }
}

export const hashImage = (data: Buffer): string =>
  createHash('sha256').update(data).digest('hex')

// Lithos and elements are both counted, so an image filed under one category is
// never reported as unused because the other category still references it.
export const countMediaUsage = async (path: string): Promise<number> => {
  const [lithosCount, elementsCount] = await Promise.all([
    db.postgres.lithos.count({ where: { sprite: path } }),
    db.postgres.elements.count({ where: { sprite: path } }),
  ])

  return lithosCount + elementsCount
}

// Stores a base64 image in the library, or returns the entry that already holds
// those exact bytes in that category.
export const registerMediaAsset = async (
  category: MediaCategory,
  image: unknown,
  user: globalThis.JWTPayload,
  label?: string,
): Promise<{ asset: any; reused: boolean }> => {
  const parsed = parseImageDataUrl(image)
  if (!parsed) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or missing image',
    })
  }

  const hash = hashImage(parsed.data)

  const existing = await db.postgres.mediaAsset.findUnique({
    where: { category_hash: { category, hash } },
  })
  if (existing) {
    return { asset: existing, reused: true }
  }

  // upload_image keeps the size limit, mime allow-list and magic byte checks.
  const path = await upload_image(
    {
      filename: 'upload',
      type: parsed.mimeType,
      data: parsed.data,
      DirName: category,
    },
    user,
  )

  const asset = await db.postgres.mediaAsset.create({
    data: {
      category,
      path,
      label: label || path.split('/').pop() || path,
      hash,
      mimeType: parsed.mimeType,
      size: parsed.data.length,
    },
  })

  return { asset, reused: false }
}
