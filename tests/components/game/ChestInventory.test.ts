import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import ChestInventory from '~/components/game/ChestInventory.vue'

describe('ChestInventory', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.mocked(global.$fetch).mockReset()
    global.$fetch.mockImplementation((url: string) => {
      if (url === '/api/chests') {
        return Promise.resolve({
          data: [{ chestTypeId: 'chest-1', name: 'Wooden chest', quantity: 2 }],
        })
      }
      return Promise.resolve({
        data: { lithos: { id: 'l-1', name: 'Stone', sprite: '/sprites/l-1.png' } },
      })
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('lists the chests held with their count', async () => {
    wrapper = mount(ChestInventory)
    await flushPromises()

    expect(wrapper.findAll('.chest-card')).toHaveLength(1)
    expect(wrapper.find('.chest-name').text()).toContain('Wooden chest')
  })

  it('says so when the inventory is empty', async () => {
    global.$fetch.mockImplementation(() => Promise.resolve({ data: [] }))

    wrapper = mount(ChestInventory)
    await flushPromises()

    expect(wrapper.find('.no-chests').exists()).toBe(true)
    expect(wrapper.findAll('.chest-card')).toHaveLength(0)
  })

  it('opens a chest and announces what came out', async () => {
    wrapper = mount(ChestInventory)
    await flushPromises()

    await wrapper.find('.open-chest').trigger('click')
    await flushPromises()

    expect(wrapper.find('.chest-result').exists()).toBe(true)
    expect(wrapper.find('.chest-result').text()).toContain('Stone')
  })

  it('asks the server again after opening rather than counting down locally', async () => {
    wrapper = mount(ChestInventory)
    await flushPromises()
    vi.mocked(global.$fetch).mockClear()

    await wrapper.find('.open-chest').trigger('click')
    await flushPromises()

    // Only the server knows whether the chest was really spent, and a second
    // tab may have spent it already.
    const reloads = vi.mocked(global.$fetch).mock.calls.filter(([url]) => url === '/api/chests')
    expect(reloads).toHaveLength(1)
  })

  it('surfaces a refusal instead of pretending it worked', async () => {
    wrapper = mount(ChestInventory)
    await flushPromises()
    global.$fetch.mockImplementation((url: string) => {
      if (url === '/api/chests') return Promise.resolve({ data: [] })
      return Promise.reject({ data: { statusMessage: 'This chest has nothing in it yet.' } })
    })

    await wrapper.find('.open-chest').trigger('click')
    await flushPromises()

    expect(wrapper.find('.error-message').text()).toContain('nothing in it')
    expect(wrapper.find('.chest-result').exists()).toBe(false)
  })
})
