import { getAudioContext, mixToMono } from './context'
import { getLayerBuffer } from './engine'
import { insertBufferCopy, rotateWindow, silentLike, spliceBuffer } from './loopPrep'
import { beatDuration, BEATS_PER_BAR } from './metronome'

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

function highpass(data: Float32Array, sr: number, freq: number): Float32Array {
  const w0 = (2 * Math.PI * freq) / sr
  const cos = Math.cos(w0)
  const alpha = Math.sin(w0) / (2 * 0.707)
  const b0 = (1 + cos) / 2
  const b1 = -(1 + cos)
  const b2 = (1 + cos) / 2
  const a0 = 1 + alpha
  const a1 = -2 * cos
  const a2 = 1 - alpha
  const out = new Float32Array(data.length)
  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  for (let i = 0; i < data.length; i++) {
    const x0 = data[i] ?? 0
    const y0 = (b0 / a0) * x0 + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2
    out[i] = y0
    x2 = x1
    x1 = x0
    y2 = y1
    y1 = y0
  }
  return out
}

/** How much brighter the start of each beat is than the rest of it. The click is that spike. */
function clickContrast(hp: Float32Array, sr: number, bpm: number, offset: number): number {
  const beat = beatDuration(bpm)
  const beats = Math.floor(hp.length / sr / beat)
  if (beats < 2) return 0
  const earlyN = Math.floor(sr * 0.016)
  const lateAt = Math.floor(sr * 0.042)
  const lateN = Math.floor(sr * 0.02)
  const counted = Math.min(beats, 32)
  let total = 0
  for (let i = 0; i < counted; i++) {
    const at = Math.floor(i * beat * sr) + offset
    const early = rms(hp, at, earlyN)
    const late = rms(hp, at + lateAt, lateN)
    total += Math.max(0, early - late * 0.7)
  }
  return total / counted
}

/** Speaker bleed lands later than the grid. One offset fits every beat. */
function findClickOffset(hp: Float32Array, sr: number, bpm: number, hint = 0): number | null {
  const from = Math.floor(sr * -0.03)
  const to = Math.floor(sr * 0.28)
  const coarse = Math.max(1, Math.floor(sr * 0.002))
  let bestAt = Math.floor(hint * sr)
  let best = 0
  for (let offset = from; offset <= to; offset += coarse) {
    const score = clickContrast(hp, sr, bpm, offset)
    if (score > best) {
      best = score
      bestAt = offset
    }
  }
  const fine = Math.max(1, Math.floor(sr * 0.0004))
  for (let offset = bestAt - coarse; offset <= bestAt + coarse; offset += fine) {
    const score = clickContrast(hp, sr, bpm, offset)
    if (score > best) {
      best = score
      bestAt = offset
    }
  }
  if (best < 0.004) return null
  return bestAt
}

function sampleAt(data: Float32Array, idx: number): number {
  if (idx < 0 || idx >= data.length) return 0
  return data[idx] ?? 0
}

/** A click is a bright tick. A kick or a held note is not, so those stay in the take. */
function brightEnough(tmpl: Float32Array, sr: number): boolean {
  const n = Math.max(3, Math.floor(sr * 0.0012))
  let hi = 0
  for (let i = 0; i < tmpl.length; i++) {
    let acc = 0
    let count = 0
    for (let k = -n; k <= n; k++) {
      const j = i + k
      if (j < 0 || j >= tmpl.length) continue
      acc += tmpl[j] ?? 0
      count++
    }
    const fast = (tmpl[i] ?? 0) - acc / Math.max(1, count)
    hi += fast * fast
  }
  let full = 0
  for (let i = 0; i < tmpl.length; i++) full += (tmpl[i] ?? 0) * (tmpl[i] ?? 0)
  const hiR = Math.sqrt(hi / tmpl.length)
  const fullR = Math.sqrt(full / Math.max(1, tmpl.length))
  return hiR > 0.003 && hiR > fullR * 0.45
}

