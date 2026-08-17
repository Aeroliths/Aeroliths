import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockResolveMx } = vi.hoisted(() => ({ mockResolveMx: vi.fn() }))

vi.mock('node:dns/promises', () => ({
  resolveMx: mockResolveMx,
  default: { resolveMx: mockResolveMx },
}))

const { validateEmailTrust } = await import('~~/server/utils/email-validation')

const VALID_MX = [{ exchange: 'mx.example.com', priority: 10 }]

describe('validateEmailTrust', () => {
  beforeEach(() => {
    mockResolveMx.mockReset()
  })

  it('rejects a known disposable domain', async () => {
    const result = await validateEmailTrust('throwaway@yopmail.com')
    expect(result).toBe(
      'Disposable email addresses are not allowed. Please use a permanent email address.'
    )
    expect(mockResolveMx).not.toHaveBeenCalled()
  })

  it('rejects another disposable domain', async () => {
    const result = await validateEmailTrust('user@mailinator.com')
    expect(result).toMatch(/Disposable email addresses/)
  })

  it('treats disposable domain match as case-insensitive', async () => {
    const result = await validateEmailTrust('User@YOPMAIL.COM')
    expect(result).toMatch(/Disposable email addresses/)
  })

  it('accepts a legitimate domain that has MX records', async () => {
    mockResolveMx.mockResolvedValueOnce(VALID_MX)
    const result = await validateEmailTrust('real.user@gmail.com')
    expect(result).toBeNull()
  })

  it('rejects a domain whose lookup throws ENOTFOUND', async () => {
    const err: any = new Error('not found')
    err.code = 'ENOTFOUND'
    mockResolveMx.mockRejectedValueOnce(err)

    const result = await validateEmailTrust('user@asdfqwer123.invalid')
    expect(result).toBe(
      'This email domain does not appear to be valid. Please check the spelling.'
    )
  })

  it('rejects a domain whose lookup throws ENODATA', async () => {
    const err: any = new Error('no data')
    err.code = 'ENODATA'
    mockResolveMx.mockRejectedValueOnce(err)

    const result = await validateEmailTrust('user@no-mail-here.example')
    expect(result).toMatch(/does not appear to be valid/)
  })

  it('rejects a domain that returns no MX records', async () => {
    mockResolveMx.mockResolvedValueOnce([])
    const result = await validateEmailTrust('user@empty-mx.example')
    expect(result).toMatch(/does not appear to be valid/)
  })

  it('fails open when DNS errors with a transient code (e.g., ETIMEOUT)', async () => {
    const err: any = new Error('timed out')
    err.code = 'ETIMEOUT'
    mockResolveMx.mockRejectedValueOnce(err)

    const result = await validateEmailTrust('user@some-real-domain.example')
    expect(result).toBeNull()
  })

  it('returns null for malformed input (defers to caller regex)', async () => {
    expect(await validateEmailTrust('notanemail')).toBeNull()
    expect(await validateEmailTrust('')).toBeNull()
    expect(await validateEmailTrust('@')).toBeNull()
    expect(await validateEmailTrust('user@')).toBeNull()
    expect(mockResolveMx).not.toHaveBeenCalled()
  })

  it('caches MX results so a second call to the same domain skips DNS', async () => {
    mockResolveMx.mockResolvedValueOnce(VALID_MX)

    const first = await validateEmailTrust('a@cache-test-1.example')
    const second = await validateEmailTrust('b@cache-test-1.example')

    expect(first).toBeNull()
    expect(second).toBeNull()
    expect(mockResolveMx).toHaveBeenCalledTimes(1)
  })

  it('caches negative MX results too', async () => {
    const err: any = new Error('not found')
    err.code = 'ENOTFOUND'
    mockResolveMx.mockRejectedValueOnce(err)

    const first = await validateEmailTrust('a@cache-test-2.example')
    const second = await validateEmailTrust('b@cache-test-2.example')

    expect(first).toMatch(/does not appear to be valid/)
    expect(second).toMatch(/does not appear to be valid/)
    expect(mockResolveMx).toHaveBeenCalledTimes(1)
  })
})
