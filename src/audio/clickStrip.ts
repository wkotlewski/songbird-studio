import { getAudioContext, mixToMono } from './context'
import { getLayerBuffer } from './engine'
import { rotateWindow, spliceBuffer } from './loopPrep'
import { beatDuration, BEATS_PER_BAR, CLICK_FREQ_ACCENT, CLICK_FREQ_BEAT } from './metronome'

function copyBuffer(buffer: AudioBuffer): AudioBuffer {
  const out = getAudioContext().createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  for (let c = 0; c < buffer.numberOfChannels; c++) out.getChannelData(c).set(buffer.getChannelData(c))
  return out
}

function rms(data: Float32Array, start: number, n: number): number {
  let s = 0
  const a = Math.max(0, start)
  const b = Math.min(data.length, start + n)
  const len = Math.max(1, b - a)
  for (let i = a; i < b; i++) s += data[i] * data[i]
  return Math.sqrt(s / len)
}

/** First buffer seen for a layer, so Remove click can run again without digging a deeper hole. */
const clickSources = new Map<string, AudioBuffer>()

type Tone = { re: number; im: number }

function toneAt(data: Float32Array, start: number, n: number, sr: number, freq: number): Tone {
  const from = Math.max(0, start)
  const end = Math.min(data.length, start + n)
  const len = end - from
  if (len < 8 || freq < 40 || freq > sr * 0.45) return { re: 0, im: 0 }
  const w = (2 * Math.PI * freq) / sr
  let re = 0
  let im = 0
  for (let i = from; i < end; i++) {
    const t = i - from
    const x = data[i]
    re += x * Math.cos(w * t)
    im -= x * Math.sin(w * t)
  }
  return { re: (2 * re) / len, im: (2 * im) / len }
}

function mag(tone: Tone): number {
  return Math.hypot(tone.re, tone.im)
}

/** Click minus whatever tone is still ringing later in the beat — leaves a sung note alone. */
function excessAt(data: Float32Array, start: number, sr: number, freq: number): Tone {
  const early = toneAt(data, start, Math.floor(sr * 0.024), sr, freq)
  const late = toneAt(data, start + Math.floor(sr * 0.09), Math.floor(sr * 0.03), sr, freq)
  return { re: early.re - late.re, im: early.im - late.im }
}

function scoreFreq(data: Float32Array, sr: number, bpm: number, freq: number): number {
  const beat = beatDuration(bpm)
  const beats = Math.max(1, Math.floor(data.length / sr / beat))
  const counted = Math.min(beats, 24)
  const shifts = [0, Math.floor(sr * 0.02), Math.floor(sr * 0.045), Math.floor(sr * 0.07)]
  let total = 0
  for (let i = 0; i < counted; i++) {
    const at = Math.floor(i * beat * sr)
    let best = 0
    for (const shift of shifts) best = Math.max(best, mag(excessAt(data, at + shift, sr, freq)))
    total += best
  }
  return total / counted
}

function nearestClickFreq(data: Float32Array, sr: number, bpm: number, nominal: number): number {
  let bestF = nominal
  let best = 0
  const scan = (from: number, to: number, step: number) => {
    for (let freq = from; freq <= to; freq += step) {
      const score = scoreFreq(data, sr, bpm, freq)
      if (score > best) {
        best = score
        bestF = freq
      }
    }
  }
  scan(nominal * 0.8, nominal * 1.2, nominal * 0.02)
  scan(bestF - nominal * 0.02, bestF + nominal * 0.02, nominal * 0.004)
  return bestF
}

function subtractTone(data: Float32Array, start: number, n: number, sr: number, freq: number, tone: Tone): void {
  const early = toneAt(data, start, Math.floor(sr * 0.024), sr, freq)
  const excess = mag(tone)
  const earlyMag = mag(early)
  if (excess < 0.0015 || excess < earlyMag * 0.3) return
  const scale = Math.min(1, earlyMag / (excess + 1e-8))
  const w = (2 * Math.PI * freq) / sr
  const attack = Math.max(1, Math.floor(sr * 0.002))
  const hold = Math.floor(sr * 0.018)
  for (let i = 0; i < n; i++) {
    const idx = start + i
    if (idx < 0 || idx >= data.length) continue
    let env = 1
    if (i < attack) env = i / attack
    else if (i > hold) env = Math.exp((-4.5 * (i - hold)) / Math.max(1, n - hold))
    const sample = tone.re * Math.cos(w * i) - tone.im * Math.sin(w * i)
    data[idx] -= scale * sample * env
  }
}

