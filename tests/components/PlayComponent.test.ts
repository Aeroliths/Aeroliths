import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import PlayComponent from '~/components/PlayComponent.vue'

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({ user: { value: { id: 'u1', username: 'Tester' } } }),
}))

// These tests are about which modes are offered and what each one opens, so the
// deck builder is stubbed rather than rendered with a full fake collection.
const mountOptions = {
  attachTo: document.body,
  global: { stubs: { DeckBuilder: true } },
}

describe('PlayComponent', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    localStorage.clear()
    vi.mocked(global.$fetch).mockReset()
    global.$fetch.mockImplementation(() => Promise.resolve({ data: [] }))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('offers three modes, including the bot', async () => {
    wrapper = mount(PlayComponent, mountOptions)
    await flushPromises()

    const cards = wrapper.findAll('.mode-card')

    expect(cards).toHaveLength(3)
    expect(cards[2]!.text()).toContain('play.playComponent.botMatchTitle')
  })

  // The bot used to be reachable only through a dropdown buried among the rule
  // toggles, which is how it went unnoticed. The card is now the way in.
  it('starts a bot match from the third card', async () => {
    wrapper = mount(PlayComponent, mountOptions)
    await flushPromises()

    await wrapper.findAll('.mode-card')[2]!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.bot-difficulty').exists()).toBe(true)
  })

  it('keeps the hotseat card free of any bot control', async () => {
    wrapper = mount(PlayComponent, mountOptions)
    await flushPromises()

    await wrapper.findAll('.mode-card')[1]!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.bot-difficulty').exists()).toBe(false)
  })
})
