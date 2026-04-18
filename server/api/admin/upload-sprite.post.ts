import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// API route to upload images (admin only for lithos/elements, authenticated for profile)
export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated (checks both Authorization header and cookie)
    const user = getAuthUser(event)

    // Get the upload type from query parameter (lithos, elements, or profile)
    const query = getQuery(event)
    const uploadType = (query.type as string) || 'lithos'

    // Validate upload type
    const validTypes = ['lithos', 'elements', 'profile']
    if (!validTypes.includes(uploadType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid upload type. Must be: lithos, elements, or profile',
      })
    }

    // Verify user has admin role for lithos and elements uploads
    if (uploadType === 'lithos' || uploadType === 'elements') {
      requireRole(user, ['admin'])
    }

    // Get the uploaded file
    const form = await readMultipartFormData(event)

    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded',
      })
    }

    const file = form[0]!

    if (!file.filename || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file data',
      })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File size exceeds the 5MB limit',
      })
    }

    // Validate file type (only images) — check both MIME type and magic bytes
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type || '')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only image files are allowed (PNG, JPG, GIF, WEBP)',
      })
    }

    // Validate magic bytes to prevent MIME type spoofing
    const magicBytes: Record<string, number[]> = {
      'image/png':  [0x89, 0x50, 0x4E, 0x47],
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/jpg':  [0xFF, 0xD8, 0xFF],
      'image/gif':  [0x47, 0x49, 0x46, 0x38],
      'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header (WEBP)
    }
    const signature = magicBytes[file.type || '']
    const isValidMagic = signature?.every((byte, i) => file.data[i] === byte)
    if (!isValidMagic) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File content does not match the declared image type',
      })
    }

    // Determine the subdirectory based on upload type
    const subDir = uploadType === 'lithos' ? 'lithos' :
                   uploadType === 'elements' ? 'elements' :
                   'profile_pictures'

    // Generate unique filename with safe extension
    const timestamp = Date.now()
    const mimeToExt: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
    }
    const ext = mimeToExt[file.type || ''] || 'png'
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const filename = uploadType === 'profile'
      ? `profile-${user.userId}-${timestamp}-${randomSuffix}.${ext}`
      : `${uploadType}-${timestamp}-${randomSuffix}.${ext}`

    // Define the upload directory — use /app/uploads in prod, public/ in dev
    const uploadsBase = join(process.cwd(), 'uploads')
    const uploadDir = join(uploadsBase, subDir)

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Write file to disk (verify resolved path stays within upload directory)
    const filePath = join(uploadDir, filename)
    if (!filePath.startsWith(uploadDir)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file path',
      })
    }
    await writeFile(filePath, file.data)

    // Return the URL path served via /app/uploads/
    const publicPath = `/app/uploads/${subDir}/${filename}`

    return {
      success: true,
      message: `${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} image uploaded successfully`,
      data: {
        filename,
        path: publicPath,
      },
    }
  } catch (error: any) {
    // Re-throw authentication/authorization errors
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    // Re-throw known errors
    if (error.statusCode) {
      throw error
    }

    console.error('Error uploading sprite:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error uploading sprite',
    })
  }
})
