<template>
  <div class="local-match">
    <!-- ========== SETUP ========== -->
    <div v-if="phase === 'setup'" class="setup">
      <div v-if="resumable" class="resume-banner">
        <span>{{ $t('play.localMatch.resumeBannerText') }}</span>
        <button class="ghost-btn sm" @click="resumeMatch">{{ $t('play.localMatch.resume') }}</button>
        <button class="ghost-btn sm" @click="discardResume">{{ $t('play.localMatch.discard') }}</button>
      </div>
      <div class="setup-controls">
        <label class="size-picker">
          {{ $t('play.localMatch.boardSize') }}
          <select v-model.number="size">
            <option :value="3">3 x 3</option>
            <option :value="4">4 x 4</option>
            <option :value="5">5 x 5</option>
          </select>
        </label>
        <div class="rule-toggles">
          <label><input type="checkbox" v-model="rules.same" /> {{ $t('play.localMatch.same') }}</label>
          <label><input type="checkbox" v-model="rules.plus" /> {{ $t('play.localMatch.plus') }}</label>
          <label><input type="checkbox" v-model="rules.combo" /> {{ $t('play.localMatch.combo') }}</label>
          <label><input type="checkbox" v-model="rules.wall" /> {{ $t('play.localMatch.wall') }}</label>
          <label><input type="checkbox" v-model="elementalCells" /> {{ $t('play.localMatch.elementalCells') }}</label>
        </div>
        <label><input type="checkbox" v-model="openHands" /> {{ $t('play.localMatch.openHands') }}</label>
        <label><input type="checkbox" v-model="suddenDeath" /> {{ $t('play.localMatch.suddenDeath') }}</label>
        <label class="size-picker">
          {{ $t('play.localMatch.handRule') }}
          <select v-model="handRule">
            <option value="none">{{ $t('play.localMatch.handRuleNone') }}</option>
            <option value="order">{{ $t('play.localMatch.handRuleOrder') }}</option>
            <option value="chaos">{{ $t('play.localMatch.handRuleChaos') }}</option>
          </select>
        </label>
        <label class="size-picker">
          {{ $t('play.localMatch.firstPlayer') }}
          <select v-model="startingChoice">
            <option value="random">{{ $t('play.localMatch.firstPlayerRandom') }}</option>
            <option value="A">{{ $t('play.board.player1') }}</option>
            <option value="B">{{ $t('play.board.player2') }}</option>
          </select>
        </label>
        <label v-if="opponentKind === 'bot'" class="size-picker bot-difficulty">
          {{ $t('play.localMatch.botDifficulty') }}
          <select v-model="botDifficulty">
            <option value="easy">{{ $t('play.localMatch.botEasy') }}</option>
            <option value="medium">{{ $t('play.localMatch.botMedium') }}</option>
            <option value="hard">{{ $t('play.localMatch.botHard') }}</option>
          </select>
        </label>
        <label class="size-picker">
          {{ $t('play.localMatch.turnTimer') }}
          <select v-model.number="turnSeconds">
            <option :value="0">{{ $t('play.localMatch.turnTimerOff') }}</option>
            <option :value="10">10s</option>
            <option :value="20">20s</option>
            <option :value="30">30s</option>
          </select>
        </label>
      </div>

      <div class="hand-modes">
        <button class="ghost-btn sm" @click="fillRandom">{{ $t('play.localMatch.handModeRandom') }}</button>
        <button class="ghost-btn sm" @click="fillMirror">{{ $t('play.localMatch.handModeMirror') }}</button>
        <button class="ghost-btn sm" @click="startDraft">{{ $t('play.localMatch.handModeDraft') }}</button>
      </div>

      <div v-if="draftActive" class="draft">
        <div class="draft-head">
          <span>{{ $t('play.localMatch.draftPrefix') }}<strong>{{ draftTurn === 'A' ? $t('play.board.player1') : $t('play.board.player2') }}</strong> {{ $t('play.localMatch.draftSuffix') }}</span>
          <button class="ghost-btn sm" @click="cancelDraft">{{ $t('play.localMatch.cancelDraft') }}</button>
        </div>
        <div class="draft-pool">
          <button
            v-for="(stone, i) in draftPool"
            :key="stone.id + '-' + i"
            class="catalog-card"
            @click="pickDraft(i)"
          >
            <GameStone :stone="stone" />
            <span class="catalog-name">{{ stone.name }}</span>
          </button>
        </div>
      </div>

      <!-- Both players side by side: drop Lithos from the shared catalog. -->
      <div class="players">
        <div
          v-for="p in (['A', 'B'] as const)"
          :key="p"
          class="player-col"
          :class="[`owner-${p}`, { 'drop-target': dragOverPlayer === p, full: handFull(p) }]"
          :data-hand-owner="p"
        >
          <div class="player-col-header">
            <span class="player-name">{{ playerLabel(p) }}</span>
            <span class="player-count">{{ hands[p].length }}/{{ handSize(p) }}</span>
            <button class="ghost-btn sm" @click="autoFill(p)">{{ $t('play.localMatch.autoFill') }}</button>
            <button class="ghost-btn sm" @click="hands[p] = []">{{ $t('play.localMatch.clear') }}</button>
          </div>

          <div class="player-hand">
            <button
              v-for="(stone, i) in hands[p]"
              :key="stone.id + '-' + i"
              class="mini-card"
              :class="`owner-${p}`"
              :title="$t('play.localMatch.removeTitle')"
              @click="removeFromHand(p, i)"
            >
              <GameStone :stone="stone" />
            </button>
            <div v-if="hands[p].length === 0" class="drop-hint">{{ $t('play.localMatch.dragLithosHere') }}</div>
          </div>
        </div>
      </div>

      <p class="hint">
        {{ $t('play.localMatch.hint') }}
      </p>

      <!-- Shared catalog -->
      <div v-if="loading" class="empty">{{ $t('play.localMatch.loadingLithos') }}</div>
      <div v-else class="catalog">
        <button
          v-for="stone in catalog"
          :key="stone.id"
          class="catalog-card"
          :class="{ dragging: drag?.stone.id === stone.id }"
          @pointerdown="onCatalogPointerDown($event, stone)"
          @click="addToHand('A', stone)"
          @dragstart.prevent
        >
          <GameStone :stone="stone" />
          <span class="catalog-name">{{ stone.name }}</span>
          <span class="catalog-owned">{{ $t('play.localMatch.owned', { count: ownedCount(stone) }) }}</span>
        </button>
      </div>

      <p v-if="collectionTooSmall" class="collection-short">
        {{ $t('play.localMatch.collectionShort', { needed: Math.max(handSize('A'), handSize('B')) }) }}
      </p>

      <button class="start-btn" :disabled="!canStart" @click="start">
        {{ $t('play.localMatch.startGame') }}
      </button>

      <!-- Floating Lithos that follows the cursor while dragging from the catalog -->
      <Teleport to="body">
        <div
          v-if="drag"
          class="drag-ghost"
          :style="{ left: `${drag.x}px`, top: `${drag.y}px` }"
        >
          <div class="ghost-card">
            <GameStone :stone="drag.stone" />
          </div>
        </div>
      </Teleport>
    </div>

    <!-- ========== PLAY ========== -->
    <div v-else-if="match" class="play">
      <GameBoard
        v-if="replaying && replayState"
        :state="replayState"
        :selected-hand-index="null"
        :last-events="replayEvents"
        :element-sprites="elementSprites"
        readonly
      />
      <GameBoard
        v-else
        :state="match"
        :selected-hand-index="selectedHandIndex"
        :last-events="lastEvents"
        :element-sprites="elementSprites"
        :seconds-left="match.turnSeconds > 0 && match.status === 'playing' ? remaining : undefined"
        :capture-info="match.status === 'finished' ? captureInfo : undefined"
        :forced-hand-index="forcedHandIndex"
        :sudden-death-round="suddenDeathRound"
        @select-hand="selectHand"
        @place-at="play"
      />

      <p v-if="botThinking" class="bot-thinking">{{ $t('play.localMatch.botThinking') }}</p>

      <div v-if="replaying" class="replay-bar">
        <button class="ghost-btn sm" :disabled="replayIndex === 0" @click="replayStep(-1)">◀</button>
        <span>{{ replayIndex }} / {{ timeline.length - 1 }}</span>
        <button class="ghost-btn sm" :disabled="replayIndex >= timeline.length - 1" @click="replayStep(1)">▶</button>
        <button class="ghost-btn sm" @click="replayAuto">{{ $t('play.localMatch.auto') }}</button>
        <button class="ghost-btn sm" @click="stopReplay">{{ $t('play.localMatch.close') }}</button>
      </div>

      <div v-if="match.status !== 'finished'" class="play-actions">
        <button class="ghost-btn" :disabled="!canUndo" @click="undo">{{ $t('play.localMatch.undo') }}</button>
        <button class="ghost-btn" @click="reset">{{ $t('play.localMatch.editConfig') }}</button>
        <button class="ghost-btn" @click="sound.toggleMute()">{{ sound.muted.value ? '🔇' : '🔊' }}</button>
        <input
          class="vol"
          type="range" min="0" max="1" step="0.1"
          :value="sound.volume.value"
          @input="sound.setVolume(Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <!-- End-of-game overlay: position:absolute inside .play (which is
           position:relative). No Teleport, scoped styles, so it renders
           reliably and is not trapped by .play-container's backdrop-filter. -->
      <div v-if="match.status === 'finished' && !replaying" class="end-overlay" @click.self="reset">
        <div class="end-modal" role="dialog" aria-modal="true">
          <div class="end-result" :class="resultClass">{{ resultTitle }}</div>
          <div class="end-score">
            <span class="es-a">{{ $t('play.board.player1') }} : {{ animScore.A }}</span>
            <span class="es-sep">/</span>
            <span class="es-b">{{ $t('play.board.player2') }} : {{ animScore.B }}</span>
          </div>
          <div v-if="lastAward !== null" class="end-xp">
            <span class="end-xp-amount">{{ $t('play.localMatch.xpAwarded', { xp: lastAward }) }}</span>
            <span v-if="level !== null" class="end-level">{{ $t('play.localMatch.level', { level }) }}</span>
            <span v-if="levelsGained.length > 0" class="end-level-up">
              {{ $t('play.localMatch.levelUp', { level: levelsGained[levelsGained.length - 1] }) }}
            </span>
            <span v-if="cappedToday" class="end-xp-capped">{{ $t('play.localMatch.xpCapped') }}</span>
          </div>
          <div class="end-recap">
            <span>{{ $t('play.localMatch.biggestCapturePrefix') }}{{ highlights.biggestCapture }}{{ highlights.biggestBy ? ` (${highlights.biggestBy === 'A' ? $t('play.localMatch.p1') : $t('play.localMatch.p2')})` : '' }}</span>
            <span>{{ $t('play.localMatch.same') }} {{ highlights.same }} · {{ $t('play.localMatch.plus') }} {{ highlights.plus }} · {{ $t('play.localMatch.combo') }} {{ highlights.combo }}</span>
          </div>
          <div class="end-actions">
            <button
              v-if="match.winner === 'draw' && match.suddenDeath"
              class="end-btn end-btn-primary"
              @click="startSuddenDeath"
            >{{ $t('play.localMatch.suddenDeathButton') }}</button>
            <button class="end-btn" @click="startReplay">{{ $t('play.localMatch.watchReplay') }}</button>
            <button class="end-btn end-btn-primary" @click="playAgain">{{ $t('play.localMatch.playAgain') }}</button>
            <button class="end-btn" @click="reset">{{ $t('play.localMatch.editConfig') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import GameBoard from './GameBoard.vue'
import GameStone from './GameStone.vue'
import { createMatch, placeStoneWithEvents, handSizeFor, randomMove, suddenDeathHands } from '~/game/engine/match'
import { useSound } from '~/composables/useSound'
import { useMatchSetup } from '~/composables/useMatchSetup'
import { useCatalogDrag } from '~/composables/useCatalogDrag'
import { useTurnTimer } from '~/composables/useTurnTimer'
import { useMatchPersistence } from '~/composables/useMatchPersistence'
import { useMatchReplay } from '~/composables/useMatchReplay'
import { useMatchOutcome } from '~/composables/useMatchOutcome'
import { useBotOpponent, BOT_PLAYER } from '~/composables/useBotOpponent'
import { useMatchSubmission } from '~/composables/useMatchSubmission'
import type { CaptureEvent, MatchState, Player, Stone, TimelineEntry } from '~/game/engine/types'

type Phase = 'setup' | 'play'

const props = withDefaults(
  defineProps<{
    /** Who sits in the second seat. The mode card decides, not a control here. */
    opponent?: 'human' | 'bot'
  }>(),
  { opponent: 'human' },
)

const emit = defineEmits<{
  (e: 'activeChange', active: boolean): void
}>()

const sound = useSound()
const { t } = useI18n()

/* ---------- Pre-match state: options, catalog, hands ---------- */

const {
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
} = useMatchSetup()

// Dropping a stone on a full column is a no-op: addToHand already refuses it.
const { drag, dragOverPlayer, onCatalogPointerDown } = useCatalogDrag(addToHand)

opponentKind.value = props.opponent

/** Column heading: the second seat is named after who actually holds it. */
function playerLabel(player: Player): string {
  if (player === 'A') return t('play.board.player1')
  return opponentKind.value === 'bot' ? t('play.localMatch.botPlayer') : t('play.board.player2')
}

/* ---------- Match state ---------- */

const phase = ref<Phase>('setup')
const lastStarter = ref<Player>('A')
const suddenDeathRound = ref(0)
const forcedHandIndex = ref<number | null>(null)

const match = ref<MatchState | null>(null)
const timeline = ref<TimelineEntry[]>([])
const selectedHandIndex = ref<number | null>(null)
const lastEvents = ref<CaptureEvent[]>([])

// The timeline stores states, and lastMove records only the cell, so the hand
// index would be lost. A submission needs the moves themselves.
const moves = ref<{ handIndex: number; x: number; y: number }[]>([])
// The engine consumes the hands as the match runs, so the submission needs them
// as they stood at the opening move.
const startingHands = ref<Record<Player, Stone[]>>({ A: [], B: [] })
/** False for a resumed match, whose move list could not be restored. */
const submittable = ref(true)
let submitted = false
const canUndo = computed(() => timeline.value.length > 1 && match.value?.status === 'playing')

const {
  resumable,
  save: saveState,
  clear: clearSave,
  check: checkSavedMatch,
  discard: discardResume,
} = useMatchPersistence()

const { resultTitle, resultClass, highlights, captureInfo, animScore } = useMatchOutcome(match, timeline)

const {
  replaying,
  index: replayIndex,
  state: replayState,
  events: replayEvents,
  start: beginReplay,
  stop: stopReplay,
  step: replayStep,
  auto: replayAuto,
} = useMatchReplay(timeline, match)

const { remaining, arm: armClock, stop: stopTimer } = useTurnTimer(playTimedOutMove)

/* ---------- Bot opponent ---------- */

const botEnabled = computed(() => opponentKind.value === 'bot')

const { thinking: botThinking } = useBotOpponent({
  match,
  enabled: botEnabled,
  difficulty: botDifficulty,
  catalog,
  forcedHandIndex,
  suspended: replaying,
  onMove: playAt,
})

/* ---------- Submitting a finished bot match ---------- */

const { submit, lastAward, cappedToday, level, levelsGained } = useMatchSubmission()

watch(
  () => match.value?.status,
  (status) => {
    if (status !== 'finished') return
    if (!botEnabled.value || !submittable.value || submitted) return
    const state = match.value!
    submitted = true
    submit({
      difficulty: botDifficulty.value,
      size: state.size,
      rules: state.rules,
      handRule: state.handRule,
      openHands: state.openHands,
      startingPlayer: lastStarter.value,
      boardElements: state.boardElements,
      hands: {
        A: startingHands.value.A.map((stone) => stone.id),
        B: startingHands.value.B.map((stone) => stone.id),
      },
      moves: moves.value,
    })
  },
)

/* ---------- Turn timer ---------- */

function armTimer() {
  const state = match.value
  if (!state || state.status !== 'playing' || replaying.value) {
    stopTimer()
    return
  }
  // The bot is not on the clock: a search cut short by a timeout would be handed
  // a random move, which is a bug wearing the costume of a rule.
  if (botEnabled.value && state.current === BOT_PLAYER) {
    stopTimer()
    return
  }
  armClock(state.turnSeconds)
}

/** The clock ran out: play for the current player, honouring Order/Chaos. */
function playTimedOutMove() {
  if (!match.value) return
  const move = randomMove(match.value)
  if (!move) return
  let handIndex = move.handIndex
  if (match.value.handRule === 'order') handIndex = 0
  else if (match.value.handRule === 'chaos' && forcedHandIndex.value !== null) handIndex = forcedHandIndex.value
  playAt(handIndex, move.x, move.y)
}

/* ---------- Match lifecycle ---------- */

function saveMatch() {
  if (!match.value || replaying.value) return
  saveState(match.value)
}

function beginMatch(
  handA: Stone[],
  handB: Stone[],
  startingPlayer: Player,
  boardElements: (string | null)[][] | undefined,
) {
  match.value = createMatch({
    size: size.value,
    hands: { A: handA, B: handB },
    elements: elements.value,
    rules: { ...rules.value },
    startingPlayer,
    boardElements,
    turnSeconds: turnSeconds.value,
    handRule: handRule.value,
    openHands: openHands.value,
    suddenDeath: suddenDeath.value,
  })
  lastStarter.value = startingPlayer
  timeline.value = [{ state: match.value, events: [] }]
  moves.value = []
  startingHands.value = { A: [...handA], B: [...handB] }
  submittable.value = true
  submitted = false
  selectedHandIndex.value = null
  lastEvents.value = []
  stopReplay()
  phase.value = 'play'
  emit('activeChange', true)
  rollChaos()
  armTimer()
  saveMatch()
}

function start() {
  if (!canStart.value) return
  const startingPlayer = resolveStartingPlayer()
  const handA = [...hands.value.A].slice(0, handSizeFor(size.value, 'A', startingPlayer))
  const handB = [...hands.value.B].slice(0, handSizeFor(size.value, 'B', startingPlayer))
  suddenDeathRound.value = 0
  beginMatch(handA, handB, startingPlayer, makeBoardElements())
}

function rollChaos() {
  if (!match.value || match.value.status !== 'playing' || match.value.handRule !== 'chaos') {
    forcedHandIndex.value = null
    return
  }
  const hand = match.value.hands[match.value.current]
  if (hand.length === 0) { forcedHandIndex.value = null; return }
  const idx = Math.floor(Math.random() * hand.length)
  forcedHandIndex.value = idx
  selectedHandIndex.value = idx
}

function reset() {
  match.value = null
  selectedHandIndex.value = null
  phase.value = 'setup'
  suddenDeathRound.value = 0
  stopTimer()
  stopReplay()
  clearSave()
  emit('activeChange', false)
}

function selectHand(index: number) {
  selectedHandIndex.value = index
}

function undo() {
  if (timeline.value.length <= 1) return
  timeline.value.pop()
  moves.value.pop()
  // Against the bot, undoing a single ply hands the turn straight back to it and
  // it replays at once, so the button looks broken. Step back past its reply.
  if (botEnabled.value && timeline.value.length > 1) {
    const previous = timeline.value[timeline.value.length - 1]!.state
    if (previous.current === BOT_PLAYER) {
      timeline.value.pop()
      moves.value.pop()
    }
  }
  match.value = timeline.value[timeline.value.length - 1]!.state
  selectedHandIndex.value = null
  lastEvents.value = []
  rollChaos()
  armTimer()
}

function playAgain() {
  // Re-run start() with the same hands/rules/starter already in the setup state.
  start()
}

function startSuddenDeath() {
  if (!match.value) return
  const next = suddenDeathHands(match.value)
  const boardElements = match.value.boardElements
  const startingPlayer: Player = lastStarter.value === 'A' ? 'B' : 'A'
  suddenDeathRound.value += 1
  beginMatch(next.A, next.B, startingPlayer, boardElements)
}

function playAt(handIndex: number, x: number, y: number) {
  if (!match.value || match.value.status !== 'playing') return
  const { state, events } = placeStoneWithEvents(match.value, handIndex, x, y)
  match.value = state
  lastEvents.value = events
  timeline.value.push({ state, events })
  moves.value.push({ handIndex, x, y })
  selectedHandIndex.value = null
  sound.play('place')
  if (events.length > 0) sound.play('capture')
  if (state.status === 'finished') { sound.play('win'); clearSave() }
  else saveMatch()
}

function play(x: number, y: number) {
  if (selectedHandIndex.value === null) return
  playAt(selectedHandIndex.value, x, y)
}

/* ---------- Resume a match left in progress ---------- */

function resumeMatch() {
  const saved = resumable.value
  if (!saved) return
  match.value = saved
  timeline.value = [{ state: saved, events: [] }]
  // A match restored from storage has lost its move list, so it can never be
  // submitted: the server would have nothing to replay.
  moves.value = []
  submittable.value = false
  selectedHandIndex.value = null
  lastEvents.value = []
  phase.value = 'play'
  resumable.value = null
  emit('activeChange', true)
  rollChaos()
  armTimer()
}

/* ---------- End of game ---------- */

function startReplay() {
  stopTimer()
  beginReplay()
}

watch(
  () => [match.value?.current, match.value?.status] as const,
  () => {
    if (match.value?.status === 'playing') { rollChaos(); armTimer() }
    else stopTimer()
  },
)

onMounted(() => {
  load()
  checkSavedMatch()
})
</script>

<style scoped src="~/assets/css/local-match.css"></style>
