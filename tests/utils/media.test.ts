import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MEDIA_CATEGORIES,
  isMediaCategory,
  parseImageDataUrl,
  hashImage,
  countMediaUsage,
  registerMediaAsset,
} from '~/server/utils/media'
import { createTestAdmin } from '../utils/auth'

// One transparent 1x1 PNG, reused so the same bytes hash to the same value.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const PNG_DATA_URL = `data:image/png;base64,${PNG_BASE64}`

describe('server/utils/media', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isMediaCategory', () => {
    it('accepts the two supported categories', () => {
      expect(MEDIA_CATEGORIES).toEqual(['lithos', 'elements'])
      expect(isMediaCategory('lithos')).toBe(true)
      expect(isMediaCategory('elements')).toBe(true)
    })

    it('rejects anything else', () => {
      expect(isMediaCategory('news')).toBe(false)
      expect(isMediaCategory('profile')).toBe(false)
      expect(isMediaCategory(undefined)).toBe(false)
      expect(isMediaCategory(42)).toBe(false)
    })
  })

  describe('parseImageDataUrl', () => {
    it('splits a base64 image data url into mime type and bytes', () => {
      const parsed = parseImageDataUrl(PNG_DATA_URL)
      expect(parsed?.mimeType).toBe('image/png')
      expect(parsed?.data).toEqual(Buffer.from(PNG_BASE64, 'base64'))
    })

    it('returns null for a plain path', () => {
      expect(parseImageDataUrl('/app/uploads/lithos/lithos-1.png')).toBeNull()
    })

    it('returns null for a malformed data url', () => {
      expect(parseImageDataUrl('data:image/png;base64,')).toBeNull()
      expect(parseImageDataUrl(undefined)).toBeNull()
    })
  })

  describe('hashImage', () => {
    it('is stable for identical bytes', () => {
      const a = hashImage(Buffer.from('same'))
      const b = hashImage(Buffer.from('same'))
      expect(a).toBe(b)
      expect(a).toHaveLength(64)
    })

    it('differs for different bytes', () => {
      expect(hashImage(Buffer.from('a'))).not.toBe(hashImage(Buffer.from('b')))
    })
  })

  describe('countMediaUsage', () => {
    it('sums the lithos and elements referencing the path', async () => {
      global.db.postgres.lithos.count.mockResolvedValue(2)
      global.db.postgres.elements.count.mockResolvedValue(1)

      const count = await countMediaUsage('/app/uploads/lithos/a.png')

      expect(count).toBe(3)
      expect(global.db.postgres.lithos.count).toHaveBeenCalledWith({
        where: { sprite: '/app/uploads/lithos/a.png' },
      })
      expect(global.db.postgres.elements.count).toHaveBeenCalledWith({
        where: { sprite: '/app/uploads/lithos/a.png' },
      })
    })
  })

  describe('registerMediaAsset', () => {
    it('reuses the existing asset when the bytes are already stored', async () => {
      const existing = { id: 'media-1', category: 'lithos', path: '/app/uploads/lithos/a.png' }
      global.db.postgres.mediaAsset.findUnique.mockResolvedValue(existing)

      const result = await registerMediaAsset('lithos', PNG_DATA_URL, createTestAdmin() as any)

      expect(result).toEqual({ asset: existing, reused: true })
      expect(global.upload_image).not.toHaveBeenCalled()
      expect(global.db.postgres.mediaAsset.create).not.toHaveBeenCalled()
    })

    it('uploads and creates the asset when the bytes are new', async () => {
      global.db.postgres.mediaAsset.findUnique.mockResolvedValue(null)
      global.upload_image.mockResolvedValue('/app/uploads/lithos/lithos-1-abc.png')
      global.db.postgres.mediaAsset.create.mockImplementation(({ data }: any) => ({
        id: 'media-2',
        ...data,
      }))

      const result = await registerMediaAsset('lithos', PNG_DATA_URL, createTestAdmin() as any)

      expect(result.reused).toBe(false)
      expect(global.upload_image).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'image/png', DirName: 'lithos' }),
        expect.anything(),
      )
      expect(result.asset).toMatchObject({
        category: 'lithos',
        path: '/app/uploads/lithos/lithos-1-abc.png',
        label: 'lithos-1-abc.png',
        mimeType: 'image/png',
      })
    })

    it('uses the provided label when given', async () => {
      global.db.postgres.mediaAsset.findUnique.mockResolvedValue(null)
      global.upload_image.mockResolvedValue('/app/uploads/elements/elements-1-abc.png')
      global.db.postgres.mediaAsset.create.mockImplementation(({ data }: any) => data)

      const result = await registerMediaAsset(
        'elements',
        PNG_DATA_URL,
        createTestAdmin() as any,
        'Fire crystal',
      )

      expect(result.asset.label).toBe('Fire crystal')
    })

    it('throws a 400 when the image is not a data url', async () => {
      await expect(
        registerMediaAsset('lithos', '/app/uploads/lithos/a.png', createTestAdmin() as any),
      ).rejects.toMatchObject({ statusCode: 400 })
    })
  })
})
