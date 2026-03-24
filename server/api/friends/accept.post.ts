import { getArangoDb } from '../../utils/arangodb'
import { aql } from 'arangojs'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const { requestId } = await readBody(event)

  if (!requestId || typeof requestId !== 'string') {
    throw createError({ statusCode: 400, message: 'Request ID is required' })
  }

  if (!/^[a-zA-Z0-9_\-]+$/.test(requestId)) {
    throw createError({ statusCode: 400, message: 'Invalid request ID format' })
  }

  const arangodb = getArangoDb()
  const friends = arangodb.collection('friends')

  // Get the friend request
  let edge
  try {
    edge = await friends.document(requestId)
  } catch {
    throw createError({ statusCode: 404, message: 'Friend request not found' })
  }

  // Only the recipient can accept
  if (edge._to !== `players/${user.userId}`) {
    throw createError({ statusCode: 403, message: 'You can only accept requests sent to you' })
  }

  if (edge.status !== 'pending') {
    throw createError({ statusCode: 400, message: 'This request is no longer pending' })
  }

  await friends.update(requestId, {
    status: 'accepted',
    updatedAt: new Date().toISOString(),
  })

  return { success: true, message: 'Friend request accepted' }
})
