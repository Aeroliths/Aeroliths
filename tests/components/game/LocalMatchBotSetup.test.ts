import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import LocalMatch from '~/components/game/LocalMatch.vue'
import type { LithosRecord } from '~/game/engine/adapters'

function litho(id: string): LithosRecord {
  return {
    id,
    name: `Stone ${id}`,
    sprite: `/sprites/${id}.png`,
    spikeUp: 5,
    spikeDown: 5,
    spikeLeft: 5,
    spikeRight: 5,
    elementId: null,
  }
}

const catalog = [litho('a'), litho('b'), litho('c'), litho('d')]

describe('LocalMatch bot setup', () => {
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
  })

  async function mountWith(opponent?: 'human' | 'bot') {
    const w = mount(LocalMatch, {
      attachTo: document.body,
      props: opponent ? { opponent } : {},
    })
    await flushPromises()
    return w
  }

  it('shows no difficulty selector in the hotseat match', async () => {
    wrapper = await mountWith()

    expect(wrapper.find('.bot-difficulty').exists()).toBe(false)
  })

  it('leaves the second column empty and named after player two in the hotseat match', async () => {
    wrapper = await mountWith('human')

    const second = wrapper.findAll('.player-col')[1]!
    expect(second.findAll('.mini-card')).toHaveLength(0)
    expect(second.find('.player-name').text()).toBe('play.board.player2')
  })

  it('shows the difficulty selector against the bot', async () => {
    wrapper = await mountWith('bot')

    expect(wrapper.find('.bot-difficulty').exists()).toBe(true)
  })

  it('fills and renames the bot column without any manual step', async () => {
    wrapper = await mountWith('bot')

    const second = wrapper.findAll('.player-col')[1]!
    expect(second.findAll('.mini-card').length).toBeGreaterThan(0)
    expect(second.find('.player-name').text()).toBe('play.localMatch.botPlayer')
  })

  it('offers no opponent dropdown: the mode card is the only choice', async () => {
    wrapper = await mountWith('bot')

    const opponentSelect = wrapper
      .findAll('select')
      .find((s) => s.findAll('option').some((o) => o.attributes('value') === 'human'))

    expect(opponentSelect).toBeUndefined()
  })
})
