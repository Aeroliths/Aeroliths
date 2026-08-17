import { ref, computed, watch } from 'vue'
import { handSizeFor } from '~/game/engine/match'
import type { BotDifficulty } from '~/game/bot'
import { generateBoardElements, buildDraftPool } from '~/game/engine/setup'
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
  const opponentKind = ref<'human' | 'bot'>('human')
  const botDifficulty = ref<BotDifficulty>('easy')

  const catalog = ref<Stone[]>([])
  const elements = ref<ElementGraph>({ strongAgainst: {} })
  const hands = ref<Record<Player, Stone[]>>({ A: [], B: [] })

  /** How many copies of each owned lithos the player holds, by lithos id. */
  const owned = ref<Record<string, number>>({})

  function ownedCount(stone: Stone): number {
    return owned.value[stone.id] ?? 0
  }

  /**
   * The collection expanded to one entry per copy. Drawing without repetition
   * from this list can never hand out more copies than are owned.
   */
  const expandedPool = computed<Stone[]>(() => {
    const pool: Stone[] = []
    for (const stone of catalog.value) {
      for (let copy = 0; copy < ownedCount(stone); copy++) pool.push(stone)
    }
    return pool
  })

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

  /**
   * True when the collection cannot fill a hand of the chosen size. Surfaced
   * rather than left to disable the start button silently: a dead button with
   * no explanation reads as a bug, not as a rule.
   */
  const collectionTooSmall = computed(
    () => expandedPool.value.length < Math.max(handSize('A'), handSize('B')),
  )

  function countInHand(player: Player, stone: Stone): number {
    return hands.value[player].filter((held) => held.id === stone.id).length
  }

  /** Ownership caps a hand; it does not drain a pool shared between the two. */
  function canAdd(player: Player, stone: Stone): boolean {
    if (handFull(player)) return false
    return countInHand(player, stone) < ownedCount(stone)
  }

  function addToHand(player: Player, stone: Stone) {
    if (!canAdd(player, stone)) return
    hands.value[player].push(stone)
  }

  function removeFromHand(player: Player, index: number) {
    hands.value[player].splice(index, 1)
  }

  function autoFill(player: Player) {
    // Stops as soon as a whole pass adds nothing, so a collection too small for
    // the hand ends the loop instead of spinning forever.
    let added = true
    while (added && !handFull(player)) {
      added = false
      for (const stone of catalog.value) {
        if (!canAdd(player, stone)) continue
        hands.value[player].push(stone)
        added = true
        if (handFull(player)) break
      }
    }
  }

  // The bot's column fills itself: nobody should have to build their own
  // opponent's hand. It stays editable, and clearing it does not refill it,
  // since only the opponent kind and the catalog arriving trigger this.
  watch(
    [opponentKind, catalog],
    ([kind]) => {
      if (kind === 'bot' && catalog.value.length > 0 && !handFull('B')) autoFill('B')
    },
    { immediate: true },
  )

  /* ---------- Hand modes: Random / Mirror / Draft ---------- */

  // All three modes draw without repetition from the expanded pool, which holds
  // exactly as many entries as the player owns copies. Ownership is therefore
  // structural here rather than checked afterwards.
  function drawFromPool(count: number): Stone[] {
    return buildDraftPool(expandedPool.value, Math.min(count, expandedPool.value.length))
  }

  function fillRandom() {
    if (expandedPool.value.length === 0) return
    hands.value.A = drawFromPool(handSize('A'))
    hands.value.B = drawFromPool(handSize('B'))
  }

  function fillMirror() {
    if (expandedPool.value.length === 0) return
    const a = drawFromPool(handSize('A'))
    hands.value.A = a
    hands.value.B = a.slice(0, handSize('B'))
  }

  const draftActive = ref(false)
  const draftPool = ref<Stone[]>([])
  const draftTurn = ref<Player>('A')

  function startDraft() {
    if (expandedPool.value.length === 0) return
    hands.value.A = []
    hands.value.B = []
    draftPool.value = drawFromPool(handSize('A') + handSize('B'))
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
      const [collectionRes, elementsRes] = await Promise.all([
        $fetch<{ data: { quantity: number; lithos: LithosRecord }[] }>('/api/collections'),
        $fetch<{ data: ElementRecord[] }>('/api/elements'),
      ])

      // One entry per owned kind for display, plus how many are held.
      catalog.value = collectionRes.data.map((row) => toStone(row.lithos))
      owned.value = Object.fromEntries(
        collectionRes.data.map((row) => [row.lithos.id, row.quantity]),
      )
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
    opponentKind,
    botDifficulty,
    catalog,
    owned,
    ownedCount,
    expandedPool,
    elements,
    hands,
    elementSprites,
    handSize,
    handFull,
    canStart,
    collectionTooSmall,
    addToHand,
    canAdd,
    countInHand,
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
