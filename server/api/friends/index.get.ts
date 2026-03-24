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

  return { success: true, data: friends }
})
