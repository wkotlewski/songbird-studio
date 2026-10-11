const SR = 44100

function mulberry32(seed) {
  let state = seed >>> 0
  return function rand() {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(text) {
  return [...text].reduce((sum, char) => (sum * 33 + char.charCodeAt(0)) >>> 0, 7)
}

function hzOf(midi) {
  return 440 * 2 ** ((midi - 69) / 12)
}

function midiOf(token) {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(token)
  if (!match) throw new Error(`Unknown note ${token}`)
  const names = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  let semi = names[match[1]]
  if (match[2] === "#") semi += 1
  if (match[2] === "b") semi -= 1
  return (Number(match[3]) + 1) * 12 + semi
}

function notesFrom(spec, bpm) {
  const beat = 60 / bpm
  let time = 0
  const notes = []
  for (const token of spec.split(/\s+/).filter(Boolean)) {
    const [pitch, length] = token.split("/")
    const beats = length ? Number(length) : 1
    const slot = beats * beat
    if (pitch !== "R") notes.push({ midi: midiOf(pitch), time, dur: slot * 0.92 })
    time += slot
  }
  return { notes, duration: time }
}

function silence(duration) {
  return new Float32Array(Math.ceil(duration * SR))
}

function normalize(samples, peak = 0.85) {
  let max = 0
  for (let i = 0; i < samples.length; i++) max = Math.max(max, Math.abs(samples[i]))
  if (max < 1e-5) return samples
  const gain = peak / max
  for (let i = 0; i < samples.length; i++) samples[i] *= gain
  return samples
}

function fadeEdges(samples, ms = 14) {
  const count = Math.min(samples.length >> 1, Math.floor((SR * ms) / 1000))
  for (let i = 0; i < count; i++) {
    const gain = i / count
    samples[i] *= gain
    samples[samples.length - 1 - i] *= gain
  }
  return samples
}

function renderVoice(notes, duration, kind, rng) {
  const out = silence(duration)
  for (const note of notes) {
    const start = Math.floor(note.time * SR)
    const length = Math.max(1, Math.floor(note.dur * SR))
    const freq = hzOf(note.midi)
    let phase = 0
    for (let i = 0; i < length && start + i < out.length; i++) {
      const t = i / SR
      const wobble = kind === "bass" || kind === "boom" ? 0 : Math.sin(2 * Math.PI * 4.4 * (note.time + t)) * 0.007
      phase += (2 * Math.PI * freq * (1 + wobble)) / SR
      let sample = Math.sin(phase)
      if (kind === "sing") sample += Math.sin(phase * 2) * 0.42 + Math.sin(phase * 3) * 0.2 + Math.sin(phase * 4) * 0.08
      else if (kind === "hum") sample += Math.sin(phase * 2) * 0.22 + Math.sin(phase * 3) * 0.08 + (rng() * 2 - 1) * 0.025
      else sample += Math.sin(phase * 2) * 0.18
      let env = 1
      if (kind === "boom") env = Math.exp(-t * 7.5)
      else if (kind === "bass") env = Math.exp(-t * 2.6)
      else env = Math.min(1, t / 0.045) * Math.min(1, (note.dur - t) / 0.09)
      if (kind === "boom" && t < 0.012) sample += (rng() * 2 - 1) * (1 - t / 0.012) * 0.55
      out[start + i] += sample * env * 0.45
    }
  }
  return out
}

function renderTicks(times, duration, rng, soft) {
  const out = silence(duration)
  for (const time of times) {
    const bursts = soft ? [0, 0.007] : [0, 0.006, 0.013]
    for (const burst of bursts) {
      const start = Math.floor((time + burst) * SR)
      const length = Math.floor(SR * (soft ? 0.045 : 0.055))
      let previous = 0
      for (let i = 0; i < length && start + i < out.length; i++) {
        const t = i / SR
        const noise = rng() * 2 - 1
        const high = noise - previous
        previous = noise
        out[start + i] += high * Math.exp(-t * (soft ? 48 : 36)) * (soft ? 0.35 : 0.7)
      }
    }
  }
  return out
}

function renderBeatbox(notes, duration, bpm, rng) {
  const out = renderVoice(notes, duration, "boom", rng)
  const step = 30 / bpm
  for (let time = step; time < duration - 0.05; time += step) {
    const start = Math.floor(time * SR)
    const length = Math.floor(SR * 0.03)
    let previous = 0
    for (let i = 0; i < length && start + i < out.length; i++) {
      const noise = rng() * 2 - 1
      const high = noise - previous
      previous = noise
      out[start + i] += high * Math.exp((-i / SR) * 70) * 0.25
    }
  }
  return out
}

function renderPiano(notes, duration) {
  const out = silence(duration)
  for (const note of notes) {
    const start = Math.floor(note.time * SR)
    const length = Math.min(out.length - start, Math.floor(Math.max(note.dur, 0.85) * SR))
    const freq = hzOf(note.midi)
    const phases = [0, 0, 0, 0, 0, 0]
    for (let i = 0; i < length; i++) {
      const t = i / SR
      let sample = 0
      for (let harmonic = 1; harmonic <= 6; harmonic++) {
        phases[harmonic - 1] += (2 * Math.PI * freq * harmonic) / SR
        sample += (Math.sin(phases[harmonic - 1]) * Math.exp(-t * (1.5 + harmonic * 1.25))) / harmonic
      }
      const hammer = t < 0.008 ? 1 - t / 0.008 : 0
      out[start + i] += sample * 0.55 + hammer * 0.08
    }
  }
  return out
}

function renderGuitar(notes, duration, rng) {
  const out = silence(duration)
  for (const note of notes) {
    const freq = hzOf(note.midi)
    const period = Math.max(2, Math.round(SR / freq))
    const delay = new Float32Array(period)
    for (let i = 0; i < period; i++) delay[i] = rng() * 2 - 1
    const length = Math.min(out.length - Math.floor(note.time * SR), Math.floor(Math.max(note.dur, 0.7) * SR))
    const start = Math.floor(note.time * SR)
    let index = 0
    let previous = 0
    for (let i = 0; i < length; i++) {
      const sample = delay[index]
      const filtered = (sample + previous) * 0.5 * 0.994
      previous = sample
      delay[index] = filtered
      index = (index + 1) % period
      const t = i / SR
      out[start + i] += filtered * Math.min(1, t / 0.004) * 0.7
    }
  }
  return out
}

function renderBass(notes, duration) {
  const out = silence(duration)
  for (const note of notes) {
    const start = Math.floor(note.time * SR)
    const length = Math.min(out.length - start, Math.floor(Math.max(note.dur, 0.35) * SR))
    const freq = hzOf(note.midi)
    let phase = 0
    for (let i = 0; i < length; i++) {
      const t = i / SR
      phase += (2 * Math.PI * freq) / SR
      const sample = Math.sin(phase) * 0.85 + Math.sin(phase * 2) * 0.12
      out[start + i] += sample * Math.exp(-t * 2.4) * 0.7
    }
  }
  return out
}

function renderHit(kind, rng) {
  const length = Math.floor(SR * (kind === "hat" ? 0.05 : kind === "snare" ? 0.18 : 0.22))
  const out = new Float32Array(length)
  let phase = 0
  let previous = 0
  for (let i = 0; i < length; i++) {
    const t = i / SR
    if (kind === "kick") {
      const freq = 48 + 130 * Math.exp(-t * 28)
      phase += (2 * Math.PI * freq) / SR
      out[i] = Math.sin(phase) * Math.exp(-t * 16) * 0.95
    } else if (kind === "snare") {
      const noise = rng() * 2 - 1
      phase += (2 * Math.PI * 190) / SR
      out[i] = noise * Math.exp(-t * 22) * 0.55 + Math.sin(phase) * Math.exp(-t * 28) * 0.25
    } else {
      const noise = rng() * 2 - 1
      const high = noise - previous
      previous = noise
      out[i] = high * Math.exp(-t * 55) * 0.4
    }
  }
  return out
}

function renderDrums(hits, duration, rng) {
  const out = silence(duration)
  for (const hit of hits) {
    const hitSound = renderHit(hit.kind, rng)
    const start = Math.floor(hit.time * SR)
    for (let i = 0; i < hitSound.length && start + i < out.length; i++) out[start + i] += hitSound[i]
  }
  return out
}

function downsample(samples) {
  const ratio = 4
  const target = SR / ratio
  const length = Math.floor(samples.length / ratio)
  const out = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    let sum = 0
    const base = i * ratio
    for (let j = 0; j < ratio; j++) sum += samples[base + j] || 0
    out[i] = sum / ratio
  }
  return { samples: out, sampleRate: target }
}

function yinPitch(frame, sampleRate, minHz, maxHz) {
  const minLag = Math.max(2, Math.floor(sampleRate / maxHz))
  const maxLag = Math.min(frame.length - 2, Math.floor(sampleRate / minHz))
  if (maxLag <= minLag) return null
  const diff = new Float32Array(maxLag + 1)
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0
    for (let i = 0; i < frame.length - lag; i++) {
      const delta = frame[i] - frame[i + lag]
      sum += delta * delta
    }
    diff[lag] = sum
  }
  const cmnd = new Float32Array(maxLag + 1)
  cmnd[0] = 1
  let running = 0
  for (let lag = 1; lag <= maxLag; lag++) {
    running += diff[lag]
    cmnd[lag] = running ? (diff[lag] * lag) / running : 1
  }
  let lag = -1
  for (let i = minLag; i <= maxLag; i++) {
    if (cmnd[i] < 0.18) {
      lag = i
      while (lag + 1 <= maxLag && cmnd[lag + 1] < cmnd[lag]) lag += 1
      break
    }
  }
  if (lag < 0 || cmnd[lag] > 0.28) return null
  return sampleRate / lag
}

