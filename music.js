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

function singLead(out, note, kind, rng) {
  const start = Math.floor(note.time * SR)
  if (start >= out.length || start < 0) return
  const length = Math.min(out.length - start, Math.max(1, Math.floor(note.dur * SR)))
  const base = hzOf(note.midi)
  const open = kind === "sing"
  const harmonics = open ? 6 : 4
  const phases = new Float32Array(harmonics)
  for (let i = 0; i < length; i++) {
    const t = i / SR
    const vibrato = Math.sin(2 * Math.PI * 5.1 * t) * (open ? 0.005 : 0.003) * Math.min(1, t / 0.2)
    const freq = base * (1 + vibrato)
    phases[0] += (2 * Math.PI * freq) / SR
    let sample = Math.sin(phases[0]) * (open ? 0.78 : 0.9)
    for (let h = 2; h <= harmonics; h++) {
      phases[h - 1] += (2 * Math.PI * freq * h) / SR
      const tone = freq * h
      const low = Math.exp(-((tone - (open ? 700 : 420)) ** 2) / (2 * 170 * 170))
      const high = Math.exp(-((tone - (open ? 1150 : 860)) ** 2) / (2 * 210 * 210))
      sample += Math.sin(phases[h - 1]) * ((0.12 + low * 0.85 + high * 0.4) / h) * (open ? 0.42 : 0.2)
    }
    const breath = (rng() * 2 - 1) * (open ? 0.018 : 0.008)
    const attack = Math.min(1, t / 0.035)
    const release = Math.min(1, Math.max(0.02, note.dur - t) / 0.07)
    out[start + i] += (sample + breath) * attack * release * 0.46
  }
}

