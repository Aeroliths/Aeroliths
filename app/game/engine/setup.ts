import type { Stone } from './types'

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!
}

/** A `size x size` grid with `count` random elements on distinct cells.
 *  `count` defaults to a random integer in [1, floor(cells/2)]. */
export function generateBoardElements(
  size: number,
  elementIds: string[],
  count?: number,
  rng: () => number = Math.random,
): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  )
  if (elementIds.length === 0) return grid

  const cells = size * size
  const n = Math.min(count ?? 1 + Math.floor(rng() * Math.floor(cells / 2)), cells)

  // Distinct cell indices via partial Fisher-Yates.
  const indices = Array.from({ length: cells }, (_, i) => i)
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (cells - i))
    ;[indices[i], indices[j]] = [indices[j]!, indices[i]!]
    const idx = indices[i]!
    grid[Math.floor(idx / size)]![idx % size] = pick(elementIds, rng)
  }
  return grid
}

/** `size` stones drawn from the catalog (with repetition when needed). */
export function randomHand(catalog: Stone[], size: number, rng: () => number = Math.random): Stone[] {
  const hand: Stone[] = []
  for (let i = 0; i < size; i++) hand.push(pick(catalog, rng))
  return hand
}

/** `total` distinct stones drawn from the catalog (repetition only if too small). */
export function buildDraftPool(catalog: Stone[], total: number, rng: () => number = Math.random): Stone[] {
  if (catalog.length >= total) {
    const copy = [...catalog]
    const pool: Stone[] = []
    for (let i = 0; i < total; i++) {
      const idx = Math.floor(rng() * copy.length)
      pool.push(copy.splice(idx, 1)[0]!)
    }
    return pool
  }
  return randomHand(catalog, total, rng)
}
