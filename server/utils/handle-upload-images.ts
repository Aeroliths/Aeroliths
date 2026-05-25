// server/utils/handle-upload-images.ts
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

export const upload_image = async (fileField: any | undefined, user: globalThis.JWTPayload) => {
  if (!fileField || !fileField.filename) {
    throw createError({ statusCode: 400, statusMessage: 'Image is required' })
  }

  if (!fileField || !fileField.DirName) {
    throw createError({ statusCode: 400, statusMessage: 'Directory name is required' })
  }

  // Validate upload type
  const validTypes = ['lithos', 'elements', 'profile', 'news']
  if (!validTypes.includes(fileField.DirName)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid upload type. Must be: lithos, elements, profile, or news',
    })
  }

  // Verify user has admin role for lithos, elements and news uploads
  if (fileField.DirName === 'lithos' || fileField.DirName === 'elements' || fileField.DirName === 'news') {
    requireRole(user, ['admin'])
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (fileField.data.length > maxSize) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File size exceeds the 5MB limit',
    })
  }

  // File Validation
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
  if (!ALLOWED_TYPES.includes(fileField.type || '')) {
    throw createError({ statusCode: 415, statusMessage: 'Invalid file type.' })
  }

  // Validate magic bytes to prevent MIME type spoofing
  const magicBytes: Record<string, number[]> = {
    'image/png':  [0x89, 0x50, 0x4E, 0x47],
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/jpg':  [0xFF, 0xD8, 0xFF],
    'image/gif':  [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header (WEBP)
  }
  const signature = magicBytes[fileField.type || '']
  const isValidMagic = signature?.every((byte, i) => fileField.data[i] === byte)
  if (!isValidMagic) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File content does not match the declared image type',
    })
  }

  // Generate safe name and paths
  const timestamp = Date.now()
  const mimeToExt: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
  }
  const ext = mimeToExt[fileField.type || ''] || 'png'
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const filename = fileField.DirName === 'profile'
    ? `profile-${user.userId}-${timestamp}-${randomSuffix}.${ext}`
    : `${fileField.DirName}-${timestamp}-${randomSuffix}.${ext}`
  
  const uploadDir = join(process.cwd(), 'uploads', fileField.DirName)
  const filePath = join(uploadDir, filename)

  // Ensure directory exists
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  // Write file to disk (verify resolved path stays within upload directory)
  if (!filePath.startsWith(uploadDir)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file path',
    })
  }
  
  await writeFile(filePath, fileField.data)

  // Return the API path that will be saved to the database
  const publicPath = `/app/uploads/${fileField.DirName}/${filename}`
  return publicPath
}

export const delete_image = async (imagePath: string, user: globalThis.JWTPayload) => {
  // Validate image path
  if (!imagePath) {
    throw createError({ statusCode: 400, statusMessage: 'Image path is required' })
  }

  // Extract directory and filename from path
  const pathParts = imagePath.split('/')
  if (pathParts.length < 3) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image path' })
  }

  const dirName : string = typeof pathParts[3] === 'string' ? pathParts[3] : '' // lithos, elements, or profile
  const fileName : string = typeof pathParts[4] === 'string' ? pathParts[4] : ''

  // Validate upload type
  const validTypes = ['lithos', 'elements', 'profile', 'news']
  if (!validTypes.includes(dirName)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid upload type. Must be: lithos, elements, profile, or news : ' + pathParts[3],
    })
  }

  // Verify user has admin role for lithos, elements and news uploads
  if (dirName === 'lithos' || dirName === 'elements' || dirName === 'news') {
    requireRole(user, ['admin'])
  }

  // Construct full file path
  const uploadDir = join(process.cwd(), 'uploads', dirName)
  const filePath = join(uploadDir, fileName)

  // Verify file path stays within upload directory (security check)
  if (!filePath.startsWith(uploadDir)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid file path',
    })
  }

  // Check if file exists before attempting to delete
  if (!existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image file not found',
    })
  }

  // Delete the file
  await unlink(filePath)
}
