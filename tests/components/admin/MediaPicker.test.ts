import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AdminLithos from '~/components/admin/AdminLithos.vue'
import AdminElements from '~/components/admin/AdminElements.vue'

// The admin panel guards on the session; the picker does not care about it.
vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({ initAuth: vi.fn() }),
}))

// Components living in app/components/admin/ register under a directory
// prefix, so `<MediaPicker>` only resolves where it is imported explicitly.
// These tests fail with an empty form section when that import is missing.
describe('media picker inside the admin forms', () => {
  beforeEach(() => {
    vi.mocked(global.$fetch).mockReset()
    global.$fetch.mockImplementation((url: string) => {
      if (url === '/api/lithos') return Promise.resolve({ data: [] })
      if (url === '/api/elements') return Promise.resolve({ data: [] })
      if (url === '/api/admin/media') return Promise.resolve({ data: [] })
      return Promise.reject(new Error(`unexpected fetch: ${url}`))
    })
  })

  it('renders in the create lithos form', async () => {
    const wrapper = mount(AdminLithos)
    await flushPromises()

    await wrapper.find('.btn-create').trigger('click')
    await flushPromises()

    expect(wrapper.find('.media-picker').exists()).toBe(true)
    expect(wrapper.find('.media-picker input[type="file"]').exists()).toBe(true)
  })

  it('renders in the create element form', async () => {
    const wrapper = mount(AdminElements)
    await flushPromises()

    await wrapper.find('.btn-create').trigger('click')
    await flushPromises()

    expect(wrapper.find('.media-picker').exists()).toBe(true)
    expect(wrapper.find('.media-picker input[type="file"]').exists()).toBe(true)
  })
})
