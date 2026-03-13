import { getArangoDb } from '../utils/arangodb'

const GRAPH_NAME = 'aeroliths_graph'

const EDGE_DEFINITIONS = [
  { collection: 'friends',      from: ['players'], to: ['players'] },
  { collection: 'participates', from: ['players'], to: ['matchmaking'] },
  { collection: 'has_deck',     from: ['players'], to: ['deck'] },
  { collection: 'has_stats',    from: ['players'], to: ['stats'] },
]

export default defineNitroPlugin(async () => {
  const db = getArangoDb()
  const graph = db.graph(GRAPH_NAME)

  const exists = await graph.exists()
  if (!exists) {
    await graph.create(EDGE_DEFINITIONS)
    console.log(`[ArangoDB] Graph '${GRAPH_NAME}' created`)
  }

  console.log('[ArangoDB] Setup complete')
})