function detectNotes(samples, options = {}) {
  const minHz = options.minHz ?? 70
  const maxHz = options.maxHz ?? 900
  const source = options.lowpass ? lowpass(samples, options.lowpass) : samples
  const down = downsample(source)
  const win = 1024
  const hop = 256
  const frames = []
  for (let start = 0; start + win < down.samples.length; start += hop) {
    let energy = 0
    for (let i = 0; i < win; i += 4) energy += down.samples[start + i] ** 2
    if (energy / (win / 4) < (options.minEnergy ?? 0.0004)) {
      frames.push(null)
      continue
    }
    const frame = down.samples.subarray(start, start + win)
    const hz = yinPitch(frame, down.sampleRate, minHz, maxHz)
    frames.push(hz ? Math.round(69 + 12 * Math.log2(hz / 440)) : null)
  }
  const notes = []
  let current = null
  const hopSec = hop / down.sampleRate
  const close = (end) => {
    if (current && end - current.time > 0.11) notes.push({ midi: current.midi, time: current.time, dur: end - current.time })
    current = null
  }
  frames.forEach((midi, index) => {
    const time = index * hopSec
    if (midi == null) {
      close(time)
      return
    }
    if (!current) current = { midi, time }
    else if (midi !== current.midi) {
      close(time)
      current = { midi, time }
    }
  })
  close(frames.length * hopSec)
  return notes
}

