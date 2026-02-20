import { getArangoDb } from '../utils/arangodb'

// Collections to create if they don't exist yet.
// Add new collection names here as the app grows.
const COLLECTIONS: string[] = [
  // e.g. 'game_sessions', 'player_stats'
]

export default defineNitroPlugin(async () => {
  if (COLLECTIONS.length === 0) return

  const db = getArangoDb()

  for (const name of COLLECTIONS) {
    const collection = db.collection(name)
    const exists = await collection.exists()
    if (!exists) {
      await collection.create()
      console.log(`[ArangoDB] Collection '${name}' created`)
    }
  }

  console.log('[ArangoDB] Setup complete')
})
