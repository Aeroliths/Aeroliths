import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~~/server/utils/email', () => ({
  sendDeletionRequestEmail: vi.fn(),
}))

import requestDeletion from '~~/server/api/users/[id]/request-deletion.post'
import cancelDeletion from '~~/server/api/users/[id]/cancel-deletion.post'
import { sendDeletionRequestEmail } from '~~/server/utils/email'
import { createTestUser } from '../../../utils/auth'

const event = {} as any
const sendEmail = sendDeletionRequestEmail as unknown as ReturnType<typeof vi.fn>

function storedUser(overrides: Record<string, any> = {}) {
  return {
    id: 'test-user-id',
    email: 'user@test.com',
    username: 'user',
    locale: 'fr',
    deletionRequestedAt: null,
    role: { id: 'role-1', name: 'user' },
    ...overrides,
  }
}

describe('POST /api/users/[id]/request-deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestUser())
    global.getRouterParam.mockReturnValue('test-user-id')
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser())
    global.db.postgres.user.update.mockResolvedValue({})
    sendEmail.mockResolvedValue(undefined)
  })

  it('records the request and announces the deletion date', async () => {
    const result = await handler()

    expect(result.success).toBe(true)
    const daysAhead = (result.data.deletionDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    expect(daysAhead).toBeGreaterThan(29)
    expect(daysAhead).toBeLessThanOrEqual(30)
  })

  it('clears any reminder already sent, so the countdown starts fresh', async () => {
    await handler()

    const { data } = global.db.postgres.user.update.mock.calls[0]![0]
    expect(data.deletionRequestedAt).toBeInstanceOf(Date)
    expect(data.deletionReminderSent).toBe(false)
  })

  it('refuses to delete another account', async () => {
    global.getRouterParam.mockReturnValue('someone-else')

    await expect(handler()).rejects.toMatchObject({ statusCode: 403 })
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('refuses to delete an admin account', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(
      storedUser({ role: { id: 'role-2', name: 'admin' } }),
    )

    await expect(handler()).rejects.toMatchObject({ statusCode: 403 })
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('refuses a second request while one is pending', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(
      storedUser({ deletionRequestedAt: new Date() }),
    )

    await expect(handler()).rejects.toMatchObject({ statusCode: 409 })
  })

  it('answers 404 for an unknown account', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(null)

    await expect(handler()).rejects.toMatchObject({ statusCode: 404 })
  })

  it('records the request even when the confirmation email fails', async () => {
    sendEmail.mockRejectedValue(new Error('smtp down'))

    const result = await handler()

    expect(result.success).toBe(true)
    expect(global.db.postgres.user.update).toHaveBeenCalledTimes(1)
  })

  it('writes the confirmation in the account language', async () => {
    await handler()

    expect(sendEmail).toHaveBeenCalledWith('user@test.com', 'user', expect.any(Date), 'fr')
  })

  it('requires authentication', async () => {
    global.getAuthUser.mockImplementation(() => {
      throw { statusCode: 401, statusMessage: 'Unauthorized' }
    })

    await expect(handler()).rejects.toMatchObject({ statusCode: 401 })
  })

  function handler() {
    return requestDeletion(event) as any
  }
})

describe('POST /api/users/[id]/cancel-deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.getAuthUser.mockReturnValue(createTestUser())
    global.getRouterParam.mockReturnValue('test-user-id')
    global.db.postgres.user.findUnique.mockResolvedValue(
      storedUser({ deletionRequestedAt: new Date() }),
    )
    global.db.postgres.user.update.mockResolvedValue({})
  })

  it('clears a pending request', async () => {
    const result = await cancelDeletion(event)

    expect(result.success).toBe(true)
    const { data } = global.db.postgres.user.update.mock.calls[0]![0]
    expect(data).toMatchObject({ deletionRequestedAt: null, deletionReminderSent: false })
  })

  it('refuses to act on another account', async () => {
    global.getRouterParam.mockReturnValue('someone-else')

    await expect(cancelDeletion(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('refuses when nothing is pending', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(storedUser())

    await expect(cancelDeletion(event)).rejects.toMatchObject({ statusCode: 409 })
    expect(global.db.postgres.user.update).not.toHaveBeenCalled()
  })

  it('answers 404 for an unknown account', async () => {
    global.db.postgres.user.findUnique.mockResolvedValue(null)

    await expect(cancelDeletion(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('requires authentication', async () => {
    global.getAuthUser.mockImplementation(() => {
      throw { statusCode: 401, statusMessage: 'Unauthorized' }
    })

    await expect(cancelDeletion(event)).rejects.toMatchObject({ statusCode: 401 })
  })
})
