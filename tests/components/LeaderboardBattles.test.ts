import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import LeaderboardComponent from '~/components/LeaderboardComponent.vue'

vi.mock('~/composables/useAuth', async () => {
  const { ref } = await import('vue')
  return { useAuth: () => ({ user: ref({ id: 'me', username: 'me' }) }) }
})

const battles = {
  data: {
    players: [
      {
        rank: 1,
        id: 'u1',
        username: 'ada',
        profilePicture: null,
        xp: 900,
        level: 5,
        wins: 3,
        losses: 1,
        draws: 0,
        winRate: 75,
      },
    ],
    total: 1,
    page: 1,
    pageSize: 20,
  },
}

const emptyCollection = { data: { leaderboard: [], totalLithos: 0, totalElements: 0 } }

describe('LeaderboardComponent battles tab', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.mocked(global.$fetch).mockReset()
    global.$fetch.mockImplementation((url: string) => {
      if (String(url).includes('battles')) return Promise.resolve(battles)
      return Promise.resolve(emptyCollection)
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  // Auto-imported by Nuxt, unavailable here, and irrelevant to the ranking.
  const mountOptions = { global: { stubs: { FriendsReportModal: true } } }

  function openBattles(w: VueWrapper) {
    return w.findAll('.leaderboard-tabs button')[1]!.trigger('click')
  }

  it('no longer advertises the tab as unfinished', async () => {
    wrapper = mount(LeaderboardComponent, mountOptions)
    await flushPromises()

    expect(wrapper.find('.tab-dev-badge').exists()).toBe(false)
  })

  it('lists the ranked players once the tab is opened', async () => {
    wrapper = mount(LeaderboardComponent, mountOptions)
    await flushPromises()

    await openBattles(wrapper)
    await flushPromises()

    const rows = wrapper.findAll('.battle-row')
    expect(rows).toHaveLength(1)
    expect(rows[0]!.text()).toContain('ada')
    expect(rows[0]!.text()).toContain('75')
  })

  it('says so when nobody has played yet', async () => {
    global.$fetch.mockImplementation((url: string) => {
      if (String(url).includes('battles')) {
        return Promise.resolve({ data: { players: [], total: 0, page: 1, pageSize: 20 } })
      }
      return Promise.resolve(emptyCollection)
    })

    wrapper = mount(LeaderboardComponent, mountOptions)
    await flushPromises()
    await openBattles(wrapper)
    await flushPromises()

    expect(wrapper.find('.battle-empty').exists()).toBe(true)
  })

  it('only asks for the battle ranking once the tab is opened', async () => {
    wrapper = mount(LeaderboardComponent, mountOptions)
    await flushPromises()

    const asked = () =>
      vi.mocked(global.$fetch).mock.calls.filter(([url]) => String(url).includes('battles'))
    expect(asked()).toHaveLength(0)

    await openBattles(wrapper)
    await flushPromises()

    expect(asked()).toHaveLength(1)
  })

  it('does not fetch it again when the tab is reopened', async () => {
    wrapper = mount(LeaderboardComponent, mountOptions)
    await flushPromises()

    await openBattles(wrapper)
    await flushPromises()
    await wrapper.findAll('.leaderboard-tabs button')[0]!.trigger('click')
    await openBattles(wrapper)
    await flushPromises()

    const asked = vi
      .mocked(global.$fetch)
      .mock.calls.filter(([url]) => String(url).includes('battles'))
    expect(asked).toHaveLength(1)
  })

  it('surfaces a failure instead of showing an empty ranking', async () => {
    global.$fetch.mockImplementation((url: string) => {
      if (String(url).includes('battles')) {
        return Promise.reject({ data: { statusMessage: 'Failed to build the leaderboard' } })
      }
      return Promise.resolve(emptyCollection)
    })

    wrapper = mount(LeaderboardComponent, mountOptions)
    await flushPromises()
    await openBattles(wrapper)
    await flushPromises()

    expect(wrapper.find('.battle-empty').exists()).toBe(false)
    expect(wrapper.find('.error-message').exists()).toBe(true)
  })
})
