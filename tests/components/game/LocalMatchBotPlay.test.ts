import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import LocalMatch from '~/components/game/LocalMatch.vue'
import type { LithosRecord } from '~/game/engine/adapters'

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

const catalog = [
  litho('a', 5, 5, 5, 5),
  litho('b', 2, 2, 2, 2),
  litho('c', 8, 1, 8, 1),
  litho('d', 1, 8, 1, 8),
]

function selectWithOption(wrapper: VueWrapper, value: string) {
  const select = wrapper
    .findAll('select')
    .find((s) => s.findAll('option').some((o) => o.attributes('value') === value))
  if (!select) throw new Error(`no select offers the value ${value}`)
  return select
}

async function play(wrapper: VueWrapper, handIndex: number, x: number, y: number) {
  const cards = wrapper.findAll('.hand-card')
  await cards[handIndex]!.trigger('pointerdown')
  window.dispatchEvent(new Event('pointerup'))
  await flushPromises()
  await wrapper.find(`.cell[data-cx="${x}"][data-cy="${y}"]`).trigger('click')
  await flushPromises()
}

describe('LocalMatch against the bot', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    localStorage.clear()
    vi.mocked(global.$fetch).mockReset()
    global.$fetch.mockImplementation((url: string) => {
      if (url === '/api/lithos') return Promise.resolve({ data: catalog })
      if (url === '/api/elements') return Promise.resolve({ data: [] })
      return Promise.reject(new Error('no deck'))
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.useRealTimers()
  })

  async function startBotMatch() {
    const w = mount(LocalMatch, { attachTo: document.body, props: { opponent: 'bot' } })
    await flushPromises()
    await selectWithOption(w, 'A').setValue('A')
    await flushPromises()
    await w.findAll('.player-col')[0]!.findAll('button')[0]!.trigger('click')
    await w.find('.start-btn').trigger('click')
    await flushPromises()
    return w
  }

  it('replies on its own after the human plays', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    wrapper = await startBotMatch()

    await play(wrapper, 0, 0, 0)
    expect(wrapper.findAll('.cell.empty')).toHaveLength(8)

    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(wrapper.findAll('.cell.empty')).toHaveLength(7)
  })

  it('undo steps back past the bot reply, handing the turn to the human', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    wrapper = await startBotMatch()

    await play(wrapper, 0, 0, 0)
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()
    expect(wrapper.findAll('.cell.empty')).toHaveLength(7)

    await wrapper.findAll('.play-actions button')[0]!.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.cell.empty')).toHaveLength(9)
  })

  it('leaves the hotseat match untouched', async () => {
    wrapper = mount(LocalMatch, { attachTo: document.body })
    await flushPromises()
    await selectWithOption(wrapper, 'A').setValue('A')
    for (const column of wrapper.findAll('.player-col')) {
      await column.findAll('button')[0]!.trigger('click')
    }
    await wrapper.find('.start-btn').trigger('click')
    await flushPromises()

    await play(wrapper, 0, 0, 0)
    await new Promise((resolve) => setTimeout(resolve, 600))
    await flushPromises()

    // Nobody plays for player two when the opponent is a human.
    expect(wrapper.findAll('.cell.empty')).toHaveLength(8)
  })
})
