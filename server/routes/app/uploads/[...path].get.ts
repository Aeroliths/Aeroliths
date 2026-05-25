import { join } from 'path'
import { createReadStream, existsSync, statSync } from 'fs'
import { sendStream, setHeader, createError } from 'h3'

// Serve uploaded files at /app/uploads/<dir>/<file> - matches the path stored in DB by handle-upload-images.ts
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')

  if (!path) {
    throw createError({ statusCode: 400, statusMessage: 'Path is required' })
  }

  if (!/^[a-zA-Z0-9_\-/.]+$/.test(path)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' })
  }

  const allowedDirs = ['lithos', 'elements', 'profile', 'profile_pictures', 'news']
  const firstSegment = path.split('/')[0]
  if (!firstSegment || !allowedDirs.includes(firstSegment)) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  const uploadsBase = join(process.cwd(), 'uploads')
  let filePath = join(uploadsBase, path)

  if (!filePath.startsWith(uploadsBase)) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  // Fallback to public/ if not found in uploads/ (dev compatibility)
  if (!existsSync(filePath)) {
    const publicBase = join(process.cwd(), 'public')
    const publicPath = join(publicBase, path)
    if (publicPath.startsWith(publicBase) && existsSync(publicPath)) {
      filePath = publicPath
    } else {
      throw createError({ statusCode: 404, statusMessage: 'File not found' })
    }
  }

  const stat = statSync(filePath)
  if (!stat.isFile()) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const ext = filePath.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  }
  const contentType = mimeTypes[ext || ''] || 'application/octet-stream'

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'Content-Length', stat.size)

  return sendStream(event, createReadStream(filePath))
})
