export interface LootCandidate {
  lithosId: string
  weight: number
}

/**
 * Picks one entry, each entry's chance being its share of the total weight.
 *
 * Weights are relative rather than percentages, so a table stays balanced when
 * a line is added. Returns null when nothing can be drawn, which the caller
 * must treat as a refusal rather than as an empty reward.
 */
export function drawLoot(entries: LootCandidate[], rng: () => number = Math.random): string | null {
  const usable = entries.filter((entry) => entry.weight > 0)
  if (usable.length === 0) return null

  const total = usable.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = rng() * total

  for (const entry of usable) {
    roll -= entry.weight
    if (roll < 0) return entry.lithosId
  }

  // Reached only when the generator returns exactly 1, or through floating
  // point drift. Falling back to the last entry keeps the function total.
  return usable[usable.length - 1]!.lithosId
}
