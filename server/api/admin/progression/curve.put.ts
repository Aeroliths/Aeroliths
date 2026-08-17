import { validateCurve, type CurveEntry } from '~~/server/utils/progression'

/**
 * Replaces the whole curve. A curve is only ever valid as a whole, so there is
 * no row-level update: the payload is checked, then swapped in one transaction.
 */
export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const body = await readBody(event)
    const curve = body?.curve

    if (!Array.isArray(curve)) {
      throw createError({ statusCode: 400, statusMessage: 'curve must be a list' })
    }

    const isEntry = (entry: any): entry is CurveEntry =>
      entry && Number.isInteger(entry.level) && Number.isInteger(entry.xpRequired)

    if (!curve.every(isEntry)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Each entry needs an integer level and xpRequired',
      })
    }

    const invalid = validateCurve(curve)
    if (invalid) {
      throw createError({ statusCode: 400, statusMessage: invalid })
    }

    await db.postgres.$transaction(async (tx: any) => {
      await tx.progressionLevel.deleteMany({})
      if (curve.length > 0) {
        await tx.progressionLevel.createMany({
          data: curve.map((entry) => ({ level: entry.level, xpRequired: entry.xpRequired })),
        })
      }
    })

    return { success: true, data: { levels: curve.length } }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error saving the progression curve:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save the curve' })
  }
})