/**
 * The click with the melody taken out.
 * Each beat's note is predicted from the moment just before the tick, so a melody that
 * lands the same way every beat does not get baked into the template.
 */
function clickTemplate(data: Float32Array, starts: number[], win: number, sr: number): Float32Array | null {
  const cols: Float32Array[] = []
  for (const at of starts) {
    const period = estimatePeriod(data, at, sr)
    if (!period) continue
    const res = new Float32Array(win)
    for (let i = 0; i < win; i++) {
      const src = at - period + (i % period)
      res[i] = sampleAt(data, at + i) - sampleAt(data, src)
    }
    cols.push(res)
  }
  if (cols.length < 2 || win < 8) return null
  const tmpl = new Float32Array(win)
  const scratch = new Float32Array(cols.length)
  for (let i = 0; i < win; i++) {
    for (let b = 0; b < cols.length; b++) scratch[b] = cols[b]?.[i] ?? 0
    scratch.sort()
    const mid = cols.length >> 1
    tmpl[i] = cols.length % 2 ? (scratch[mid] ?? 0) : ((scratch[mid - 1] ?? 0) + (scratch[mid] ?? 0)) / 2
  }
  const fadeIn = Math.max(1, Math.floor(sr * 0.0012))
  const fadeOut = Math.max(1, Math.floor(sr * 0.01))
  let energy = 0
  for (let i = 0; i < win; i++) {
    let env = 1
    if (i < fadeIn) env = i / fadeIn
    else if (i > win - fadeOut) env = Math.max(0, (win - i) / fadeOut)
    tmpl[i] = (tmpl[i] ?? 0) * env
    energy += (tmpl[i] ?? 0) * (tmpl[i] ?? 0)
  }
  if (Math.sqrt(energy / win) < 0.003) return null
  if (!brightEnough(tmpl, sr)) return null
  return tmpl
}

function matchScale(data: Float32Array, at: number, tmpl: Float32Array): { scale: number; corr: number } {
  let dot = 0
  let tt = 0
  let ss = 0
  for (let i = 0; i < tmpl.length; i++) {
    const idx = at + i
    const x = idx >= 0 && idx < data.length ? (data[idx] ?? 0) : 0
    const t = tmpl[i] ?? 0
    dot += x * t
    tt += t * t
    ss += x * x
  }
  if (tt < 1e-10 || ss < 1e-10) return { scale: 0, corr: 0 }
  return { scale: Math.min(2.4, Math.max(0, dot / tt)), corr: dot / Math.sqrt(tt * ss) }
}

/** Period of the note just before the tick, so the melody can be continued through it. */
function estimatePeriod(data: Float32Array, clickAt: number, sr: number): number {
  const n = Math.floor(sr * 0.05)
  const start = clickAt - n
  if (start < 8) return 0
  const minLag = Math.max(2, Math.floor(sr / 900))
  const maxLag = Math.min(n - 4, Math.floor(sr / 70))
  let bestLag = 0
  let best = 0
  for (let lag = minLag; lag <= maxLag; lag++) {
    let dot = 0
    let a = 0
    let b = 0
    const m = n - lag
    for (let i = 0; i < m; i += 2) {
      const x = data[start + i] ?? 0
      const y = data[start + i + lag] ?? 0
      dot += x * y
      a += x * x
      b += y * y
    }
    const corr = a > 1e-8 && b > 1e-8 ? dot / Math.sqrt(a * b) : 0
    if (corr > best) {
      best = corr
      bestLag = lag
    }
  }
  return best > 0.5 ? bestLag : 0
}

/**
 * Where the tick was removed, keep the note going by copying the waveform from just before it.
 * Edges fade back to the real recording so the join does not pop.
 */
