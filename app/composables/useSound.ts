import { ref } from 'vue'

type SoundName = 'place' | 'capture' | 'win'

const STORAGE_KEY = 'aeroliths.sound'

// Module-level singletons so all callers share settings + audio context.
const muted = ref(false)
const volume = ref(0.6)
let loaded = false
let ctx: AudioContext | null = null
const fileCache = new Map<SoundName, HTMLAudioElement | null>()

function loadSettings() {
  if (loaded) return
  loaded = true
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const v = JSON.parse(raw)
      if (typeof v.muted === 'boolean') muted.value = v.muted
      if (typeof v.volume === 'number') volume.value = Math.min(1, Math.max(0, v.volume))
    }
  } catch {
    /* ignore malformed settings */
  }
}

function save() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ muted: muted.value, volume: volume.value }))
}

// Synthesized fallback cue per sound.
function synth(name: SoundName) {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx = ctx ?? new Ctor()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const freq = name === 'place' ? 440 : name === 'capture' ? 660 : 880
    osc.frequency.value = freq
    osc.type = name === 'win' ? 'triangle' : 'square'
    gain.gain.value = 0.0001
    osc.connect(gain).connect(ctx.destination)
    const t = ctx.currentTime
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume.value), t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (name === 'win' ? 0.5 : 0.15))
    osc.start(t)
    osc.stop(t + (name === 'win' ? 0.5 : 0.15))
  } catch {
    /* Web Audio unavailable (e.g. tests) — ignore */
  }
}

function playFileOrSynth(name: SoundName) {
  // Try a bundled file once; on any failure, fall back to synth.
  if (!fileCache.has(name)) {
    try {
      const audio = new Audio(`/sounds/${name}.mp3`)
      audio.addEventListener('error', () => fileCache.set(name, null))
      fileCache.set(name, audio)
    } catch {
      fileCache.set(name, null)
    }
  }
  const cached = fileCache.get(name)
  if (cached) {
    try {
      cached.volume = volume.value
      cached.currentTime = 0
      const p = cached.play()
      if (p && typeof p.catch === 'function') p.catch(() => synth(name))
      return
    } catch {
      /* fall through to synth */
    }
  }
  synth(name)
}

export function useSound() {
  loadSettings()

  function play(name: SoundName) {
    if (muted.value) return
    playFileOrSynth(name)
  }
  function toggleMute() {
    muted.value = !muted.value
    save()
  }
  function setVolume(v: number) {
    volume.value = Math.min(1, Math.max(0, v))
    save()
  }

  return { play, muted, volume, toggleMute, setVolume }
}