function lowpass(samples, hz) {
  const out = new Float32Array(samples.length)
  const alpha = (2 * Math.PI * hz) / SR / (1 + (2 * Math.PI * hz) / SR)
  let y = 0
  for (let i = 0; i < samples.length; i++) {
    y += alpha * (samples[i] - y)
    out[i] = y
  }
  return out
}

function detectOnsets(samples) {
  const hop = Math.floor(SR * 0.008)
  const times = []
  let previous = 0
  for (let i = 0; i + hop < samples.length; i += hop) {
    let low = 0
    let high = 0
    let last = samples[i] || 0
    for (let j = 0; j < hop; j += 2) {
      const sample = samples[i + j] || 0
      low += sample * sample
      const diff = sample - last
      high += diff * diff
      last = sample
    }
    const body = Math.sqrt(low / (hop / 2))
    const edge = Math.sqrt(high / (hop / 2))
    const bright = edge > 0.03 && edge > body * 0.9
    if (bright && edge > previous * 1.55 && (!times.length || i / SR - times[times.length - 1] > 0.08)) times.push(i / SR)
    previous = edge * 0.55 + previous * 0.45
  }
  return times
}

function detectPulses(samples) {
  const hop = Math.floor(SR * 0.01)
  const times = []
  let previous = 0
  for (let i = 0; i + hop < samples.length; i += hop) {
    let energy = 0
    for (let j = 0; j < hop; j += 2) energy += (samples[i + j] || 0) ** 2
    energy = Math.sqrt(energy / (hop / 2))
    const last = times.length ? times[times.length - 1] : -1
    if (energy > 0.11 && energy > previous * 1.75 && i / SR - last > 0.18) times.push(i / SR)
    previous = previous * 0.45 + energy * 0.55
  }
  return times
}