function softenTick(data: Float32Array, start: number, sr: number): void {
  const n = Math.floor(sr * 0.008)
  const head = rms(data, start, n)
  const tail = rms(data, start + Math.floor(sr * 0.02), Math.floor(sr * 0.04))
  if (head < 0.02 || head < tail * 1.8) return
  const fade = Math.max(4, n >> 2)
  for (let i = 0; i < n; i++) {
    const idx = start + i
    if (idx < 0 || idx >= data.length) continue
    const w = i < fade ? 0.45 + 0.55 * (i / fade) : 0.45
    data[idx] *= w
  }
}

/**
 * Pull speaker-bleed metronome ticks out of a take.
 * Works on a recording you already have: each beat loses only the short click tone, not a note that keeps ringing.
 */
export function stripClickBleed(buffer: AudioBuffer, bpm: number, latency = 0): AudioBuffer {
  const out = copyBuffer(buffer)
  const sr = buffer.sampleRate
  const mono = mixToMono(out)
  const beatFreq = nearestClickFreq(mono, sr, bpm, CLICK_FREQ_BEAT)
  const accentFreq = nearestClickFreq(mono, sr, bpm, CLICK_FREQ_ACCENT)
  const beat = beatDuration(bpm)
  const span = Math.floor(sr * 0.07)
  const hop = Math.max(8, Math.floor(sr * 0.002))
  const harmonics = [1, 3, 5, 7]

  for (let t = 0; t < out.duration + beat; t += beat) {
    const index = Math.round(t / beat)
    const nominal = index % BEATS_PER_BAR === 0 ? accentFreq : beatFreq
    let bestAt = Math.floor(t * sr)
    let best = 0
    const from = Math.floor((t + Math.min(latency, 0.08) - 0.04) * sr)
    const to = Math.floor((t + Math.min(latency, 0.08) + 0.06) * sr)
    for (let s = from; s <= to; s += hop) {
      const score = mag(excessAt(mono, s, sr, nominal))
      if (score > best) {
        best = score
        bestAt = s
      }
    }
    if (best < 0.004) continue
    for (let c = 0; c < out.numberOfChannels; c++) {
      const data = out.getChannelData(c)
      for (const h of harmonics) {
        const freq = nominal * h
        if (freq > sr * 0.45) break
        subtractTone(data, bestAt, span, sr, freq, excessAt(data, bestAt, sr, freq))
      }
      softenTick(data, bestAt, sr)
    }
  }
  return out
}

export async function cleanLiveTake(buffer: AudioBuffer, bpm: number, latency = 0): Promise<AudioBuffer> {
  return stripClickBleed(buffer, bpm, latency)
}

/** Strip click bleed from the layer's original take. Repeating it does not stack the cut. */
export function stripStoredClick(layerId: string, bpm: number, latency = 0): AudioBuffer | null {
  const current = getLayerBuffer(layerId)
  if (!current) return null
  if (!clickSources.has(layerId)) clickSources.set(layerId, copyBuffer(current))
  const source = clickSources.get(layerId)
  if (!source) return null
  return stripClickBleed(source, bpm, latency)
}

/** Keep the click-removal source lined up with a take the user has slid on the grid. */
export function nudgeStoredClick(layerId: string, offsetSec: number, windowSec: number): void {
  const source = clickSources.get(layerId)
  if (!source) return
  clickSources.set(layerId, rotateWindow(source, offsetSec, windowSec))
}

/** Keep the click-removal source in sync when a stretch of the take is deleted. */
export function spliceStoredClick(layerId: string, startSec: number, endSec: number): void {
  const source = clickSources.get(layerId)
  if (!source) return
  clickSources.set(layerId, spliceBuffer(source, startSec, endSec))
}
