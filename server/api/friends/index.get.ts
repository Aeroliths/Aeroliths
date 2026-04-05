import { getArangoDb } from '../../utils/arangodb'
import { aql } from 'arangojs'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const playerId = `players/${user.userId}`

  const arangodb = getArangoDb()

  const cursor = await arangodb.query(aql`
    FOR e IN friends
      FILTER (e._from == ${playerId} OR e._to == ${playerId})
         AND e.status == 'accepted'
      LET friendId = e._from == ${playerId} ? e._to : e._from
      LET friend = DOCUMENT(friendId)
      RETURN {
        edgeId: e._key,
        friendId: friend._key,
        username: friend.username,
        since: e.updatedAt
      }
  `)

  const friends = await cursor.all()

  // Enrich with profile pictures from PostgreSQL
  const friendIds = friends.map((f: any) => f.friendId)
  if (friendIds.length > 0) {
    const users = await db.postgres.user.findMany({
      where: { id: { in: friendIds } },
      select: { id: true, profilePicture: true },
    })
    const pictureMap = new Map(users.map((u) => [u.id, u.profilePicture]))
    for (const friend of friends) {
      friend.profilePicture = pictureMap.get(friend.friendId) || null
    }
  }

  return { success: true, data: friends }
})
