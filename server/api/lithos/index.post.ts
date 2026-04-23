import { JWTPayload } from '~~/server/utils/auth';

// API route to create a new lithos (admin only)
export default defineEventHandler(async (event) => {
    let uploadedImagePath: string | undefined;
    let user: JWTPayload | undefined;
    try {
        // Verify user is authenticated
        user = getAuthUser(event)

        // Verify user has admin role
        requireRole(user, ['admin'])

        // Get the uploaded file
        const form = await readBody(event)

        if (!form) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid request body',
            })
        }

        // Process the Base64 sprite string into a file object structure
        let fileField: any = null
        if (typeof form.sprite === 'string' && form.sprite.startsWith('data:image/')) {
            const matches = form.sprite.match(/^data:(image\/\w+);base64,(.+)$/)
            if (matches) {
                fileField = {
                    filename: 'upload', // Dummy name; handle-upload-images generates its own
                    type: matches[1],
                    data: Buffer.from(matches[2], 'base64'),
                    DirName: form.folder || 'lithos'
                }
            }
        }

        if (!fileField || !fileField.filename) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid or missing sprite image',
            })
        }

        // Validate file type
        const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
        if (!ALLOWED_TYPES.includes(fileField.type || '')) {
            throw createError({ statusCode: 415, statusMessage: 'Invalid file type.' })
        }

        // Upload the image using the utility function
        const spritePath = await upload_image(fileField, user)
        uploadedImagePath = spritePath

        // Validate required fields
        if (!form.name || !spritePath || !form.rarity) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Fields name, sprite and rarity are required'
            })
        }

        // Validate spike values (must be numbers)
        const spikeLeft = Number(form.spikeLeft) || 0
        const spikeRight = Number(form.spikeRight) || 0
        const spikeUp = Number(form.spikeUp) || 0
        const spikeDown = Number(form.spikeDown) || 0

        if (spikeLeft < 0 || spikeRight < 0 || spikeUp < 0 || spikeDown < 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Spike values must be positive'
            })
        }

        // Prepare data for creation using the desired structure
        const data: any = {
            name: form.name,
            sprite: spritePath,
            rarity: form.rarity,
            spikeLeft,
            spikeRight,
            spikeUp,
            spikeDown,
        }

        // Add elementId if provided (optional)
        if (form.elementId) {
            data.elementId = form.elementId
        }

        // Create the lithos
        const lithos = await db.postgres.lithos.create({
            data
        })

        return {
            success: true,
            message: 'Lithos created successfully',
            data: lithos
        }
    } catch (error: any) {
        // Handle unique constraint error (lithos with same name already exists)
        if (error.code === 'P2002') {
            throw createError({
                statusCode: 409,
                statusMessage: 'A lithos with this name already exists'
            })
        }

        // Re-throw authentication/authorization errors
        if (error.statusCode === 401 || error.statusCode === 403) {
            throw error
        }

        console.error('Error creating lithos:', error)
        
        // If we have an uploaded image path, delete it
        if (uploadedImagePath) {
            try {
                await delete_image(uploadedImagePath, user)
            } catch (deleteError) {
                console.error('Error deleting uploaded image:', deleteError)
            }
        }

        throw createError({
            statusCode: 500,
            statusMessage: `Error creating lithos: ${error} `
        })
    }
})