function renderVoice(notes, duration, kind, rng) {
  const out = silence(duration)
  for (const note of notes) {
    if (kind === "hum" || kind === "sing") {
      singLead(out, note, kind, rng)
      continue
    }
    const start = Math.floor(note.time * SR)
    const length = Math.max(1, Math.floor(note.dur * SR))
    const freq = hzOf(note.midi)
    let phase = 0
    for (let i = 0; i < length && start + i < out.length; i++) {
      const t = i / SR
      phase += (2 * Math.PI * freq) / SR
      let sample = Math.sin(phase) + Math.sin(phase * 2) * 0.18
      const env = kind === "boom" ? Math.exp(-t * 7.5) : Math.exp(-t * 2.6)
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

// The performance stays simple. These are the studio parts built around it:
// weight, harmony, a backbeat, and a little room. They describe how a part
// sits in a record, across styles and eras, rather than one current trend.
const STUDIO = {
  piano: { partials: 7, stretch: 0.00012, support: 0.3, room: 0.16, warm: 0.22 },
  guitar: { partner: 0.4, strum: 0.018, room: 0.11, warm: 0.18 },
  bass: { sub: 0.58, body: 0.46, grit: 0.12, room: 0.04, warm: 0.32 },
  drums: { hat: 0.2, room: 0.08, warm: 0.28 },
  choir: { partials: 6, detune: 0.08, room: 0.26, warm: 0.12 },
}

function addRoom(samples, amount) {
  if (amount <= 0) return samples
  const dry = samples.slice()
  const taps = [[837, 0.34], [1279, 0.24], [1811, 0.16], [2341, 0.1]]
  for (const [delay, gain] of taps) {
    const level = gain * amount
    for (let i = delay; i < samples.length; i++) samples[i] += dry[i - delay] * level
  }
  return samples
}

function warm(samples, amount) {
  if (amount <= 0) return samples
  const drive = 1 + amount * 2.4
  for (let i = 0; i < samples.length; i++) samples[i] = Math.tanh(samples[i] * drive) * 0.86
  return samples
}

function tilt(samples, amount) {
  if (!amount) return samples
  let low = 0
  for (let i = 0; i < samples.length; i++) {
    low += 0.12 * (samples[i] - low)
    samples[i] += (samples[i] - low) * amount
  }
  return samples
}

const PERIOD_TONE = {
  "1900": { room: 1.8, warm: 1.55, tilt: -0.42, drive: 0, chorus: 0 },
  "1920": { room: 1.35, warm: 1.15, tilt: -0.12, drive: 0.08, chorus: 0.05 },
  "1950": { room: 0.95, warm: 1.05, tilt: 0.02, drive: 0.22, chorus: 0 },
  "1960": { room: 1.2, warm: 1.3, tilt: -0.1, drive: 0.1, chorus: 0.08 },
  "1970": { room: 1.05, warm: 0.95, tilt: 0.04, drive: 0.06, chorus: 0.2 },
  "1980": { room: 0.5, warm: 0.4, tilt: 0.34, drive: 0.12, chorus: 0.38 },
  "1990": { room: 0.42, warm: 0.75, tilt: -0.08, drive: 0.16, chorus: 0.06 },
  "2000": { room: 0.32, warm: 0.38, tilt: 0.3, drive: 0.28, chorus: 0.1 },
  today: { room: 0.28, warm: 0.32, tilt: 0.38, drive: 0.08, chorus: 0.04 },
}

function eraTone(era) {
  if (era === "modern") return { room: 0.4, warm: 0.55, tilt: 0.28 }
  if (era === "old") return { room: 1.55, warm: 1.4, tilt: -0.32 }
  return PERIOD_TONE[era] || null
}

function chorus(samples, amount) {
  if (amount <= 0) return samples
  const dry = samples.slice()
  const depth = Math.floor(SR * 0.004 * amount)
  const base = Math.floor(SR * 0.018)
  for (let i = 0; i < samples.length; i++) {
    const wobble = 0.5 + 0.5 * Math.sin((i / SR) * Math.PI * 1.4)
    const delay = base + Math.floor(depth * wobble)
    const earlier = i - delay
    if (earlier >= 0) samples[i] = dry[i] * (1 - amount * 0.35) + dry[earlier] * amount * 0.45
  }
  return samples
}

function studioFinish(samples, profile, era) {
  const tone = eraTone(era)
  addRoom(samples, (profile.room || 0) * (tone ? tone.room : 1))
  tilt(samples, tone ? tone.tilt : 0)
  warm(samples, (profile.warm || 0) * (tone ? tone.warm : 1))
  if (tone && tone.drive) drive(samples, tone.drive)
  if (tone && tone.chorus) chorus(samples, tone.chorus)
  return samples
}

function renderPianoNote(out, note, gain, rng, hammer, exact) {
  const start = Math.floor(note.time * SR)
  if (start >= out.length || start < 0) return
  const length = Math.min(out.length - start, Math.floor((exact ? note.dur : Math.max(note.dur, 0.75)) * SR))
  const base = hzOf(note.midi)
  const partials = STUDIO.piano.partials
  const phases = new Float32Array(partials)
  const steps = new Float32Array(partials)
  for (let harmonic = 1; harmonic <= partials; harmonic++) {
    const freq = base * harmonic * Math.sqrt(1 + STUDIO.piano.stretch * harmonic * harmonic)
    steps[harmonic - 1] = (2 * Math.PI * freq) / SR
  }
  for (let i = 0; i < length; i++) {
    const t = i / SR
    let sample = 0
    for (let harmonic = 0; harmonic < partials; harmonic++) {
      phases[harmonic] += steps[harmonic]
      sample += Math.sin(phases[harmonic]) * Math.exp(-t * (1.05 + (harmonic + 1) * 0.95)) / (harmonic + 1)
    }
    const strike = hammer && t < 0.006 ? (rng() * 2 - 1) * (1 - t / 0.006) * 0.28 : 0
    const attack = Math.min(1, t / 0.005)
    out[start + i] += (sample * 0.7 + strike) * attack * gain
  }
}

function renderPiano(notes, duration, rng = mulberry32(1), era, style = {}) {
  const out = silence(duration)
  const key = guessKey(notes)
  const exact = !!style.exact
  notes.forEach((note, index) => {
    const late = (index === 0 ? 0 : (rng() - 0.5) * 0.012)
    renderPianoNote(out, { ...note, time: note.time + late }, 1, rng, true, exact)
    if (!style.plain && index % 2 === 0) {
      const third = transposeDiatonic(note.midi, -2, key)
      renderPianoNote(out, { ...note, midi: Math.max(48, third), time: note.time + late + 0.012, dur: note.dur * 0.9 }, STUDIO.piano.support, rng, false, exact)
    }
  })
  return studioFinish(out, STUDIO.piano, era)
}

function pluckString(out, midi, time, dur, rng, gain, exact) {
  const start = Math.floor(time * SR)
  if (start >= out.length || start < 0) return
  const freq = hzOf(midi)
  const period = Math.max(2, Math.round(SR / freq))
  const delay = new Float32Array(period)
  for (let i = 0; i < period; i++) delay[i] = (rng() * 2 - 1) * Math.exp(-i / (period * 0.28))
  const length = Math.min(out.length - start, Math.floor((exact ? dur : Math.max(dur, 0.55)) * SR))
  const damp = 0.496 - Math.min(0.012, freq / 18000)
  let index = 0
  let previous = 0
  let body = 0
  for (let i = 0; i < length; i++) {
    const sample = delay[index]
    const filtered = (sample + previous) * damp
    previous = sample
    delay[index] = filtered
    index = (index + 1) % period
    body += 0.06 * (filtered - body)
    const t = i / SR
    out[start + i] += (filtered * 0.78 + body * 0.45) * Math.min(1, t / 0.003) * gain
  }
}

function drive(samples, amount) {
  if (amount <= 0) return samples
  const gain = 1 + amount * 5
  for (let i = 0; i < samples.length; i++) samples[i] = Math.tanh(samples[i] * gain) * 0.72
  return samples
}

function renderGuitar(notes, duration, rng, style = {}) {
  const out = silence(duration)
  const key = guessKey(notes)
  const electric = !!style.electric
  const modern = style.era === "modern"
  const exact = !!style.exact
  notes.forEach((note, index) => {
    const late = index === 0 ? 0 : (rng() - 0.5) * 0.01
    pluckString(out, note.midi, note.time + late, note.dur, rng, electric ? 0.95 : 0.85, exact)
    if (style.plain) return
    const lower = Math.max(40, transposeDiatonic(note.midi, -4, key))
    pluckString(out, lower, note.time + late + STUDIO.guitar.strum, note.dur * 0.85, rng, STUDIO.guitar.partner * (electric ? 0.62 : 1), exact)
  })
  if (electric) drive(out, modern ? 0.62 : 0.28)
  const profile = electric
    ? { room: modern ? 0.05 : 0.18, warm: modern ? 0.1 : 0.34 }
    : STUDIO.guitar
  return studioFinish(out, profile, style.era)
}

function renderRhodes(notes, duration, rng, era, style = {}) {
  const out = silence(duration)
  const modern = era === "modern"
  const rate = modern ? 0.7 : 5.1
  const depth = modern ? 0.06 : 0.38
  notes.forEach((note, index) => {
    const late = index === 0 ? 0 : (rng() - 0.5) * 0.01
    const start = Math.floor((note.time + late) * SR)
    if (start >= out.length || start < 0) return
    const length = Math.min(out.length - start, Math.floor((style.exact ? note.dur : Math.max(note.dur, 0.7)) * SR))
    const freq = hzOf(note.midi)
    let bodyPhase = 0
    let tinePhase = 0
    for (let i = 0; i < length; i++) {
      const t = i / SR
      bodyPhase += (2 * Math.PI * freq) / SR
      tinePhase += (2 * Math.PI * freq * (modern ? 3.02 : 2.5)) / SR
      const body = Math.sin(bodyPhase) * Math.exp(-t * (modern ? 1.5 : 1.05))
      const tine = Math.sin(tinePhase) * Math.exp(-t * (modern ? 9 : 5.5))
      const trem = 1 - depth + depth * Math.sin(2 * Math.PI * rate * (note.time + t))
      const attack = Math.min(1, t / (modern ? 0.004 : 0.014))
      out[start + i] += (body * 0.58 + tine * (modern ? 0.32 : 0.16)) * trem * attack * 0.72
    }
  })
  return studioFinish(out, { room: modern ? 0.05 : 0.24, warm: modern ? 0.08 : 0.36 }, era)
}

function renderHorn(notes, duration, era, style = {}) {
  const out = silence(duration)
  for (const note of notes) {
    const start = Math.floor(note.time * SR)
    if (start >= out.length || start < 0) continue
    const length = Math.min(out.length - start, Math.floor((style.exact ? note.dur : Math.max(note.dur, 0.4)) * SR))
    const freq = hzOf(Math.min(76, Math.max(52, note.midi)))
    let phase = 0
    for (let i = 0; i < length; i++) {
      const t = i / SR
      const vibrato = 1 + 0.014 * Math.sin(2 * Math.PI * 5 * t)
      phase += (2 * Math.PI * freq * vibrato) / SR
      const tone = Math.sin(phase) * 0.72 + Math.sin(phase * 2) * 0.26 + Math.sin(phase * 3) * 0.14 + Math.sin(phase * 5) * 0.06
      const attack = Math.min(1, t / 0.045)
      const release = Math.min(1, Math.max(0.001, note.dur - t) / 0.09)
      out[start + i] += Math.tanh(tone * 1.35) * attack * release * 0.48
    }
  }
  return studioFinish(out, { room: 0.24, warm: 0.18 }, era)
}

function renderBass(notes, duration, era, style = {}) {
  const out = silence(duration)
  for (const note of notes) {
    const start = Math.floor(note.time * SR)
    if (start >= out.length) continue
    const length = Math.min(out.length - start, Math.floor((style.exact ? note.dur : Math.max(note.dur, 0.4)) * SR))
    const freq = hzOf(note.midi)
    let phase = 0
    for (let i = 0; i < length; i++) {
      const t = i / SR
      phase += (2 * Math.PI * freq) / SR
      const fundamental = Math.sin(phase)
      const sub = note.midi >= 40 ? Math.sin(phase * 0.5) * STUDIO.bass.sub : fundamental * 0.2
      const grit = Math.tanh(fundamental * 2.1) * STUDIO.bass.grit
      const attack = Math.min(1, t / 0.01)
      const release = Math.min(1, Math.max(0, note.dur - t) / 0.07)
      const hold = 0.62 + 0.38 * Math.exp(-t * 0.7)
      out[start + i] += (sub + fundamental * STUDIO.bass.body + grit) * attack * release * hold * 0.55
    }
  }
  return studioFinish(out, STUDIO.bass, era)
}

function renderHit(kind, rng, era) {
  const length = Math.floor(SR * (kind === "hat" ? 0.05 : kind === "snare" ? 0.32 : 0.46))
  const out = new Float32Array(length)
  let phase = 0
  let previous = 0
  for (let i = 0; i < length; i++) {
    const t = i / SR
    if (kind === "kick") {
      const freq = 47 + 160 * Math.exp(-t * 24)
      phase += (2 * Math.PI * freq) / SR
      const click = t < 0.004 ? (rng() * 2 - 1) * (1 - t / 0.004) * (era === "modern" ? 0.55 : era === "old" ? 0.16 : 0.32) : 0
      out[i] = Math.tanh(Math.sin(phase) * 1.45) * Math.exp(-t * 6.8) * 0.92 + click
    } else if (kind === "snare") {
      const noise = rng() * 2 - 1
      phase += (2 * Math.PI * 186) / SR
      const snap = t < 0.01 ? (rng() * 2 - 1) * (1 - t / 0.01) * 0.45 : 0
      out[i] = noise * Math.exp(-t * 12) * 0.42 + Math.sin(phase) * Math.exp(-t * 18) * 0.38 + snap
    } else {
      const noise = rng() * 2 - 1
      const high = noise - previous
      previous = noise * 0.65
      out[i] = high * Math.exp(-t * 46) * 0.55
    }
  }
  if (kind === "snare") {
    const delay = Math.floor(SR * 0.037)
    for (let i = delay; i < out.length; i++) out[i] += out[i - delay] * 0.2
  }
  return out
}

function beatGap(hits) {
  const times = hits.map((hit) => hit.time).sort((a, b) => a - b)
  const gaps = []
  for (let i = 1; i < times.length; i++) {
    const gap = times[i] - times[i - 1]
    if (gap >= 0.22 && gap <= 1.3) gaps.push(gap)
  }
  if (!gaps.length) return 0
  gaps.sort((a, b) => a - b)
  return gaps[Math.floor(gaps.length / 2)]
}

function renderDrums(hits, duration, rng, era) {
  const out = silence(duration)
  const beat = beatGap(hits)
  const last = hits.reduce((max, hit) => Math.max(max, hit.time), 0)
  const all = hits.slice()
  if (hits.length >= 4 && beat > 0) {
    const step = beat >= 0.4 ? beat / 2 : beat
    for (let time = 0; time <= last + 0.001; time += step) {
      const nudge = time < 0.01 ? 0 : (rng() - 0.5) * 0.008
      all.push({ time: Math.max(0, time + nudge), kind: "hat" })
    }
  }
  for (const hit of all) {
    const nudge = hit.kind === "hat" || hit.time < 0.02 ? 0 : (rng() - 0.5) * 0.01
    const sound = renderHit(hit.kind, rng, era)
    const hat = STUDIO.drums.hat * (era === "modern" ? 1.2 : era === "old" ? 0.7 : 1)
    const level = hit.kind === "hat" ? hat : 1
    const start = Math.floor((hit.time + nudge) * SR)
    for (let i = 0; i < sound.length && start + i < out.length; i++) out[start + i] += sound[i] * level
  }
  return studioFinish(out, STUDIO.drums, era)
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

function vowelWeights(freq) {
  const weights = []
  for (let harmonic = 1; harmonic <= STUDIO.choir.partials; harmonic++) {
    const tone = freq * harmonic
    const first = Math.exp(-((tone - 730) ** 2) / (2 * 190 * 190))
    const second = Math.exp(-((tone - 1100) ** 2) / (2 * 230 * 230))
    weights.push((0.22 + first * 1.45 + second * 0.85) / harmonic)
  }
  return weights
}

function singVowel(out, note, gain, rng) {
  const start = Math.floor(note.time * SR)
  if (start >= out.length || start < 0) return
  const length = Math.min(out.length - start, Math.floor(note.dur * SR))
  const freq = hzOf(note.midi)
  const weights = vowelWeights(freq)
  const phases = new Float32Array(weights.length)
  const steps = weights.map((_, index) => (2 * Math.PI * freq * (index + 1)) / SR)
  for (let i = 0; i < length; i++) {
    const t = i / SR
    let sample = 0
    for (let harmonic = 0; harmonic < weights.length; harmonic++) {
      phases[harmonic] += steps[harmonic]
      sample += Math.sin(phases[harmonic]) * weights[harmonic]
    }
    const attack = Math.min(1, t / 0.045)
    const release = Math.min(1, Math.max(0, note.dur - t) / 0.09)
    const breath = (rng() * 2 - 1) * 0.012
    out[start + i] += (sample * 0.34 + breath) * attack * release * gain
  }
}

function renderChoir(notes, duration, keyRoot, rng, era, style = {}) {
  const out = silence(duration)
  const parts = style.plain ? [0] : [0, 2, 4]
  parts.forEach((steps, index) => {
    const detune = style.plain ? 0 : (index - 1) * STUDIO.choir.detune
    const stagger = index * 0.014
    const gain = index === 0 ? 0.52 : 0.36
    for (const note of notes) {
      singVowel(out, {
        midi: transposeDiatonic(note.midi, steps, keyRoot) + detune,
        time: note.time + stagger,
        dur: note.dur,
      }, gain, rng)
    }
  })
  return studioFinish(out, STUDIO.choir, era)
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

function triadUnder(midi, key) {
  let root = midi
  while (root > 67) root -= 12
  while (root < 48) root += 12
  const tones = [root, transposeDiatonic(root, 2, key), transposeDiatonic(root, 4, key)]
  const seen = new Set()
  return tones.filter((tone) => {
    const pitch = Math.round(tone)
    if (seen.has(pitch)) return false
    seen.add(pitch)
    return true
  })
}

function beatsInside(note, bpm) {
  const beat = 60 / Math.max(40, bpm)
  const end = note.time + Math.max(note.dur, 0.12)
  let time = Math.round(note.time / beat) * beat
  if (time < note.time - beat * 0.35) time += beat
  const hits = []
  while (time < end - 0.03) {
    hits.push(Math.max(0, time))
    time += beat
  }
  if (!hits.length) hits.push(note.time)
  return { hits, beat }
}

function arrangePerformance(notes, options = {}) {
  let figure = options.figure === "chords" ? "chords" : "solo"
  let touch = options.touch === "beat" ? "beat" : options.touch === "strum" ? "strum" : "hold"
  if (options.kind === "Bass") figure = "solo"
  if (figure === "solo" || options.kind === "Bass") {
    if (touch === "strum") touch = "hold"
  }
  const bpm = options.bpm || 92
  const key = guessKey(notes)
  const out = []
  notes.forEach((note, index) => {
    const tones = figure === "chords" ? triadUnder(note.midi, key) : [note.midi]
    const pulse = touch === "beat" ? beatsInside(note, bpm) : null
    const times = pulse ? pulse.hits : [note.time]
    const dur = pulse ? Math.max(0.12, Math.min(note.dur, pulse.beat * 0.62)) : note.dur
    times.forEach((time) => {
      const ordered = touch === "strum" && index % 2 === 1 ? [...tones].reverse() : tones
      ordered.forEach((midi, stringIndex) => {
        const gap = touch === "strum" ? stringIndex * 0.03 : 0
        out.push({ midi, time: time + gap, dur: Math.max(0.1, dur - gap) })
      })
    })
  })
  return { notes: out, figure, touch, exact: touch === "beat" }
}

function patternHits(bpm, duration, pattern) {
  const beat = 60 / Math.max(40, bpm || 92)
  const cycle = Math.max(1, pattern.cycleBeats || 4)
  const cycles = Math.max(1, Math.ceil((duration - 0.04) / (beat * cycle)))
  const hits = []
  for (let c = 0; c < cycles; c++) {
    for (const hit of pattern.hits || []) {
      const time = (c * cycle + hit.beat) * beat
      if (time >= 0 && time < duration - 0.03) hits.push({ time, kind: hit.kind === "snare" ? "snare" : "kick" })
    }
  }
  return hits
}

function pocketHits(bpm, duration, pocket) {
  const beat = 60 / Math.max(40, bpm || 92)
  const count = Math.max(4, Math.floor((duration - 0.04) / beat))
  const hits = []
  for (let i = 0; i < count; i++) {
    const time = i * beat
    const place = i % 4
    if (pocket === "boom") {
      if (place === 0) hits.push({ time, kind: "kick" })
      if (place === 1 || place === 3) hits.push({ time, kind: "snare" })
      if (place === 1) hits.push({ time: time + beat * 0.5, kind: "kick" })
    } else {
      if (place === 0 || place === 2) hits.push({ time, kind: "kick" })
      if (place === 1 || place === 3) hits.push({ time, kind: "snare" })
    }
  }
  return hits
}

function transformAudio(samples, kind, options = {}) {
  samples = toEngineRate(samples, options.sampleRate || SR)
  const cap = SR * 40
  if (samples.length > cap) samples = samples.subarray(0, cap)
  const bpm = options.bpm || 92
  const duration = samples.length / SR
  const rng = options.rng || mulberry32(1)
  const era = options.era && eraTone(options.era) ? options.era : undefined
  if (kind === "Drums") {
    let hits = hitsFromOnsets(detectOnsets(samples), bpm)
    if (hits.length < 2) {
      const melody = detectNotes(samples)
      hits = hitsFromOnsets(melody.map((note) => note.time), bpm)
      if (hits.length < 2 && melody.length >= 2) {
        hits = melody.map((note, index) => ({ time: note.time, kind: index % 2 === 0 ? "kick" : "snare" }))
      }
    }
    if (options.pattern && options.pattern.hits && options.pattern.hits.length) hits = patternHits(bpm, duration, options.pattern)
    else if (options.pocket === "backbeat" || options.pocket === "boom") hits = pocketHits(bpm, duration, options.pocket)
    if (hits.length < 2) hits = pocketHits(bpm, duration, "backbeat")
    if (hits.length < 2) return null
    return { samples: finish(renderDrums(hits, duration, rng, era)), proof: { hits, pocket: options.pocket || "played" } }
  }
  if (kind === "Bass") {
    let notes = detectNotes(samples, { minHz: 40, maxHz: 180, lowpass: 220, minEnergy: 0.00015 })
    if (!notes.length) {
      notes = detectNotes(samples).map((note) => ({ ...note, midi: Math.max(36, note.midi - 12) }))
    }
    if (!notes.length) return null
    const arranged = options.figure ? arrangePerformance(notes, { ...options, kind: "Bass" }) : null
    const play = arranged ? arranged.notes : notes
    const style = arranged ? { plain: true, exact: arranged.exact } : {}
    return { samples: finish(renderBass(play, duration, era, style)), proof: { notes }, figure: arranged }
  }
  const notes = detectNotes(samples)
  if (!notes.length) return null
  const arranged = options.figure ? arrangePerformance(notes, { ...options, kind }) : null
  const play = arranged ? arranged.notes : notes
  const style = arranged ? { plain: true, exact: arranged.exact } : {}
  if (kind === "Piano") return { samples: finish(renderPiano(play, duration, rng, era, style)), proof: { notes }, figure: arranged }
  if (kind === "Rhodes") return { samples: finish(renderRhodes(play, duration, rng, era, style)), proof: { notes }, figure: arranged }
  if (kind === "Electric guitar") return { samples: finish(renderGuitar(play, duration, rng, { electric: true, era, ...style })), proof: { notes }, figure: arranged }
  if (kind === "Acoustic guitar" || kind === "Guitar") return { samples: finish(renderGuitar(play, duration, rng, { era: kind === "Guitar" ? undefined : era, ...style })), proof: { notes }, figure: arranged }
  if (kind === "Choir") {
    const key = options.key == null ? guessKey(notes) : options.key
    return { samples: finish(renderChoir(play, duration, key, rng, era, style)), proof: { notes, key }, figure: arranged }
  }
  if (kind === "Horn") return { samples: finish(renderHorn(play, duration, era, style)), proof: { notes }, figure: arranged }
  return null
}

function finish(samples) {
  fadeEdges(samples)
  return normalize(samples, 0.8)
}

function layer(name, sound, from, color, gain, pan, samples, mix = {}) {
  return {
    name,
    sound,
    from,
    color,
    gain,
    pan,
    low: mix.low || 0,
    high: mix.high || 0,
    space: mix.space || 0,
    samples: finish(samples),
  }
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
      bpm: 92,
      blurb: "Ella's Happy Song is sung as vocals: a blue-note scoop, a leap, and a fall. A 1960s piano plays chords on the beat behind her, and her claps become the kit. The vocal is not turned into the piano.",
      build(rng) {
        const bpm = 92
        const { notes, duration } = notesFrom("R/1 C4/0.5 C#4/0.5 E4/1.5 G4/1 E4/0.5 C4/1 A3/2 R/1 A3/0.5 C5/2 G4/0.5 Eb4/1 C4/1 A3/2 C4/0.5 Eb4/0.5 E4/1 G4/0.5 E4/0.5 C4/1 R/0.5 C4/0.5 E4/1 G4/0.5 Eb4/0.5 C4/1 R/1 C4/0.5 Eb4/0.5 E4/1.5 C5/1 G4/0.5 Eb4/0.5 C4/1 A3/1.5", bpm)
        const voice = renderVoice(notes, duration, "sing", rng)
        const claps = renderTicks(clapTimes(bpm, Math.ceil(duration / (60 / bpm)), rng, 0.018), duration, rng, false)
        const chords = transformAudio(voice, "Piano", { rng, era: "1960", bpm, figure: "chords", touch: "beat" })
        const drums = transformAudio(claps, "Drums", { bpm, rng, era: "1960" })
        return {
          duration,
          layers: balance([
            layer("Ella's singing", "Voice", "original", "#1fbfa7", 0.9, 0, voice, { high: 2.5, space: 0.1 }),
            layer("1960s chords", "Piano", "behind the singing · 1960s · chords, on the beat", "#e8b86d", 0.22, -0.16, chords.samples, { space: 0.08, low: 1 }),
            layer("Ella's claps", "Claps", "original", "#ffd89a", 0.16, -0.22, claps, { space: 0.04 }),
            layer("1960s kit", "Drums", "from the claps · 1960s", "#3d7eff", 0.32, 0, drums.samples, { low: 2, high: 1, space: 0.02 }),
          ]),
          proof: { melody: coverage(notes, chords.proof.notes), drums: drums.proof.hits },
        }
      },
    },
    grandpa: {
      lengthSec: 180,
      shape: "arc",
      intent: "soft",
      bpm: 66,
      blurb: "Grandpa's Sunday Song is sung as vocals: a chromatic step into a long note, a flat seventh, and a breath. A 1920s horn and choir hold chords behind him, with a parlor piano. The horn does not replace his singing.",
      build(rng) {
        const bpm = 66
        const { notes, duration } = notesFrom("C4/0.75 Db4/0.25 F4/2 A4/0.75 C5/1.25 Bb4/1 A4/1.5 R/0.5 Eb4/0.75 F4/0.25 A4/1 C5/2 Bb4/0.75 G4/0.25 F4/2 R/1 A4/0.75 C5/0.25 Eb5/1.5 D5/0.5 C5/1 A4/0.75 F4/1.25 C4/1 R/1", bpm)
        const voice = renderVoice(notes, duration, "sing", rng)
        const horn = transformAudio(voice, "Horn", { rng, era: "1920", bpm, figure: "chords", touch: "hold" })
        const choir = transformAudio(voice, "Choir", { rng, era: "1920", bpm, figure: "chords", touch: "hold" })
        const piano = transformAudio(voice, "Piano", { rng, era: "1900", bpm, figure: "chords", touch: "hold" })
        return {
          duration,
          layers: balance([
            layer("Grandpa's singing", "Voice", "original", "#1fbfa7", 0.9, 0, voice, { high: 2, space: 0.12 }),
            layer("1920s horn", "Horn", "behind the singing · 1920s · chords, held", "#F9A8D4", 0.2, -0.22, horn.samples, { space: 0.28 }),
            layer("1920s choir", "Choir", "behind the singing · 1920s · chords, held", "#b44dff", 0.22, 0.34, choir.samples, { space: 0.48, high: -1 }),
            layer("Parlor piano", "Piano", "behind the singing · 1900s · chords, held", "#f0a202", 0.16, 0.06, piano.samples, { space: 0.36, high: -2 }),
          ]),
          proof: { melody: coverage(notes, choir.proof.notes), choir: coverage(notes, choir.proof.notes) },
        }
      },
    },
    family: {
      lengthSec: 120,
      shape: "chorus",
      intent: "chorus",
      bpm: 100,
      blurb: "Our Family Song is two people singing a pentatonic call and answer. Today's Rhodes strums behind them, the low part becomes bass on the beat, and the claps become the kit. The voices stay vocals.",
      build(rng) {
        const bpm = 100
        const lower = notesFrom("G3/1 R/0.5 Bb3/0.5 D4/1 R/0.5 C4/0.5 Bb3/1 G3/1 R/2 G3/1 R/0.5 Bb3/0.5 D4/1 R/0.5 F4/0.5 D4/1 C4/1 R/2 Bb3/0.5 D4/0.5 R/0.5 G3/0.5 C4/1 R/0.5 Bb3/0.5 G3/1 D4/1 R/2 G3/1 Bb3/0.5 D4/0.5 F4/1 D4/0.5 C4/0.5 Bb3/1 G3/2 R/1", bpm)
        const higher = notesFrom("R/5 D5/0.5 C5/0.5 Bb4/1 R/1 R/5 F5/0.5 D5/0.5 C5/1 Bb4/1 R/3 F5/0.5 D5/0.5 R/1 C5/0.5 Bb4/0.5 D5/1 R/1 R/2 D5/0.5 F5/0.5 D5/1 C5/0.5 Bb4/0.5 R/1 D5/1 C5/1", bpm)
        const lowVoice = renderVoice(lower.notes, lower.duration, "hum", rng)
        const highVoice = renderVoice(higher.notes, higher.duration, "sing", rng)
        const claps = renderTicks(clapTimes(bpm, Math.ceil(lower.duration / (60 / bpm)), rng, 0.016), lower.duration, rng, false)
        const rhodes = transformAudio(highVoice, "Rhodes", { rng, era: "today", bpm, figure: "chords", touch: "strum" })
        const bass = transformAudio(lowVoice, "Bass", { rng, era: "today", bpm, figure: "solo", touch: "beat" })
        const drums = transformAudio(claps, "Drums", { bpm, rng, era: "today" })
        return {
          duration: lower.duration,
          layers: balance([
            layer("Lower voice", "Voice", "original", "#1fbfa7", 0.78, -0.22, lowVoice, { high: 1, space: 0.08 }),
            layer("Higher voice", "Voice", "original", "#7ee0c8", 0.86, 0.22, highVoice, { high: 2, space: 0.1 }),
            layer("Rhodes today", "Rhodes", "behind the singing · today · chords, strummed", "#7ee0c8", 0.2, 0.06, rhodes.samples, { space: 0.24 }),
            layer("Bass today", "Bass", "from the lower voice · today · on the beat", "#d98a00", 0.28, 0, bass.samples, { low: 3, high: -2 }),
            layer("Family claps", "Claps", "original", "#ffd89a", 0.18, -0.1, claps),
            layer("Kit today", "Drums", "from the claps · today", "#3d7eff", 0.42, 0, drums.samples, { low: 1, space: 0.06 }),
          ]),
          proof: { drums: drums.proof.hits, melody: coverage(higher.notes, rhodes.proof.notes) },
        }
      },
    },
    summer: {
      lengthSec: 150,
      shape: "arc",
      intent: "soft",
      bpm: 116,
      blurb: "Summer Memories is sung as a rock riff: three short notes, a stop, and a blue note. A 1990s guitar plays chords behind the vocal, and the bass and kit sit under it. The riff is not handed to the guitar.",
      build(rng) {
        const bpm = 116
        const { notes, duration } = notesFrom("E4/0.5 E4/0.5 E4/0.5 R/0.5 G4/0.5 Bb4/1 A4/0.5 G4/0.5 E4/1 D4/0.5 E4/1 R/1 E4/0.5 G4/0.5 B4/1 D5/0.5 B4/0.5 A4/1 G4/0.5 E4/1 D5/0.5 B4/1 E4/1 E4/0.5 E4/0.5 R/1 G4/0.5 Bb4/0.5 A4/1 G4/0.5 E4/1.5 D4/0.5 E4/1.5 B4/0.5 R/0.5 E4/0.5 G4/0.5 A4/1 G4/0.5 E4/1 D4/1 B3/0.5 E4/2", bpm)
        const voice = renderVoice(notes, duration, "sing", rng)
        const taps = renderTicks(clapTimes(bpm, Math.ceil(duration / (60 / bpm)), rng, 0.02), duration, rng, true)
        const chords = transformAudio(voice, "Electric guitar", { rng, era: "1990", bpm, figure: "chords", touch: "beat" })
        const bass = transformAudio(voice, "Bass", { rng, era: "1990", bpm, figure: "solo", touch: "beat" })
        const drums = transformAudio(taps, "Drums", { bpm, rng, era: "1990" })
        return {
          duration,
          layers: balance([
            layer("Sung riff", "Voice", "original", "#1fbfa7", 0.9, 0, voice, { space: 0.08, high: 2 }),
            layer("1990s chords", "Electric guitar", "behind the singing · 1990s · chords, on the beat", "#f0a202", 0.2, 0.18, chords.samples, { space: 0.06 }),
            layer("1990s bass", "Bass", "under the singing · 1990s · on the beat", "#d98a00", 0.28, 0, bass.samples, { low: 3, high: -2 }),
            layer("Soft taps", "Claps", "original", "#ffd89a", 0.14, 0.12, taps, { space: 0.04 }),
            layer("1990s kit", "Drums", "from the taps · 1990s", "#3d7eff", 0.28, -0.04, drums.samples, { low: 2, high: 1, space: 0.04 }),
          ]),
          proof: { melody: coverage(notes, chords.proof.notes), drums: drums.proof.hits },
        }
      },
    },
    bright: {
      lengthSec: 180,
      shape: "chorus",
      intent: "chorus",
      bpm: 102,
      blurb: "A Brighter Day is sung as vocals: a repeated lift, a blue note that resolves, and a high answer. A 1970s Rhodes and choir sit behind the voice, and the beatbox becomes bass. The hook stays singing.",
      build(rng) {
        const bpm = 102
        const hook = notesFrom("D5/0.5 A4/0.5 F#4/0.5 A4/0.5 D5/1 R/0.5 F4/0.5 F#4/1 B4/1 A4/0.5 F#4/1.5 R/1 B4/0.5 D5/1 F#5/1.5 E5/0.5 D5/1 B4/0.5 A4/1 F#4/1 D5/0.5 A4/0.5 F#4/0.5 A4/0.5 D5/1 R/0.5 F4/0.5 F#4/1.5 A4/0.5 B4/1 F#4/1 R/0.5 F#4/0.5 A4/1 D5/1.5 B4/0.5 A4/1 F#4/0.5 F4/0.5 F#4/1 D4/1", bpm)
        const bassNotes = notesFrom("D2/1.5 R/0.5 A2/1 D2/1 R/1 G2/1.5 R/0.5 D2/1 D2/1 R/0.5 F#2/0.5 A2/1.5 R/0.5 D2/1 G2/1 A2/1 D2/1 D2/1.5 R/0.5 A2/1 D2/1.5 R/0.5 G2/1 A2/0.5 D2/1.5 D2/2 A2/1 G2/1 D2/1.5 R/0.5 A2/1 D2/1", bpm)
        const beatbox = renderBeatbox(bassNotes.notes, hook.duration, bpm, rng)
        const hum = renderVoice(hook.notes, hook.duration, "sing", rng)
        const claps = renderTicks(clapTimes(bpm, Math.ceil(hook.duration / (60 / bpm)), rng, 0.015), hook.duration, rng, false)
        const rhodes = transformAudio(hum, "Rhodes", { rng, era: "1970", bpm, figure: "chords", touch: "strum" })
        const choir = transformAudio(hum, "Choir", { rng, era: "1970", bpm, figure: "chords", touch: "hold" })
        const bass = transformAudio(beatbox, "Bass", { rng, era: "1970", bpm, figure: "solo", touch: "beat" })
        const drums = transformAudio(claps, "Drums", { bpm, rng, era: "1970" })
        return {
          duration: hook.duration,
          layers: balance([
            layer("Sung hook", "Voice", "original", "#1fbfa7", 0.92, 0, hum, { high: 2.5, space: 0.1 }),
            layer("1970s Rhodes", "Rhodes", "behind the singing · 1970s · chords, strummed", "#7ee0c8", 0.2, 0.16, rhodes.samples, { space: 0.22 }),
            layer("1970s choir", "Choir", "behind the singing · 1970s · chords, held", "#b44dff", 0.2, 0.32, choir.samples, { space: 0.42 }),
            layer("Beatbox", "Beatbox", "original", "#f0a202", 0.18, -0.08, beatbox, { space: 0.02 }),
            layer("1970s bass", "Bass", "from the beatbox · 1970s · on the beat", "#d98a00", 0.38, 0, bass.samples, { low: 3, high: -2 }),
            layer("Claps", "Claps", "original", "#ffd89a", 0.14, 0.14, claps),
            layer("1970s kit", "Drums", "from the claps · 1970s", "#3d7eff", 0.34, 0, drums.samples, { low: 1, high: 1, space: 0.06 }),
          ]),
          proof: {
            bass: coverage(bassNotes.notes, bass.proof.notes),
            melody: coverage(hook.notes, choir.proof.notes),
            drums: drums.proof.hits,
          },
        }
      },
    },
    gospel: {
      lengthSec: 34,
      shape: "chorus",
      intent: "chorus",
      bpm: 84,
      blurb: "Open Hands is an original gospel song by Whitney Kotlewski. A sung verse and chorus stay the vocal. Choir and piano hold chords behind, claps become a backbeat, and a low hum becomes bass. It is not a copy of an existing song.",
      build(rng) {
        const bpm = 84
        const verse = "R/1 D4/1 F4/0.5 G4/1 Bb4/1.5 A4/0.5 G4/1 D4/1.5 R/1 F4/0.5 A4/1 C5/1.5 G4/0.5 F4/1 D4/2.5 R/1 D4/0.5 F4/0.5 A4/1 G4/1 F4/1 D4/2 R/1"
        const chorus = "G4/0.5 Bb4/0.5 D5/1.5 C5/0.5 Bb4/1 G4/1 F4/1 D4/1 R/1 G4/0.5 A4/0.5 C5/1 D5/1.5 C5/0.5 A4/1 G4/2 R/1 D4/1 F4/0.5 G4/0.5 Bb4/1 D5/1.5 C5/0.5 Bb4/1 G4/2"
        const { notes, duration } = notesFrom(`${verse} ${chorus}`, bpm)
        const bassLine = notesFrom("G2/4 C2/4 G2/4 D2/4 G2/4 C2/4 G2/2 D2/2 C2/4 G2/4 D2/4 G2/4 C2/2 G2/2", bpm)
        const voice = renderVoice(notes, duration, "sing", rng)
        const low = renderVoice(bassLine.notes, bassLine.duration, "bass", rng)
        const claps = renderTicks(clapTimes(bpm, Math.ceil(duration / (60 / bpm)), rng, 0.012), duration, rng, false)
        const choir = transformAudio(voice, "Choir", { rng, era: "1970", bpm, figure: "chords", touch: "hold" })
        const piano = transformAudio(voice, "Piano", { rng, era: "1960", bpm, figure: "chords", touch: "hold" })
        const bass = transformAudio(low, "Bass", { rng, era: "1970", bpm, figure: "solo", touch: "beat" })
        const drums = transformAudio(claps, "Drums", { bpm, rng, era: "1970", pocket: "backbeat" })
        return {
          duration,
          lengthSec: Math.max(15, Math.round(duration)),
          sections: [
            { id: "gospel-verse", name: "Verse", start: 0, end: 0.5 },
            { id: "gospel-chorus", name: "Chorus", start: 0.5, end: 1 },
          ],
          layers: balance([
            layer("Sung vocal", "Voice", "original", "#1fbfa7", 0.92, 0, voice, { high: 2.5, space: 0.12 }),
            layer("Gospel choir", "Choir", "behind the singing · 1970s · chords, held", "#b44dff", 0.24, 0.28, choir.samples, { space: 0.46 }),
            layer("Gospel piano", "Piano", "behind the singing · 1960s · chords, held", "#f0a202", 0.18, -0.12, piano.samples, { space: 0.2 }),
            layer("Low hum", "Voice", "original", "#7ee0c8", 0.16, 0, low, { low: 2, high: -3 }),
            layer("Gospel bass", "Bass", "from the low hum · 1970s · on the beat", "#d98a00", 0.28, 0, bass.samples, { low: 3, high: -2 }),
            layer("Claps", "Claps", "original", "#ffd89a", 0.14, 0.16, claps),
            layer("Gospel kit", "Drums", "from the claps · backbeat · 1970s", "#3d7eff", 0.26, 0, drums.samples, { low: 2, space: 0.04 }),
          ]),
          proof: { melody: coverage(notes, choir.proof.notes), bass: coverage(bassLine.notes, bass.proof.notes), drums: drums.proof.hits },
        }
      },
    },
    pop: {
      lengthSec: 38,
      shape: "chorus",
      intent: "chorus",
      bpm: 100,
      blurb: "After Midnight is an original pop song by Whitney Kotlewski. The sung hook stays the vocal. Rhodes and guitar play chords behind it, a beatbox becomes bass, and claps become a backbeat. It is not a copy of an existing song.",
      build(rng) {
        const bpm = 100
        const verse = "R/0.5 E4/0.5 G4/1 C5/1.5 R/0.5 G4/0.5 E4/1 A4/1.5 G4/1 R/1 C5/0.5 E5/1 D5/0.5 C5/1 G4/1 E4/2 R/1 E4/0.5 G4/0.5 C5/1 E4/1 G4/1.5 R/0.5 A4/0.5 C5/1 G4/1 E4/0.5 R/1 G4/1 C5/1.5 E4/0.5 G4/1 C5/1 E4/2"
        const chorus = "E4/0.5 G4/0.5 C5/1 E5/1 D5/0.5 C5/1 G4/1.5 R/1 E4/1 G4/0.5 C5/1 E5/1.5 D5/0.5 C5/1 A4/1 G4/1 E4/0.5 R/1 E4/0.5 G4/0.5 C5/1 E5/1.5 D5/0.5 C5/1 G4/1 R/1 E4/1 G4/1 C5/1 E5/1 D5/0.5 C5/0.5 G4/1 E4/1 C5/1 G4/1"
        const { notes, duration } = notesFrom(`${verse} ${chorus}`, bpm)
        const bassLine = notesFrom("C2/2 G2/2 E2/2 C2/2 A2/2 G2/2 C2/2 E2/2 C2/2 G2/2 F2/2 E2/2 C2/2 G2/2 C2/2 R/2 A2/2 G2/2 C2/2 E2/2 C2/2 G2/2 F2/2 E2/2 C2/4 G2/2 C2/2 A2/2 G2/2 C2/2 R/2", bpm)
        const voice = renderVoice(notes, duration, "sing", rng)
        const beatbox = renderBeatbox(bassLine.notes, duration, bpm, rng)
        const claps = renderTicks(clapTimes(bpm, Math.ceil(duration / (60 / bpm)), rng, 0.01), duration, rng, false)
        const rhodes = transformAudio(voice, "Rhodes", { rng, era: "2000", bpm, figure: "chords", touch: "strum" })
        const guitar = transformAudio(voice, "Electric guitar", { rng, era: "2000", bpm, figure: "chords", touch: "beat" })
        const bass = transformAudio(beatbox, "Bass", { rng, era: "2000", bpm, figure: "solo", touch: "beat" })
        const drums = transformAudio(claps, "Drums", { bpm, rng, era: "2000", pocket: "backbeat" })
        return {
          duration,
          lengthSec: Math.max(15, Math.round(duration)),
          sections: [
            { id: "pop-verse", name: "Verse", start: 0, end: 0.5 },
            { id: "pop-chorus", name: "Chorus", start: 0.5, end: 1 },
          ],
          layers: balance([
            layer("Sung hook", "Voice", "original", "#1fbfa7", 0.92, 0, voice, { high: 2.5, space: 0.08 }),
            layer("Pop Rhodes", "Rhodes", "behind the singing · 2000s · chords, strummed", "#7ee0c8", 0.18, 0.16, rhodes.samples, { space: 0.2 }),
            layer("Pop guitar", "Electric guitar", "behind the singing · 2000s · chords, on the beat", "#ff4d8d", 0.16, -0.18, guitar.samples, { high: 1, space: 0.06 }),
            layer("Beatbox", "Beatbox", "original", "#f0a202", 0.12, -0.06, beatbox),
            layer("Pop bass", "Bass", "from the beatbox · 2000s · on the beat", "#d98a00", 0.28, 0, bass.samples, { low: 3, high: -2 }),
            layer("Claps", "Claps", "original", "#ffd89a", 0.12, 0.14, claps),
            layer("Pop kit", "Drums", "from the claps · backbeat · 2000s", "#3d7eff", 0.26, 0, drums.samples, { low: 1, high: 1, space: 0.04 }),
          ]),
          proof: { melody: coverage(notes, rhodes.proof.notes), bass: coverage(bassLine.notes, bass.proof.notes), drums: drums.proof.hits },
        }
      },
    },
    hiphop: {
      lengthSec: 30,
      shape: "chorus",
      intent: "chorus",
      bpm: 96,
      blurb: "Side Street is an original hip-hop song by Whitney Kotlewski. A rhythmic sung hook stays the vocal. Claps become a boom-bap kit, a beatbox becomes bass, and Rhodes stabs chords behind. It is not a copy of an existing song.",
      build(rng) {
        const bpm = 96
        const verse = "C4/0.5 R/0.5 Eb4/0.5 C4/1 G4/1 R/1 Bb4/0.5 C4/1 R/2 C4/0.5 R/0.5 G4/1 Bb4/0.5 R/0.5 C4/1 R/1 Eb4/0.5 C4/1 G4/1.5 R/1 Eb4/0.5 C4/0.5 G4/1 Bb4/1 C4/1 R/1 Eb4/1 C4/1"
        const chorus = "Eb4/0.5 C4/0.5 G4/1 R/0.5 Bb4/1 C4/1 R/1 Eb4/0.5 G4/1 C4/1 R/0.5 Eb4/0.5 G4/0.5 C5/1 Bb4/1 G4/0.5 R/0.5 C4/1 R/1 Eb4/1 C4/0.5 G4/1 Bb4/0.5 C4/0.5 Eb4/1 G4/1 C4/1 R/1 Bb4/1 C4/1"
        const { notes, duration } = notesFrom(`${verse} ${chorus}`, bpm)
        const bassLine = notesFrom("C2/2 Eb2/1 G2/1 R/1 Bb1/1 C2/2 R/1 C2/1.5 Eb2/0.5 G2/1 Bb1/1 C2/2 R/1 Eb2/1 G2/1 C2/2 Bb1/2 C2/2 R/1 G2/1 Eb2/1 C2/2 Bb1/1 C2/2 R/1 C2/2 Eb2/2 G2/1 Bb1/1 C2/2 R/1 Eb2/2 C2/4", bpm)
        const voice = renderVoice(notes, duration, "sing", rng)
        const beatbox = renderBeatbox(bassLine.notes, duration, bpm, rng)
        const claps = renderTicks(clapTimes(bpm, Math.ceil(duration / (60 / bpm)), rng, 0.01), duration, rng, false)
        const rhodes = transformAudio(voice, "Rhodes", { rng, era: "today", bpm, figure: "chords", touch: "beat" })
        const bass = transformAudio(beatbox, "Bass", { rng, era: "today", bpm, figure: "solo", touch: "beat" })
        const drums = transformAudio(claps, "Drums", { bpm, rng, era: "today", pocket: "boom" })
        return {
          duration,
          lengthSec: Math.max(15, Math.round(duration)),
          sections: [
            { id: "hip-verse", name: "Verse", start: 0, end: 0.5 },
            { id: "hip-chorus", name: "Chorus", start: 0.5, end: 1 },
          ],
          layers: balance([
            layer("Sung hook", "Voice", "original", "#1fbfa7", 0.9, 0.04, voice, { high: 2, space: 0.06 }),
            layer("Hip-hop chords", "Rhodes", "behind the singing · today · chords, on the beat", "#7ee0c8", 0.16, 0.18, rhodes.samples, { space: 0.1 }),
            layer("Beatbox", "Beatbox", "original", "#f0a202", 0.14, -0.08, beatbox),
            layer("Hip-hop bass", "Bass", "from the beatbox · today · on the beat", "#d98a00", 0.3, 0, bass.samples, { low: 4, high: -2 }),
            layer("Claps", "Claps", "original", "#ffd89a", 0.1, 0.12, claps),
            layer("Boom-bap kit", "Drums", "from the claps · boom-bap · today", "#3d7eff", 0.32, 0, drums.samples, { low: 2, high: 1, space: 0.02 }),
          ]),
          proof: { melody: coverage(notes, rhodes.proof.notes), bass: coverage(bassLine.notes, bass.proof.notes), drums: drums.proof.hits },
        }
      },
    },
  }
  const song = songs[id]
  if (!song) return null
  const made = song.build(mulberry32(hashSeed(id)))
  return {
    sampleRate: SR,
    lengthSec: made.lengthSec || song.lengthSec,
    sections: made.sections || null,
    shape: song.shape,
    intent: song.intent,
    bpm: song.bpm,
    blurb: song.blurb,
    duration: made.duration,
    layers: made.layers,
    proof: made.proof,
  }
}

function heardAt(data, sampleRate, options, time) {
  const rangeStart = options.rangeStart
  const rangeEnd = options.rangeEnd
  if (time < rangeStart || time >= rangeEnd) return 0
  for (const gap of options.gaps || []) {
    if (time >= gap.start && time < gap.end) return 0
  }
  const into = time - rangeStart
  const window = Math.max(0.05, rangeEnd - rangeStart)
  const duration = data.length / sampleRate
  const loops = duration >= 0.05 && duration < window - 0.05
  const at = loops ? into % duration : into
  if (!loops && at >= duration) return 0
  let index = Math.floor(at * sampleRate)
  if (index < 0) index = 0
  if (index >= data.length) index = data.length - 1
  return data[index]
}

function fillWithSection(data, sampleRate, options) {
  const song = Math.max(0.05, options.songLength || 0)
  const rangeStart = options.rangeStart ?? 0
  const rangeEnd = options.rangeEnd ?? song
  const start = Math.max(options.sectionStart ?? 0, rangeStart)
  const end = Math.min(options.sectionEnd ?? song, rangeEnd)
  if (end - start < 0.08) return null
  const sliceLen = Math.max(1, Math.round((end - start) * sampleRate))
  const total = Math.max(sliceLen, Math.round(song * sampleRate))
  if (sliceLen >= total - Math.round(sampleRate * 0.05)) return { unchanged: true }
  const slice = new Float32Array(sliceLen)
  const heard = { rangeStart, rangeEnd, gaps: options.gaps || [] }
  let peak = 0
  for (let i = 0; i < sliceLen; i++) {
    const sample = heardAt(data, sampleRate, heard, start + i / sampleRate)
    slice[i] = sample
    peak = Math.max(peak, Math.abs(sample))
  }
  if (peak < 0.00002) return null
  const fade = Math.min(Math.floor(sampleRate * 0.006), Math.floor(sliceLen / 6))
  for (let i = 0; i < fade; i++) {
    const gain = i / fade
    slice[i] *= gain
    slice[sliceLen - 1 - i] *= gain
  }
  const samples = new Float32Array(total)
  for (let i = 0; i < total; i++) samples[i] = slice[i % sliceLen]
  return { samples, loops: Math.ceil(total / sliceLen) }
}

globalThis.SongbirdMusic = {
  makeExample,
  transformAudio,
  patternHits,
  tempoFromAudio,
  tempoFromTimes,
  sampleRate: SR,
  detectNotes,
  detectOnsets,
  coverage,
  fillWithSection,
}
