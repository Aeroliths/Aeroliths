import { getArangoDb } from '../../utils/arangodb'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Friend ID is required' })
  }

  if (!/^[a-zA-Z0-9_\-]+$/.test(id)) {
    throw createError({ statusCode: 400, message: 'Invalid ID format' })
  }

  const arangodb = getArangoDb()
  const friends = arangodb.collection('friends')

  let edge
  try {
    edge = await friends.document(id)
  } catch {
    throw createError({ statusCode: 404, message: 'Friendship not found' })
  }

  const playerId = `players/${user.userId}`

  // Only participants can remove the friendship
  if (edge._from !== playerId && edge._to !== playerId) {
    throw createError({ statusCode: 403, message: 'You are not part of this friendship' })
  }

  await friends.remove(id)

  return { success: true, message: 'Friend removed' }
})
