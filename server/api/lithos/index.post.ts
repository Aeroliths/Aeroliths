import type { JWTPayload } from '~~/server/utils/auth';

// API route to create a new lithos (admin only)
export default defineEventHandler(async (event) => {
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

        let spritePath: string

        if (form.mediaId) {
            // Reuse an image already in the library.
            const asset = await db.postgres.mediaAsset.findUnique({
                where: { id: form.mediaId }
            })

            if (!asset) {
                throw createError({
                    statusCode: 404,
                    statusMessage: 'Media asset not found'
                })
            }

            if (asset.category !== 'lithos') {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'This image belongs to another library'
                })
            }

            spritePath = asset.path
        } else if (form.sprite) {
            // Direct upload, also filed in the library so it can be reused later.
            const { asset } = await registerMediaAsset('lithos', form.sprite, user)
            spritePath = asset.path
        } else {
            throw createError({
                statusCode: 400,
                statusMessage: 'Either mediaId or sprite is required'
            })
        }

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

        if (form.isStarter !== undefined) {
            data.isStarter = Boolean(form.isStarter)
        }

        if (form.starterQuantity !== undefined) {
            const starterQuantity = Number(form.starterQuantity)
            if (isNaN(starterQuantity) || starterQuantity < 1) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'starterQuantity must be at least 1'
                })
            }
            data.starterQuantity = starterQuantity
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

        // Re-throw known errors (400, 404, 415) instead of burying them in a 500
        if (error.statusCode) {
            throw error
        }

        console.error('Error creating lithos:', error)

        // An image uploaded before the failure stays in the library. Deleting
        // the file here would leave its MediaAsset row pointing at nothing.

        throw createError({
            statusCode: 500,
            statusMessage: `Error creating lithos: ${error} `
        })
    }
})