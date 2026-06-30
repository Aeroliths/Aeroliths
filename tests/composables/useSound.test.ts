import { describe, it, expect, beforeEach } from 'vitest'
import { useSound } from '../../app/composables/useSound'

describe('useSound settings', () => {
  beforeEach(() => localStorage.clear())

  it('persists mute state to localStorage', () => {
    const s = useSound()
    const before = s.muted.value
    s.toggleMute()
    expect(s.muted.value).toBe(!before)
    expect(JSON.parse(localStorage.getItem('aeroliths.sound')!).muted).toBe(!before)
  })

  it('clamps volume to 0..1 and persists it', () => {
    const s = useSound()
    s.setVolume(2)
    expect(s.volume.value).toBe(1)
    s.setVolume(-1)
    expect(s.volume.value).toBe(0)
    expect(JSON.parse(localStorage.getItem('aeroliths.sound')!).volume).toBe(0)
  })

  it('play() does not throw', () => {
    const s = useSound()
    expect(() => s.play('place')).not.toThrow()
  })
})