function continueMelody(data: Float32Array, at: number, tmpl: Float32Array, scale: number, sr: number): void {
  const period = estimatePeriod(data, at, sr)
  if (!period) return
  const n = Math.min(tmpl.length, Math.floor(sr * 0.05))
  let peak = 0
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs((tmpl[i] ?? 0) * scale))
  if (peak < 0.002) return
  for (let i = 0; i < n; i++) {
    const idx = at + i
    const src = at - period + (i % period)
    if (idx < 0 || idx >= data.length || src < 0) continue
    const pred = data[src] ?? 0
    const cur = data[idx] ?? 0
    const strength = Math.abs((tmpl[i] ?? 0) * scale) / peak
    if (strength < 0.12) continue
    const voice = Math.abs(pred)
    const diff = Math.abs(cur - pred)
    if (diff < voice * 0.45 + 0.006) continue
    const edge = Math.sin((Math.PI * (i + 0.5)) / n)
    const w = Math.min(0.92, ((diff - voice * 0.45) / (voice + 0.015)) * 0.55) * edge * strength
    data[idx] = cur * (1 - w) + pred * w
  }
}

function beatStarts(length: number, sr: number, bpm: number, offset: number, win: number, accent: boolean): number[] {
  const beat = beatDuration(bpm)
  const beats = Math.floor(length / sr / beat)
  const starts: number[] = []
  for (let i = 0; i < beats; i++) {
    if ((i % BEATS_PER_BAR === 0) !== accent) continue
    const at = Math.round(i * beat * sr) + offset
    if (at < 0 || at + win >= length) continue
    starts.push(at)
  }
  return starts
}

/**
 * Pull the speaker metronome out of a take.
 * The click is the only sound that lands the same way on every beat, so that shape is lifted off
 * and the note that was underneath is continued through where the tick was.
 */
export function stripClickBleed(buffer: AudioBuffer, bpm: number, latency = 0): AudioBuffer {
  const out = copyBuffer(buffer)
  const sr = buffer.sampleRate
  const mono = mixToMono(out)
  const hp = highpass(mono, sr, 780)
  const offset = findClickOffset(hp, sr, bpm, latency)
  if (offset == null) return out

  const lead = Math.floor(sr * 0.004)
  const win = Math.floor(sr * 0.07)
  const aligned = offset - lead
  for (let c = 0; c < out.numberOfChannels; c++) {
    const data = out.getChannelData(c)
    const groups = [
      { starts: beatStarts(data.length, sr, bpm, aligned, win, false) },
      { starts: beatStarts(data.length, sr, bpm, aligned, win, true) },
    ]
    for (const group of groups) {
      const tmpl = clickTemplate(data, group.starts, win, sr)
      if (!tmpl) continue
      for (const at of group.starts) {
        const period = estimatePeriod(data, at, sr)
        const snippet = new Float32Array(tmpl.length)
        for (let i = 0; i < tmpl.length; i++) {
          const src = period ? at - period + (i % period) : -1
          snippet[i] = sampleAt(data, at + i) - sampleAt(data, src)
        }
        const { scale, corr } = matchScale(snippet, 0, tmpl)
        if (corr < 0.35 || scale < 0.08) continue
        for (let i = 0; i < tmpl.length; i++) {
          const idx = at + i
          if (idx < 0 || idx >= data.length) continue
          data[idx] = (data[idx] ?? 0) - scale * (tmpl[i] ?? 0)
        }
        continueMelody(data, at, tmpl, scale, sr)
      }
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

/** Keep the click-removal source in sync when a section of the take is duplicated. */
export function insertStoredClick(layerId: string, startSec: number, endSec: number): void {
  const source = clickSources.get(layerId)
  if (!source) return
  clickSources.set(layerId, insertBufferCopy(source, startSec, endSec))
}

/** Drop the saved take when the whole section is deleted, so Remove click cannot bring it back. */
export function silenceStoredClick(layerId: string, seconds: number): void {
  const source = clickSources.get(layerId)
  if (!source) return
  clickSources.set(layerId, silentLike(source, seconds))
}
