import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import LocalMatch from '~/components/game/LocalMatch.vue'
import type { LithosRecord } from '~/game/engine/adapters'

// Characterization tests. They pin the behaviour LocalMatch has today so that
// splitting it into composables can be checked as behaviour-preserving: these
// assertions must keep passing untouched across the refactor.

function litho(id: string, up: number, down: number, left: number, right: number): LithosRecord {
  return {
    id,
    name: `Stone ${id}`,
    sprite: `/sprites/${id}.png`,
    spikeUp: up,
    spikeDown: down,
    spikeLeft: left,
    spikeRight: right,
    elementId: null,
  }
}

// Lopsided values so ordinary placements produce captures in both directions.
const catalog = [
  litho('a', 5, 5, 5, 5),
  litho('b', 2, 2, 2, 2),
  litho('c', 8, 1, 8, 1),
  litho('d', 1, 8, 1, 8),
]

function stubApi({ withDeck = false } = {}) {
  global.$fetch.mockImplementation((url: string) => {
    if (url === '/api/lithos') return Promise.resolve({ data: catalog })
    if (url === '/api/elements') return Promise.resolve({ data: [] })
    if (url === '/api/deck') {
      // Rejecting stands for "not logged in, or no deck yet".
      if (!withDeck) return Promise.reject(new Error('no deck'))
      return Promise.resolve({ data: { entries: [{ quantity: 2, lithos: catalog[0] }] } })
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`))
  })
}

async function mountLoaded() {
  const wrapper = mount(LocalMatch, { attachTo: document.body })
  await flushPromises()
  return wrapper
}

/** The one select carrying an option with this exact value. */
function selectWithOption(wrapper: VueWrapper, value: string) {
  const select = wrapper
    .findAll('select')
    .find((s) => s.findAll('option').some((o) => o.attributes('value') === value))
  if (!select) throw new Error(`no select offers the value ${value}`)
  return select
}

function columnOf(wrapper: VueWrapper, player: 'A' | 'B') {
  return wrapper.findAll('.player-col')[player === 'A' ? 0 : 1]!
}

async function autoFillBoth(wrapper: VueWrapper) {
  for (const player of ['A', 'B'] as const) {
    await columnOf(wrapper, player).findAll('button')[0]!.trigger('click')
  }
}

/** Select a stone from the current hand, then drop it on a cell. */
async function play(wrapper: VueWrapper, handIndex: number, x: number, y: number) {
  const cards = wrapper.findAll('.hand-card')
  await cards[handIndex]!.trigger('pointerdown')
  // The board listens for pointerup on window: no movement means "select".
  window.dispatchEvent(new Event('pointerup'))
  await nextTick()
  await wrapper.find(`.cell[data-cx="${x}"][data-cy="${y}"]`).trigger('click')
  await nextTick()
}

/** Row-major coordinates of a size x size board. */
function allCells(size: number) {
  const cells: { x: number; y: number }[] = []
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) cells.push({ x, y })
  return cells
}

describe('LocalMatch', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    localStorage.clear()
    vi.mocked(global.$fetch).mockReset()
    stubApi()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.useRealTimers()
  })

  describe('setup', () => {
    it('lists the catalog once the lithos have loaded', async () => {
      wrapper = await mountLoaded()

      expect(wrapper.findAll('.catalog-card')).toHaveLength(catalog.length)
    })

    it('keeps the start button disabled until both hands are full', async () => {
      wrapper = await mountLoaded()
      expect(wrapper.find('.start-btn').attributes('disabled')).toBeDefined()

      await autoFillBoth(wrapper)

      expect(wrapper.find('.start-btn').attributes('disabled')).toBeUndefined()
    })

    it('prefills player one from the saved deck, expanded by quantity', async () => {
      stubApi({ withDeck: true })
      wrapper = await mountLoaded()

      expect(columnOf(wrapper, 'A').findAll('.mini-card')).toHaveLength(2)
      expect(columnOf(wrapper, 'B').findAll('.mini-card')).toHaveLength(0)
    })

    it('alternates draft picks between the two players', async () => {
      wrapper = await mountLoaded()
      await wrapper.findAll('.hand-modes button')[2]!.trigger('click')

      expect(wrapper.find('.draft').exists()).toBe(true)

      await wrapper.findAll('.draft-pool button')[0]!.trigger('click')
      expect(columnOf(wrapper, 'A').findAll('.mini-card')).toHaveLength(1)
      expect(columnOf(wrapper, 'B').findAll('.mini-card')).toHaveLength(0)

      await wrapper.findAll('.draft-pool button')[0]!.trigger('click')
      expect(columnOf(wrapper, 'A').findAll('.mini-card')).toHaveLength(1)
      expect(columnOf(wrapper, 'B').findAll('.mini-card')).toHaveLength(1)
    })
  })

  describe('playing', () => {
    async function startMatch() {
      const w = await mountLoaded()
      await selectWithOption(w, 'A').setValue('A')
      await autoFillBoth(w)
      await w.find('.start-btn').trigger('click')
      await nextTick()
      return w
    }

    it('leaves setup and shows the board', async () => {
      wrapper = await startMatch()

      expect(wrapper.find('.game-board').exists()).toBe(true)
      expect(wrapper.findAll('.cell')).toHaveLength(9)
      expect(wrapper.emitted('activeChange')?.at(-1)).toEqual([true])
    })

    it('fills the board and ends the game once the last cell is played', async () => {
      wrapper = await startMatch()

      for (const { x, y } of allCells(3)) await play(wrapper, 0, x, y)

      expect(wrapper.findAll('.cell.empty')).toHaveLength(0)
      expect(wrapper.find('.end-overlay').exists()).toBe(true)
      expect(wrapper.find('.end-result').text()).not.toBe('')
    })

    it('rolls the last move back on undo', async () => {
      wrapper = await startMatch()
      const undoButton = () => wrapper!.findAll('.play-actions button')[0]!

      expect(undoButton().attributes('disabled')).toBeDefined()

      await play(wrapper, 0, 0, 0)
      expect(wrapper.findAll('.cell.empty')).toHaveLength(8)
      expect(undoButton().attributes('disabled')).toBeUndefined()

      await undoButton().trigger('click')
      await nextTick()

      expect(wrapper.findAll('.cell.empty')).toHaveLength(9)
      expect(undoButton().attributes('disabled')).toBeDefined()
    })

    it('returns to setup and clears the saved match when the config is edited', async () => {
      wrapper = await startMatch()
      await play(wrapper, 0, 0, 0)
      expect(localStorage.getItem('aeroliths.localMatch')).not.toBeNull()

      await wrapper.findAll('.play-actions button')[1]!.trigger('click')
      await nextTick()

      expect(wrapper.find('.start-btn').exists()).toBe(true)
      expect(localStorage.getItem('aeroliths.localMatch')).toBeNull()
      expect(wrapper.emitted('activeChange')?.at(-1)).toEqual([false])
    })
  })

  describe('resuming', () => {
    it('offers a match left in progress on the next mount', async () => {
      wrapper = await mountLoaded()
      await selectWithOption(wrapper, 'A').setValue('A')
      await autoFillBoth(wrapper)
      await wrapper.find('.start-btn').trigger('click')
      await nextTick()
      await play(wrapper, 0, 0, 0)
      wrapper.unmount()

      wrapper = await mountLoaded()

      expect(wrapper.find('.resume-banner').exists()).toBe(true)

      await wrapper.findAll('.resume-banner button')[0]!.trigger('click')
      await nextTick()

      expect(wrapper.find('.game-board').exists()).toBe(true)
      expect(wrapper.findAll('.cell.empty')).toHaveLength(8)
    })

    it('drops the offer when the saved match is discarded', async () => {
      wrapper = await mountLoaded()
      await selectWithOption(wrapper, 'A').setValue('A')
      await autoFillBoth(wrapper)
      await wrapper.find('.start-btn').trigger('click')
      await nextTick()
      await play(wrapper, 0, 0, 0)
      wrapper.unmount()

      wrapper = await mountLoaded()
      await wrapper.findAll('.resume-banner button')[1]!.trigger('click')
      await nextTick()

      expect(wrapper.find('.resume-banner').exists()).toBe(false)
      expect(localStorage.getItem('aeroliths.localMatch')).toBeNull()
    })
  })

  describe('turn timer', () => {
    it('plays a move for the current player when the clock runs out', async () => {
      wrapper = await mountLoaded()
      await selectWithOption(wrapper, 'A').setValue('A')
      await selectWithOption(wrapper, '10').setValue('10')
      await autoFillBoth(wrapper)

      // Installed before the match starts, so the turn interval is a fake one.
      vi.useFakeTimers()
      await wrapper.find('.start-btn').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.cell.empty')).toHaveLength(9)

      vi.advanceTimersByTime(10_000)
      await nextTick()

      expect(wrapper.findAll('.cell.empty')).toHaveLength(8)
    })
  })
})