function mergeTimes(groups) {
  return groups
    .flat()
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => a - b)
    .filter((time, index, all) => index === 0 || time - all[index - 1] > 0.05)
}

function alignScore(times, period) {
  if (!times.length || period <= 0) return 0
  const origin = times[0]
  let hits = 0
  for (const time of times) {
    const pos = (time - origin) / period
    const onBeat = Math.abs(pos - Math.round(pos))
    const onHalf = Math.abs(pos * 2 - Math.round(pos * 2))
    if (onBeat < 0.18 || onHalf < 0.18) hits += 1
  }
  return hits / times.length
}

function tempoFromTimes(times) {
  if (!times || times.length < 4) return null
  const gaps = []
  for (let i = 1; i < times.length; i++) {
    const gap = times[i] - times[i - 1]
    if (gap >= 0.18 && gap <= 2) gaps.push(gap)
  }
  if (gaps.length < 3) return null
  const sorted = gaps.slice().sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  let bpm = Math.round(60 / median)
  if (bpm > 180) bpm = Math.round(bpm / 2)
  if (bpm > 180) bpm = Math.round(bpm / 2)
  if (bpm < 56) bpm *= 2
  if (bpm < 56) bpm *= 2
  bpm = Math.min(180, Math.max(56, bpm))
  let best = null
  for (let candidate = bpm - 5; candidate <= bpm + 5; candidate++) {
    if (candidate < 56 || candidate > 180) continue
    const score = alignScore(times, 60 / candidate)
    const closer = best && Math.abs(score - best.score) <= 0.02 && Math.abs(candidate - bpm) < Math.abs(best.bpm - bpm)
    if (!best || score > best.score + 0.02 || closer) best = { bpm: candidate, score }
  }
  if (!best || best.score < 0.68) return null
  return best
}

function tempoFromAudio(samples, sampleRate, mode = "any") {
  const audio = toEngineRate(samples, sampleRate || SR).subarray(0, SR * 40)
  let times = []
  if (mode !== "melody") times = mergeTimes([detectOnsets(audio), detectPulses(audio)])
  if (mode === "melody" || (mode === "any" && times.length < 4)) {
    const notes = detectNotes(audio).map((note) => note.time)
    times = mode === "melody" ? notes : mergeTimes([times, notes])
  }
  const found = tempoFromTimes(times)
  return found ? { bpm: found.bpm, score: found.score } : null
}

function hitsFromOnsets(times, bpm) {
  const beat = 60 / bpm
  const seen = new Set()
  const hits = []
  for (const time of times) {
    const index = Math.max(0, Math.round(time / beat))
    if (Math.abs(time - index * beat) > 0.14) continue
    if (seen.has(index)) continue
    seen.add(index)
    const place = index % 4
    const kind = place === 0 || place === 2 ? "kick" : "snare"
    hits.push({ time: index * beat, kind })
  }
  return hits
}

function guessKey(notes) {
  const classes = notes.map((note) => ((note.midi % 12) + 12) % 12)
  let bestRoot = 0
  let bestScore = -1
  for (let root = 0; root < 12; root++) {
    const scale = new Set([0, 2, 4, 5, 7, 9, 11].map((step) => (step + root) % 12))
    const score = classes.filter((pitch) => scale.has(pitch)).length
    if (score > bestScore) {
      bestScore = score
      bestRoot = root
    }
  }
  return bestRoot
}

function transposeDiatonic(midi, steps, keyRoot) {
  const major = [0, 2, 4, 5, 7, 9, 11]
  const rel = midi - keyRoot
  const oct = Math.floor(rel / 12)
  const pitchClass = ((rel % 12) + 12) % 12
  let index = major.indexOf(pitchClass)
  if (index < 0) {
    let nearest = 0
    let distance = 99
    major.forEach((pitch, i) => {
      const delta = Math.min(Math.abs(pitch - pitchClass), 12 - Math.abs(pitch - pitchClass))
      if (delta < distance) {
        distance = delta
        nearest = i
      }
    })
    index = nearest
  }
  const total = oct * 7 + index + steps
  const nextOct = Math.floor(total / 7)
  const nextIndex = ((total % 7) + 7) % 7
  return keyRoot + nextOct * 12 + major[nextIndex]
}

