// ArangoDB graph schemas (TypeScript interfaces)
//
// Graph: aeroliths_graph
//
// Vertices:  players, matchmaking, deck, stats
// Edges:     friends      (players → players)
//            participates (players → matchmaking)
//            has_deck     (players → deck)
//            has_stats    (players → stats)

// --- Vertex: players ---
// Mirror of the PostgreSQL user — _key = PostgreSQL user ID
export interface PlayerVertex {
  _key: string   // PostgreSQL user ID
  username: string
}

// --- Vertex: matchmaking ---
export interface MatchmakingVertex {
  _key?: string
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
  startedAt?: string
  endedAt?: string
  winnerId?: string  // players/_key of the winner
}

// --- Vertex: deck ---
export interface DeckVertex {
  _key?: string
  name: string
  lithosIds: string[]  // Lithos IDs from PostgreSQL
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// --- Vertex: stats ---
export interface StatsVertex {
  _key?: string
  wins: number
  losses: number
  draws: number
  totalGames: number
  winRate: number      // 0–100
  currentStreak: number
  bestStreak: number
  updatedAt: string
}

// --- Edge: friends (players → players) ---
export interface FriendEdge {
  _key?: string
  _from: string  // players/<id>
  _to: string    // players/<id>
  status: 'pending' | 'accepted' | 'blocked'
  createdAt: string
  updatedAt: string
}

// --- Edge: participates (players → matchmaking) ---
export interface ParticipatesEdge {
  _key?: string
  _from: string  // players/<id>
  _to: string    // matchmaking/<id>
}

// --- Edge: has_deck (players → deck) ---
export interface HasDeckEdge {
  _key?: string
  _from: string  // players/<id>
  _to: string    // deck/<id>
}

// --- Edge: has_stats (players → stats) ---
export interface HasStatsEdge {
  _key?: string
  _from: string  // players/<id>
  _to: string    // stats/<id>
}
