import { getArangoDb } from '../../utils/arangodb'
import { aql } from 'arangojs'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const { targetUsername } = await readBody(event)

  if (!targetUsername || typeof targetUsername !== 'string') {
    throw createError({ statusCode: 400, message: 'Target username is required' })
  }

  if (targetUsername.length > 50) {
    throw createError({ statusCode: 400, message: 'Invalid username' })
  }

  if (targetUsername === user.username) {
    throw createError({ statusCode: 400, message: 'You cannot send a friend request to yourself' })
  }

  // Check target user exists in PostgreSQL
  const targetUser = await db.postgres.user.findUnique({
    where: { username: targetUsername },
  })

  if (!targetUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const arangodb = getArangoDb()
  const players = arangodb.collection('players')
  const friends = arangodb.collection('friends')

  // Ensure both players exist in ArangoDB
  for (const p of [
    { _key: user.userId, username: user.username },
    { _key: String(targetUser.id), username: targetUser.username },
  ]) {
    const exists = await players.documentExists(p._key)
    if (!exists) {
      await players.save(p)
    }
  }

  const fromId = `players/${user.userId}`
  const toId = `players/${targetUser.id}`

  // Check if a relationship already exists (in either direction)
  const existing = await arangodb.query(aql`
    FOR e IN friends
      FILTER (e._from == ${fromId} AND e._to == ${toId})
          OR (e._from == ${toId} AND e._to == ${fromId})
      RETURN e
  `)
  const existingEdge = await existing.next()

  if (existingEdge) {
    if (existingEdge.status === 'accepted') {
      throw createError({ statusCode: 409, message: 'You are already friends' })
    }
    if (existingEdge.status === 'pending') {
      throw createError({ statusCode: 409, message: 'A friend request already exists' })
    }
    if (existingEdge.status === 'blocked') {
      throw createError({ statusCode: 403, message: 'Cannot send friend request' })
    }
  }

  const now = new Date().toISOString()
  await friends.save({
    _from: fromId,
    _to: toId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  })

  return { success: true, message: 'Friend request sent' }
})