function renderChoir(notes, duration, keyRoot, rng) {
  const voices = [0, 2, 4].map((steps, index) => {
    const shifted = notes.map((note) => ({
      midi: transposeDiatonic(note.midi, steps, keyRoot) + (index === 0 ? 0 : (index === 1 ? 0.06 : -0.05)),
      time: note.time,
      dur: note.dur,
    }))
    return renderVoice(shifted, duration, "sing", rng)
  })
  const out = silence(duration)
  for (let i = 0; i < out.length; i++) out[i] = voices[0][i] * 0.42 + voices[1][i] * 0.34 + voices[2][i] * 0.3
  return out
}

function coverage(written, detected) {
  if (!written.length) return 0
  let hits = 0
  for (const note of written) {
    const mid = note.time + Math.min(note.dur * 0.45, 0.25)
    let best = 99
    for (const found of detected) {
      if (mid < found.time - 0.06 || mid > found.time + found.dur + 0.08) continue
      best = Math.min(best, Math.abs(found.midi - Math.round(note.midi)))
    }
    if (best <= 1) hits += 1
  }
  return hits / written.length
}

function toEngineRate(samples, sampleRate) {
  if (!sampleRate || sampleRate === SR) return samples
  const length = Math.max(1, Math.floor((samples.length * SR) / sampleRate))
  const out = new Float32Array(length)
  const ratio = sampleRate / SR
  for (let i = 0; i < length; i++) {
    const pos = i * ratio
    const index = Math.floor(pos)
    const frac = pos - index
    const a = samples[index] || 0
    const b = samples[Math.min(samples.length - 1, index + 1)] || 0
    out[i] = a + (b - a) * frac
  }
  return out
}

function transformAudio(samples, kind, options = {}) {
  samples = toEngineRate(samples, options.sampleRate || SR)
  const cap = SR * 40
  if (samples.length > cap) samples = samples.subarray(0, cap)
  const bpm = options.bpm || 92
  const duration = samples.length / SR
  const rng = options.rng || mulberry32(1)
  if (kind === "Drums") {
    const hits = hitsFromOnsets(detectOnsets(samples), bpm)
    if (hits.length < 2) return null
    return { samples: finish(renderDrums(hits, duration, rng)), proof: { hits } }
  }
  if (kind === "Bass") {
    const notes = detectNotes(samples, { minHz: 40, maxHz: 180, lowpass: 220, minEnergy: 0.00015 })
    if (!notes.length) return null
    return { samples: finish(renderBass(notes, duration)), proof: { notes } }
  }
  const notes = detectNotes(samples)
  if (notes.length < 2) return null
  if (kind === "Piano") return { samples: finish(renderPiano(notes, duration)), proof: { notes } }
  if (kind === "Guitar") return { samples: finish(renderGuitar(notes, duration, rng)), proof: { notes } }
  if (kind === "Choir") {
    const key = options.key == null ? guessKey(notes) : options.key
    return { samples: finish(renderChoir(notes, duration, key, rng)), proof: { notes, key } }
  }
  return null
}

function finish(samples) {
  fadeEdges(samples)
  return normalize(samples, 0.8)
}

function layer(name, sound, from, color, gain, pan, samples) {
  return { name, sound, from, color, gain, pan, samples: finish(samples) }
}

function clapTimes(bpm, beats, rng, wobble) {
  const step = 60 / bpm
  const times = []
  for (let i = 0; i < beats; i++) {
    const nudge = i === 0 ? 0 : (rng() * 2 - 1) * wobble
    times.push(Math.max(0, i * step + nudge))
  }
  return times
}

function balance(layers) {
  const length = layers[0].samples.length
  let peak = 0
  for (let i = 0; i < length; i += 4) {
    let sum = 0
    for (const item of layers) sum += item.samples[i] * item.gain
    peak = Math.max(peak, Math.abs(sum))
  }
  if (peak > 0.92) {
    const gain = 0.92 / peak
    for (const item of layers) item.gain = Math.round(item.gain * gain * 100) / 100
  }
  return layers
}

