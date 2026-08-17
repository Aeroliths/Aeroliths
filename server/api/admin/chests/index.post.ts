export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const body = await readBody(event)
    const name = typeof body?.name === 'string' ? body.name.trim() : ''

    if (name.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'A chest type needs a name' })
    }

    const created = await db.postgres.chestType.create({ data: { name } })

    return { success: true, data: { id: created.id, name } }
  } catch (error: any) {
    if (error.statusCode) throw error
    if (error.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'That chest type already exists' })
    }
    console.error('Error creating a chest type:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create the chest type' })
  }
})
