import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import AdminProgression from '~/components/admin/AdminProgression.vue'

function savedCalls(fragment: string) {
  return vi.mocked(global.$fetch).mock.calls.filter(([url]) => String(url).includes(fragment))
}

describe('AdminProgression', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.mocked(global.$fetch).mockReset()
    global.$fetch.mockImplementation((url: string) => {
      if (url === '/api/admin/progression') {
        return Promise.resolve({
          data: {
            curve: [
              { level: 1, xpRequired: 0 },
              { level: 2, xpRequired: 100 },
            ],
            rewards: [{ level: 2, kind: 'lithos', quantity: 1, lithosId: 'l-1' }],
          },
        })
      }
      if (url === '/api/lithos') return Promise.resolve({ data: [{ id: 'l-1', name: 'Stone' }] })
      return Promise.resolve({ success: true, data: {} })
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('lists the stored curve and tiers', async () => {
    wrapper = mount(AdminProgression)
    await flushPromises()

    expect(wrapper.findAll('.curve-row')).toHaveLength(2)
    expect(wrapper.findAll('.reward-row')).toHaveLength(1)
  })

  it('refuses to save a curve the rules reject, without calling the API', async () => {
    wrapper = mount(AdminProgression)
    await flushPromises()
    vi.mocked(global.$fetch).mockClear()

    // Break the sequence: level 2 no longer exceeds level 1.
    await wrapper.findAll('.curve-row input.xp-required')[1]!.setValue('0')
    await wrapper.find('.save-curve').trigger('click')
    await flushPromises()

    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(savedCalls('curve')).toHaveLength(0)
  })

  it('saves a valid curve', async () => {
    wrapper = mount(AdminProgression)
    await flushPromises()
    vi.mocked(global.$fetch).mockClear()

    await wrapper.find('.save-curve').trigger('click')
    await flushPromises()

    expect(savedCalls('curve')).toHaveLength(1)
  })

  it('saves the tiers', async () => {
    wrapper = mount(AdminProgression)
    await flushPromises()
    vi.mocked(global.$fetch).mockClear()

    await wrapper.find('.save-rewards').trigger('click')
    await flushPromises()

    expect(savedCalls('rewards')).toHaveLength(1)
  })

  it('adds and removes a level row', async () => {
    wrapper = mount(AdminProgression)
    await flushPromises()

    await wrapper.find('.add-level').trigger('click')
    expect(wrapper.findAll('.curve-row')).toHaveLength(3)

    await wrapper.findAll('.remove-level')[2]!.trigger('click')
    expect(wrapper.findAll('.curve-row')).toHaveLength(2)
  })

  it('proposes a next level that keeps the curve valid', async () => {
    wrapper = mount(AdminProgression)
    await flushPromises()

    await wrapper.find('.add-level').trigger('click')
    await wrapper.find('.save-curve').trigger('click')
    await flushPromises()

    // The row it added must not be the one that breaks the save.
    expect(wrapper.find('.error-message').exists()).toBe(false)
  })

  it('surfaces a rejection from the server', async () => {
    wrapper = mount(AdminProgression)
    await flushPromises()
    global.$fetch.mockImplementation((url: string) => {
      if (String(url).includes('curve')) {
        return Promise.reject({ data: { statusMessage: 'Levels must be consecutive' } })
      }
      return Promise.resolve({ success: true, data: {} })
    })

    await wrapper.find('.save-curve').trigger('click')
    await flushPromises()

    expect(wrapper.find('.error-message').text()).toContain('consecutive')
  })
})
