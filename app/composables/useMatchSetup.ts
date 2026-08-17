import { ref, computed } from 'vue'
import { handSizeFor } from '~/game/engine/match'
import { generateBoardElements, randomHand, buildDraftPool } from '~/game/engine/setup'
import { toStone, toElementGraph, type LithosRecord, type ElementRecord } from '~/game/engine/adapters'
import type { CaptureRules, ElementGraph, HandRule, Player, Stone } from '~/game/engine/types'

/**
 * The pre-match state: board options, the shared catalog, and the two hands.
 * Everything here describes a match that has not started yet, which is also
 * where any rule about what a player is allowed to bring will belong.
 */
export function useMatchSetup() {
  const loading = ref(true)

  const size = ref(3)
  const rules = ref<CaptureRules>({ same: false, plus: false, combo: false, wall: false })
  const startingChoice = ref<'A' | 'B' | 'random'>('random')
  const elementalCells = ref(false)
  const turnSeconds = ref(0)
  const openHands = ref(false)
  const suddenDeath = ref(false)
  const handRule = ref<HandRule>('none')

  const catalog = ref<Stone[]>([])
  const elements = ref<ElementGraph>({ strongAgainst: {} })
  const hands = ref<Record<Player, Stone[]>>({ A: [], B: [] })

  const elementSprites = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const stone of catalog.value) {
      if (stone.elementId && stone.elementSprite) map[stone.elementId] = stone.elementSprite
    }
    return map
  })

  const cellCount = computed(() => size.value * size.value)

  function handSize(player: Player): number {
    // While the starter is random, size both hands to the larger half so either
    // assignment is valid; hands are trimmed to the real sizes when the game starts.
    if (startingChoice.value === 'random') return Math.ceil(cellCount.value / 2)
    return handSizeFor(size.value, player, startingChoice.value)
  }

  function handFull(player: Player): boolean {
    return hands.value[player].length >= handSize(player)
  }

  const canStart = computed(() => handFull('A') && handFull('B'))

  function addToHand(player: Player, stone: Stone) {
    if (handFull(player)) return
    hands.value[player].push(stone)
  }

  function removeFromHand(player: Player, index: number) {
    hands.value[player].splice(index, 1)
  }

  function autoFill(player: Player) {
    while (!handFull(player) && catalog.value.length > 0) {
      const pick = catalog.value[hands.value[player].length % catalog.value.length]!
      hands.value[player].push(pick)
    }
  }

  /* ---------- Hand modes: Random / Mirror / Draft ---------- */

  function fillRandom() {
    if (catalog.value.length === 0) return
    hands.value.A = randomHand(catalog.value, handSize('A'))
    hands.value.B = randomHand(catalog.value, handSize('B'))
  }

  function fillMirror() {
    if (catalog.value.length === 0) return
    const a = randomHand(catalog.value, handSize('A'))
    hands.value.A = a
    hands.value.B = a.slice(0, handSize('B'))
  }

  const draftActive = ref(false)
  const draftPool = ref<Stone[]>([])
  const draftTurn = ref<Player>('A')

  function startDraft() {
    if (catalog.value.length === 0) return
    hands.value.A = []
    hands.value.B = []
    draftPool.value = buildDraftPool(catalog.value, handSize('A') + handSize('B'))
    draftTurn.value = 'A'
    draftActive.value = true
  }

  function nextDraftTurn() {
    if (handFull('A') && handFull('B')) {
      draftActive.value = false
      return
    }
    const other: Player = draftTurn.value === 'A' ? 'B' : 'A'
    draftTurn.value = handFull(other) ? draftTurn.value : other
  }

  function pickDraft(index: number) {
    if (!draftActive.value || handFull(draftTurn.value)) return
    const [stone] = draftPool.value.splice(index, 1)
    if (stone) hands.value[draftTurn.value].push(stone)
    nextDraftTurn()
  }

  function cancelDraft() {
    draftActive.value = false
    draftPool.value = []
    hands.value.A = []
    hands.value.B = []
  }

  /* ---------- Values the match is built from ---------- */

  function resolveStartingPlayer(): Player {
    if (startingChoice.value === 'random') return Math.random() < 0.5 ? 'A' : 'B'
    return startingChoice.value
  }

  /** A fresh element grid, or undefined when elemental cells are off. */
  function makeBoardElements(): (string | null)[][] | undefined {
    if (!elementalCells.value) return undefined
    return generateBoardElements(size.value, Object.keys(elements.value.strongAgainst))
  }

  async function load() {
    loading.value = true
    try {
      const [lithosRes, elementsRes] = await Promise.all([
        $fetch<{ data: LithosRecord[] }>('/api/lithos'),
        $fetch<{ data: ElementRecord[] }>('/api/elements'),
      ])
      catalog.value = lithosRes.data.map(toStone)
      elements.value = toElementGraph(elementsRes.data)

      // Prefill Player 1 from the saved deck (expanded by quantity).
      try {
        const deckRes = await $fetch<{ data: { entries: { quantity: number; lithos: LithosRecord }[] } }>(
          '/api/deck'
        )
        const fromDeck: Stone[] = []
        for (const entry of deckRes.data.entries) {
          for (let n = 0; n < entry.quantity; n++) fromDeck.push(toStone(entry.lithos))
        }
        hands.value.A = fromDeck.slice(0, handSize('A'))
      } catch {
        // No deck or not logged in: leave Player 1 hand empty.
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    size,
    rules,
    startingChoice,
    elementalCells,
    turnSeconds,
    openHands,
    suddenDeath,
    handRule,
    catalog,
    elements,
    hands,
    elementSprites,
    handSize,
    handFull,
    canStart,
    addToHand,
    removeFromHand,
    autoFill,
    fillRandom,
    fillMirror,
    draftActive,
    draftPool,
    draftTurn,
    startDraft,
    pickDraft,
    cancelDraft,
    resolveStartingPlayer,
    makeBoardElements,
    load,
  }
}