function makeExample(id) {
  const songs = {
    ella: {
      lengthSec: 60,
      shape: "chorus",
      intent: "chorus",
      bpm: 108,
      blurb: "Ella's Happy Song is a child's song. Her claps stay, and they also become a drum kit. Her humming stays, and it also becomes piano. Press play, then mute a layer to compare.",
      build(rng) {
        const bpm = 108
        const { notes, duration } = notesFrom("C4 E4 G4 G4 A4 G4 F4 E4 D4 E4 F4 G4 E4 D4 C4 C4", bpm)
        const hum = renderVoice(notes, duration, "hum", rng)
        const claps = renderTicks(clapTimes(bpm, 16, rng, 0.018), duration, rng, false)
        const piano = transformAudio(hum, "Piano", { rng })
        const drums = transformAudio(claps, "Drums", { bpm, rng })
        return {
          duration,
          layers: balance([
            layer("Ella's claps", "Claps", "original", "#ffd89a", 0.42, -0.15, claps),
            layer("Drum kit", "Drums", "from the claps", "#3d7eff", 0.62, 0, drums.samples),
            layer("Ella's humming", "Voice", "original", "#1fbfa7", 0.48, 0.1, hum),
            layer("Piano", "Piano", "from the humming", "#f0a202", 0.4, 0.2, piano.samples),
          ]),
          proof: { melody: coverage(notes, piano.proof.notes), drums: drums.proof.hits },
        }
      },
    },
    grandpa: {
      lengthSec: 180,
      shape: "arc",
      intent: "soft",
      bpm: 72,
      blurb: "Grandpa's Sunday Song starts soft, builds, and eases out. His humming stays. Guitar and choir are separate layers made from that humming. Press play, then mute a layer to compare.",
      build(rng) {
        const bpm = 72
        const { notes, duration } = notesFrom("G4/2 B4/2 D5/2 C5/2 B4/2 A4/2 G4/2 G4/2", bpm)
        const hum = renderVoice(notes, duration, "hum", rng)
        const guitar = transformAudio(hum, "Guitar", { rng })
        const choir = transformAudio(hum, "Choir", { key: 7, rng })
        return {
          duration,
          layers: balance([
            layer("Grandpa's humming", "Voice", "original", "#1fbfa7", 0.58, 0, hum),
            layer("Guitar", "Guitar", "from the humming", "#ff8ab0", 0.36, -0.28, guitar.samples),
            layer("Choir", "Choir", "from the humming", "#b44dff", 0.4, 0.32, choir.samples),
          ]),
          proof: { melody: coverage(notes, guitar.proof.notes), choir: coverage(notes, choir.proof.notes) },
        }
      },
    },
    family: {
      lengthSec: 120,
      shape: "chorus",
      intent: "chorus",
      bpm: 96,
      blurb: "Our Family Song keeps two voices separate, the way two people recorded them. The claps stay, and they also become drums. Verses are softer than the chorus. Press play, then mute a layer to compare.",
      build(rng) {
        const bpm = 96
        const lower = notesFrom("C4/2 E4/2 G4/2 E4/2 F4/2 E4/2 D4/2 C4/2", bpm)
        const higher = notesFrom("E4/2 G4/2 B4/2 G4/2 A4/2 G4/2 F4/2 E4/2", bpm)
        const claps = renderTicks(clapTimes(bpm, 16, rng, 0.016), lower.duration, rng, false)
        const drums = transformAudio(claps, "Drums", { bpm, rng })
        return {
          duration: lower.duration,
          layers: balance([
            layer("Lower voice", "Voice", "original", "#1fbfa7", 0.5, -0.22, renderVoice(lower.notes, lower.duration, "hum", rng)),
            layer("Higher voice", "Voice", "original", "#7ee0c8", 0.46, 0.24, renderVoice(higher.notes, higher.duration, "sing", rng)),
            layer("Family claps", "Claps", "original", "#ffd89a", 0.36, 0, claps),
            layer("Drum kit", "Drums", "from the claps", "#3d7eff", 0.55, 0.05, drums.samples),
          ]),
          proof: { drums: drums.proof.hits },
        }
      },
    },
    summer: {
      lengthSec: 150,
      shape: "arc",
      intent: "soft",
      bpm: 84,
      blurb: "Summer Memories is a family keepsake. The hummed tune and the soft taps stay. Guitar follows the hum, and a quiet kit follows the taps. It eases in and eases out. Press play, then mute a layer to compare.",
      build(rng) {
        const bpm = 84
        const { notes, duration } = notesFrom("A4 C5 B4 A4 G4 A4 B4 G4 A4 C5 D5 C5 B4 A4 G4 A4", bpm)
        const hum = renderVoice(notes, duration, "hum", rng)
        const taps = renderTicks(clapTimes(bpm, 16, rng, 0.02), duration, rng, true)
        const guitar = transformAudio(hum, "Guitar", { rng })
        const drums = transformAudio(taps, "Drums", { bpm, rng })
        return {
          duration,
          layers: balance([
            layer("Hummed memory", "Voice", "original", "#1fbfa7", 0.52, 0, hum),
            layer("Guitar", "Guitar", "from the humming", "#ff8ab0", 0.34, -0.2, guitar.samples),
            layer("Soft taps", "Claps", "original", "#ffd89a", 0.28, 0.15, taps),
            layer("Quiet kit", "Drums", "from the taps", "#3d7eff", 0.32, -0.05, drums.samples),
          ]),
          proof: { melody: coverage(notes, guitar.proof.notes), drums: drums.proof.hits },
        }
      },
    },
    bright: {
      lengthSec: 180,
      shape: "chorus",
      intent: "chorus",
      bpm: 104,
      blurb: "A Brighter Day is a finished song shape. The beatbox becomes bass, the claps become drums, and the hook becomes a choir. Each original stays. The last chorus is the biggest. Press play, then mute a layer to compare.",
      build(rng) {
        const bpm = 104
        const hook = notesFrom("E4 G4 A4 B4 A4 G4 E4 D4 C4 E4 G4 A4 G4 E4 D4 C4", bpm)
        const bassNotes = notesFrom("C2/2 G2/2 A2/2 G2/2 F2/2 E2/2 G2/2 C2/2", bpm)
        const beatbox = renderBeatbox(bassNotes.notes, hook.duration, bpm, rng)
        const hum = renderVoice(hook.notes, hook.duration, "sing", rng)
        const claps = renderTicks(clapTimes(bpm, 16, rng, 0.015), hook.duration, rng, false)
        const bass = transformAudio(beatbox, "Bass", { rng })
        const drums = transformAudio(claps, "Drums", { bpm, rng })
        const choir = transformAudio(hum, "Choir", { key: 0, rng })
        return {
          duration: hook.duration,
          layers: balance([
            layer("Beatbox", "Beatbox", "original", "#f0a202", 0.4, -0.1, beatbox),
            layer("Bass", "Bass", "from the beatbox", "#d98a00", 0.5, -0.05, bass.samples),
            layer("Claps", "Claps", "original", "#ffd89a", 0.3, 0.12, claps),
            layer("Drum kit", "Drums", "from the claps", "#3d7eff", 0.5, 0, drums.samples),
            layer("Hook", "Voice", "original", "#1fbfa7", 0.42, 0.05, hum),
            layer("Choir", "Choir", "from the hook", "#b44dff", 0.38, 0.28, choir.samples),
          ]),
          proof: {
            bass: coverage(bassNotes.notes, bass.proof.notes),
            melody: coverage(hook.notes, choir.proof.notes),
            drums: drums.proof.hits,
          },
        }
      },
    },
  }
  const song = songs[id]
  if (!song) return null
  const made = song.build(mulberry32(hashSeed(id)))
  return {
    sampleRate: SR,
    lengthSec: song.lengthSec,
    shape: song.shape,
    intent: song.intent,
    bpm: song.bpm,
    blurb: song.blurb,
    duration: made.duration,
    layers: made.layers,
    proof: made.proof,
  }
}

globalThis.SongbirdMusic = {
  makeExample,
  transformAudio,
  tempoFromAudio,
  tempoFromTimes,
  sampleRate: SR,
  detectNotes,
  detectOnsets,
  coverage,
}
