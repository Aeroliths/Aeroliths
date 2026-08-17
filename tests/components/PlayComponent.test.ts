import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import PlayComponent from '~/components/PlayComponent.vue'

// A real ref, not a plain { value } object: the template unwraps refs, so a
// look-alike leaves every `user?.x` reading undefined without failing loudly.
const { authUser } = vi.hoisted(() => ({
  authUser: { id: 'u1', username: 'Tester' } as Record<string, any>,
}))

vi.mock('~/composables/useAuth', async () => {
  const { ref } = await import('vue')
  return { useAuth: () => ({ user: ref(authUser) }) }
})

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

  it('shows nothing about progression until the player has a level', async () => {
    delete authUser.level
    delete authUser.xp
    delete authUser.nextLevelXp

    wrapper = mount(PlayComponent, mountOptions)
    await flushPromises()

    expect(wrapper.find('.progress-card').exists()).toBe(false)
  })

  it('shows the level and how far the current one has come', async () => {
    Object.assign(authUser, { level: 2, xp: 120, nextLevelXp: 240 })

    wrapper = mount(PlayComponent, mountOptions)
    await flushPromises()

    expect(wrapper.find('.progress-card').exists()).toBe(true)
    expect(wrapper.find('.progress-fill').attributes('style')).toContain('50%')
  })

  it('announces the top of the curve rather than an impossible remainder', async () => {
    Object.assign(authUser, { level: 9, xp: 5_000, nextLevelXp: null })

    wrapper = mount(PlayComponent, mountOptions)
    await flushPromises()

    expect(wrapper.find('.progress-remaining').text()).toContain('maxLevel')
    expect(wrapper.find('.progress-fill').attributes('style')).toContain('100%')
  })

  it('offers four modes, including the bot and the chests', async () => {
    wrapper = mount(PlayComponent, mountOptions)
    await flushPromises()

    const cards = wrapper.findAll('.mode-card')

    expect(cards).toHaveLength(4)
    expect(cards[2]!.text()).toContain('play.playComponent.botMatchTitle')
    expect(cards[3]!.text()).toContain('play.playComponent.chestsTitle')
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

  it('opens the chest inventory from the fourth card', async () => {
    wrapper = mount(PlayComponent, mountOptions)
    await flushPromises()

    await wrapper.findAll('.mode-card')[3]!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.chest-inventory').exists()).toBe(true)
  })

  it('keeps the hotseat card free of any bot control', async () => {
    wrapper = mount(PlayComponent, mountOptions)
    await flushPromises()

    await wrapper.findAll('.mode-card')[1]!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.bot-difficulty').exists()).toBe(false)
  })
})
