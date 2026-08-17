import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import LocalMatch from '~/components/game/LocalMatch.vue'

function collected(id: string, quantity: number) {
  return {
    quantity,
    lithos: {
      id,
      name: `Stone ${id}`,
      sprite: `/sprites/${id}.png`,
      spikeUp: 5,
      spikeDown: 5,
      spikeLeft: 5,
      spikeRight: 5,
      elementId: null,
    },
  }
}

function stubCollection(rows: ReturnType<typeof collected>[]) {
  global.$fetch.mockImplementation((url: string) => {
    if (url === '/api/collections') return Promise.resolve({ data: rows })
    if (url === '/api/elements') return Promise.resolve({ data: [] })
    return Promise.reject(new Error('no deck'))
  })
}

describe('LocalMatch draws from the collection', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    localStorage.clear()
    vi.mocked(global.$fetch).mockReset()
    stubCollection([collected('a', 2), collected('b', 1)])
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('lists one card per owned kind, not one per copy', async () => {
    wrapper = mount(LocalMatch, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.findAll('.catalog-card')).toHaveLength(2)
  })

  it('never asks for the full catalog', async () => {
    wrapper = mount(LocalMatch, { attachTo: document.body })
    await flushPromises()

    const asked = vi.mocked(global.$fetch).mock.calls.map(([url]) => url)
    expect(asked).toContain('/api/collections')
    expect(asked).not.toContain('/api/lithos')
  })

  it('shows how many of each kind are owned', async () => {
    wrapper = mount(LocalMatch, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.find('.catalog-owned').text()).toContain('2')
  })

  it('refuses a third copy of a stone owned twice', async () => {
    wrapper = mount(LocalMatch, { attachTo: document.body })
    await flushPromises()

    const firstCard = wrapper.findAll('.catalog-card')[0]!
    for (let i = 0; i < 4; i++) await firstCard.trigger('click')

    const held = wrapper.findAll('.player-col')[0]!.findAll('.mini-card')
    expect(held.length).toBeLessThanOrEqual(2)
  })

  it('caps each hand separately rather than draining a shared pool', async () => {
    wrapper = mount(LocalMatch, { attachTo: document.body })
    await flushPromises()

    for (const column of wrapper.findAll('.player-col')) {
      await column.findAll('button')[0]!.trigger('click')
    }

    // Three owned copies in total: a shared pool could not fill both hands.
    expect(wrapper.findAll('.player-col')[0]!.findAll('.mini-card')).toHaveLength(3)
    expect(wrapper.findAll('.player-col')[1]!.findAll('.mini-card')).toHaveLength(3)
  })

  it('auto-fill stops instead of looping when nothing more can be added', async () => {
    wrapper = mount(LocalMatch, { attachTo: document.body })
    await flushPromises()

    // Three copies against a hand of five: it must stop at three, not spin.
    await wrapper.findAll('.player-col')[0]!.findAll('button')[0]!.trigger('click')

    expect(wrapper.findAll('.player-col')[0]!.findAll('.mini-card')).toHaveLength(3)
  })

  it('never hands out more copies than owned through the random fill', async () => {
    wrapper = mount(LocalMatch, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('.hand-modes button')[0]!.trigger('click')

    const names = wrapper
      .findAll('.player-col')[0]!
      .findAll('.mini-card')
      .map((card) => card.html())
    const copiesOfA = names.filter((html) => html.includes('/sprites/a.png')).length
    expect(copiesOfA).toBeLessThanOrEqual(2)
  })

  it('explains why a board cannot be started with this collection', async () => {
    wrapper = mount(LocalMatch, { attachTo: document.body })
    await flushPromises()

    // Three owned copies against a hand of five.
    expect(wrapper.find('.collection-short').exists()).toBe(true)
    expect(wrapper.find('.start-btn').attributes('disabled')).toBeDefined()
  })

  it('says nothing when the collection is big enough', async () => {
    stubCollection([collected('a', 9)])

    wrapper = mount(LocalMatch, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.find('.collection-short').exists()).toBe(false)
  })
})
