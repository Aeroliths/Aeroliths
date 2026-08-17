import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import LocalMatch from '~/components/game/LocalMatch.vue'
import type { LithosRecord } from '~/game/engine/adapters'

function litho(id: string, value: number): LithosRecord {
  return {
    id,
    name: `Stone ${id}`,
    sprite: `/sprites/${id}.png`,
    spikeUp: value,
    spikeDown: value,
    spikeLeft: value,
    spikeRight: value,
    elementId: null,
  }
}

const catalog = [litho('a', 5), litho('b', 2), litho('c', 8), litho('d', 1)]

function selectWithOption(wrapper: VueWrapper, value: string) {
  const select = wrapper
    .findAll('select')
    .find((s) => s.findAll('option').some((o) => o.attributes('value') === value))
  if (!select) throw new Error(`no select offers the value ${value}`)
  return select
}

async function play(wrapper: VueWrapper, x: number, y: number) {
  const cards = wrapper.findAll('.hand-card')
  await cards[0]!.trigger('pointerdown')
  window.dispatchEvent(new Event('pointerup'))
  await flushPromises()
  await wrapper.find(`.cell[data-cx="${x}"][data-cy="${y}"]`).trigger('click')
  await flushPromises()
}

function submissions() {
  return vi.mocked(global.$fetch).mock.calls.filter(([url]) => url === '/api/matches')
}

describe('match submission', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    localStorage.clear()
    vi.mocked(global.$fetch).mockReset()
    global.$fetch.mockImplementation((url: string) => {
      if (url === '/api/lithos') return Promise.resolve({ data: catalog })
      if (url === '/api/elements') return Promise.resolve({ data: [] })
      if (url === '/api/matches') {
        return Promise.resolve({
          data: { xpAwarded: 100, cappedToday: false, level: 3, levelsGained: [2, 3] },
        })
      }
      return Promise.reject(new Error('no deck'))
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.useRealTimers()
  })

  it('submits nothing for a hotseat match', async () => {
    wrapper = mount(LocalMatch, { attachTo: document.body })
    await flushPromises()
    await selectWithOption(wrapper, 'A').setValue('A')
    for (const column of wrapper.findAll('.player-col')) {
      await column.findAll('button')[0]!.trigger('click')
    }
    await wrapper.find('.start-btn').trigger('click')
    await flushPromises()

    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) await play(wrapper, x, y)

    expect(wrapper.find('.end-overlay').exists()).toBe(true)
    expect(submissions()).toHaveLength(0)
  })

  it('submits once when a bot match finishes, with stone ids and no result', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    wrapper = mount(LocalMatch, { attachTo: document.body, props: { opponent: 'bot' } })
    await flushPromises()
    await selectWithOption(wrapper, 'A').setValue('A')
    await flushPromises()
    await wrapper.findAll('.player-col')[0]!.findAll('button')[0]!.trigger('click')
    await wrapper.find('.start-btn').trigger('click')
    await flushPromises()

    // Five human moves with a bot reply after each, until the board is full.
    for (let i = 0; i < 5; i++) {
      const empty = wrapper.find('.cell.empty')
      if (!empty.exists()) break
      await play(wrapper, Number(empty.attributes('data-cx')), Number(empty.attributes('data-cy')))
      await vi.advanceTimersByTimeAsync(1000)
      await flushPromises()
    }

    expect(wrapper.findAll('.cell.empty')).toHaveLength(0)

    const calls = submissions()
    expect(calls).toHaveLength(1)

    // The reward the server granted is shown, rather than earned in silence.
    expect(wrapper.find('.end-xp').exists()).toBe(true)
    expect(wrapper.find('.end-level').exists()).toBe(true)
    expect(wrapper.find('.end-level-up').exists()).toBe(true)

    const payload = (calls[0]![1] as any).body
    expect(payload.hands.A).toHaveLength(5)
    expect(payload.hands.B).toHaveLength(4)
    expect(payload.hands.A.every((id: unknown) => typeof id === 'string')).toBe(true)
    expect(payload.moves).toHaveLength(9)
    // The server decides the winner; the client must not even offer an opinion.
    expect(payload).not.toHaveProperty('result')
    expect(payload).not.toHaveProperty('winner')
  })
})
