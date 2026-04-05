import { getArangoDb } from '../../utils/arangodb'
import { aql } from 'arangojs'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const playerId = `players/${user.userId}`

  const arangodb = getArangoDb()

  // Requests received (where current user is the target)
  const receivedCursor = await arangodb.query(aql`
    FOR e IN friends
      FILTER e._to == ${playerId} AND e.status == 'pending'
      LET sender = DOCUMENT(e._from)
      RETURN {
        requestId: e._key,
        senderId: sender._key,
        senderUsername: sender.username,
        createdAt: e.createdAt
      }
  `)

  // Requests sent (where current user is the sender)
  const sentCursor = await arangodb.query(aql`
    FOR e IN friends
      FILTER e._from == ${playerId} AND e.status == 'pending'
      LET target = DOCUMENT(e._to)
      RETURN {
        requestId: e._key,
        targetId: target._key,
        targetUsername: target.username,
        createdAt: e.createdAt
      }
  `)

  const received = await receivedCursor.all()
  const sent = await sentCursor.all()

  // Enrich with profile pictures from PostgreSQL
  const allIds = [
    ...received.map((r: any) => r.senderId),
    ...sent.map((r: any) => r.targetId),
  ]
  if (allIds.length > 0) {
    const users = await db.postgres.user.findMany({
      where: { id: { in: allIds } },
      select: { id: true, profilePicture: true },
    })
    const pictureMap = new Map(users.map((u) => [u.id, u.profilePicture]))
    for (const r of received) {
      r.senderProfilePicture = pictureMap.get(r.senderId) || null
    }
    for (const r of sent) {
      r.targetProfilePicture = pictureMap.get(r.targetId) || null
    }
  }

  return { success: true, data: { received, sent } }
})
