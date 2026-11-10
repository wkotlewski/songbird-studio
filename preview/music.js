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
  // Each partial is a resonator (two multiplies a sample) with its own decay
  // multiplier, instead of a sin() and an exp() per partial per sample.
  // It is the same tone, several times faster, so phones keep up.
  const bank = new Float64Array(partials * 4)
  for (let harmonic = 1; harmonic <= partials; harmonic++) {
    const freq = base * harmonic * Math.sqrt(1 + STUDIO.piano.stretch * harmonic * harmonic)
    const w = (2 * Math.PI * freq) / SR
    const k = (harmonic - 1) * 4
    bank[k] = 2 * Math.cos(w)
    bank[k + 1] = Math.sin(w)
    bank[k + 2] = 0
    bank[k + 3] = Math.exp(-(1.05 + harmonic * 0.95) / SR)
  }
  const amps = new Float64Array(partials)
  for (let h = 0; h < partials; h++) amps[h] = 1 / (h + 1)
  const strikeLen = Math.floor(SR * 0.006)
  const attackLen = SR * 0.005
  for (let i = 0; i < length; i++) {
    let sample = 0
    let alive = false
    for (let h = 0, k = 0; h < partials; h++, k += 4) {
      const next = bank[k] * bank[k + 1] - bank[k + 2]
      bank[k + 2] = bank[k + 1]
      bank[k + 1] = next
      sample += bank[k + 2] * amps[h]
      amps[h] *= bank[k + 3]
      if (amps[h] > 1e-4) alive = true
    }
    if (!alive) break
    const strike = hammer && i < strikeLen ? (rng() * 2 - 1) * (1 - i / strikeLen) * 0.28 : 0
    const attack = i < attackLen ? i / attackLen : 1
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
    const wb = (2 * Math.PI * freq) / SR
    const wt = (2 * Math.PI * freq * (modern ? 3.02 : 2.5)) / SR
    const wr = (2 * Math.PI * rate) / SR
    const cb = 2 * Math.cos(wb)
    const ct = 2 * Math.cos(wt)
    const cr = 2 * Math.cos(wr)
    let b1 = Math.sin(wb)
    let b0 = 0
    let t1 = Math.sin(wt)
    let t0 = 0
    const tremStart = 2 * Math.PI * rate * note.time
    let r1 = Math.sin(tremStart)
    let r0 = Math.sin(tremStart - wr)
    const bodyFall = Math.exp(-(modern ? 1.5 : 1.05) / SR)
    const tineFall = Math.exp(-(modern ? 9 : 5.5) / SR)
    let bodyAmp = 1
    let tineAmp = 1
    const tineMix = modern ? 0.32 : 0.16
    const attackLen = SR * (modern ? 0.004 : 0.014)
    for (let i = 0; i < length; i++) {
      const body = b1 * bodyAmp
      const tine = t1 * tineAmp
      const trem = 1 - depth + depth * r1
      const attack = i < attackLen ? i / attackLen : 1
      out[start + i] += (body * 0.58 + tine * tineMix) * trem * attack * 0.72
      let next = cb * b1 - b0
      b0 = b1
      b1 = next
      next = ct * t1 - t0
      t0 = t1
      t1 = next
      next = cr * r1 - r0
      r0 = r1
      r1 = next
      bodyAmp *= bodyFall
      tineAmp *= tineFall
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
      // Harmonics 2, 3 and 5 from one sin and cos (angle sums), not four sin calls.
      const s1 = Math.sin(phase)
      const c1 = Math.cos(phase)
      const s2 = 2 * s1 * c1
      const c2 = 1 - 2 * s1 * s1
      const s3 = s2 * c1 + c2 * s1
      const c3 = c2 * c1 - s2 * s1
      const s5 = s3 * c2 + c3 * s2
      const tone = s1 * 0.72 + s2 * 0.26 + s3 * 0.14 + s5 * 0.06
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
    const w = (2 * Math.PI * freq) / SR
    const c = 2 * Math.cos(w)
    const cs = 2 * Math.cos(w / 2)
    let f1 = Math.sin(w)
    let f0 = 0
    let s1 = Math.sin(w / 2)
    let s0 = 0
    const fall = Math.exp(-0.7 / SR)
    let decay = 1
    const useSub = note.midi >= 40
    for (let i = 0; i < length; i++) {
      const t = i / SR
      const fundamental = f1
      const sub = useSub ? s1 * STUDIO.bass.sub : fundamental * 0.2
      // tanh(x * 2.1) for |x| <= 1, as a cheap rational curve.
      const x = fundamental * 2.1
      const x2 = x * x
      const grit = Math.max(-1, Math.min(1, (x * (27 + x2)) / (27 + 9 * x2))) * STUDIO.bass.grit
      const attack = Math.min(1, t / 0.01)
      const release = Math.min(1, Math.max(0, note.dur - t) / 0.07)
      const hold = 0.62 + 0.38 * decay
      out[start + i] += (sub + fundamental * STUDIO.bass.body + grit) * attack * release * hold * 0.55
      let next = c * f1 - f0
      f0 = f1
      f1 = next
      next = cs * s1 - s0
      s0 = s1
      s1 = next
      decay *= fall
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
  // A kit has a few takes of each drum, not a fresh synthesis for every hit.
  // Four takes per drum keep the human variation and save most of the work.
  const takes = {}
  const takeOf = (kind) => {
    if (!takes[kind]) takes[kind] = []
    const list = takes[kind]
    if (list.length < 4) {
      const made = renderHit(kind, rng, era)
      list.push(made)
      return made
    }
    return list[Math.floor(rng() * list.length)]
  }
  for (const hit of all) {
    const nudge = hit.kind === "hat" || hit.time < 0.02 ? 0 : (rng() - 0.5) * 0.01
    const sound = takeOf(hit.kind)
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
  // A pitch frame reads a window of sound, so a note is first heard in the
  // frame that starts before it. Move each start to where its sound
  // actually rises, so timing built on notes lands on the beat.
  const rate = down.sampleRate
  const block = Math.max(1, Math.round(rate * 0.004))
  const level = (at) => {
    let sum = 0
    for (let i = at; i < at + block && i < down.samples.length; i++) sum += down.samples[i] * down.samples[i]
    return Math.sqrt(sum / block)
  }
  for (const note of notes) {
    const from = Math.max(0, Math.floor(note.time * rate))
    const to = Math.min(down.samples.length - block, Math.floor((note.time + (win / rate) + 0.03) * rate))
    let peak = 0
    for (let at = from; at < to; at += block) peak = Math.max(peak, level(at))
    if (peak < 1e-4) continue
    // The rise: the first point that is clearly louder than just before it.
    let start = -1
    for (let at = from; at < to; at += block) {
      const now = level(at)
      if (now >= peak * 0.35 && (at - block * 3 < 0 || level(Math.max(0, at - block * 3)) < now * 0.6 || at === from)) {
        start = at
        break
      }
    }
    if (start < 0) continue
    const moved = start / rate
    const end = note.time + note.dur
    if (moved > note.time && moved < end - 0.04) {
      note.dur = end - moved
      note.time = moved
    }
  }
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
  const count = weights.length
  const coef = new Float64Array(count)
  const now = new Float64Array(count)
  const before = new Float64Array(count)
  for (let h = 0; h < count; h++) {
    const w = (2 * Math.PI * freq * (h + 1)) / SR
    coef[h] = 2 * Math.cos(w)
    now[h] = Math.sin(w)
  }
  for (let i = 0; i < length; i++) {
    const t = i / SR
    let sample = 0
    for (let h = 0; h < count; h++) {
      sample += now[h] * weights[h]
      const next = coef[h] * now[h] - before[h]
      before[h] = now[h]
      now[h] = next
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

// A layer kept from the mic is one phrase looped to fill the song, like a
// loop pedal. When the audio really is that loop repeated, Songbird builds
// the new instrument for one pass and loops it, so every pass matches and a
// one-minute layer costs the same as its phrase. Anything else renders whole.
function loopPlan(samples, rate, kind, options) {
  const loop = Math.round(options.loopSamples || 0)
  if (!loop || loop < rate * 0.5 || loop > rate * 40) return null
  if (samples.length < loop * 1.5) return null
  if (plannedDrums(kind, options)) return null
  if (!isLooped(samples, loop)) return null
  return { inSamples: loop, period: (loop * SR) / rate, total: Math.round((samples.length * SR) / rate) }
}

function isLooped(samples, loop) {
  if (!loop || samples.length < loop * 1.5) return false
  const span = samples.length - loop
  const checks = Math.min(span, 2048)
  let heard = 0
  for (let n = 0; n < checks; n++) {
    const i = Math.floor((n / checks) * span)
    const a = samples[i]
    if (Math.abs(a - samples[i + loop]) > 1e-6) return false
    if (Math.abs(a) > 1e-4) heard += 1
  }
  return heard > 0
}

// Run a sample-by-sample edit on one pass of a looped layer, then loop the
// result. outRate is the rate the edit returns.
function onEachLoop(samples, rate, loop, outRate, run) {
  const passes = Math.round(loop || 0)
  if (!passes || passes > rate * 60 || !isLooped(samples, passes)) return null
  const made = run(samples.slice(0, passes))
  if (!made) return null
  return tileLoop(made, (passes * outRate) / rate, Math.round((samples.length * outRate) / rate))
}

function tileLoop(phrase, period, total) {
  const out = new Float32Array(total)
  for (let k = 0; ; k++) {
    const start = Math.round(k * period)
    if (start >= total) break
    const room = Math.min(phrase.length, total - start)
    out.set(room === phrase.length ? phrase : phrase.subarray(0, room), start)
  }
  return out
}

const notesMemo = new WeakMap()

function detectNotesOnce(samples, options = {}) {
  let byOptions = notesMemo.get(samples)
  if (!byOptions) {
    byOptions = new Map()
    notesMemo.set(samples, byOptions)
  }
  const key = JSON.stringify(options)
  if (!byOptions.has(key)) byOptions.set(key, detectNotes(samples, options))
  return byOptions.get(key).map((note) => ({ ...note }))
}

function transformAudio(samples, kind, options = {}) {
  const rate = options.sampleRate || SR
  const loop = loopPlan(samples, rate, kind, options)
  if (loop) {
    const phrase = toEngineRate(samples.subarray(0, loop.inSamples), rate)
    const made = transformCore(phrase, kind, options)
    if (!made) return null
    return { ...made, samples: tileLoop(made.samples, loop.period, loop.total), loop: { period: loop.period / SR } }
  }
  samples = toEngineRate(samples, rate)
  const cap = SR * (plannedDrums(kind, options) ? 300 : 40)
  if (samples.length > cap) samples = samples.subarray(0, cap)
  return transformCore(samples, kind, options)
}

// A drum pattern or pocket is written on the beat grid, so it does not need
// to listen to the recording, and it can run the whole length of the layer.
function plannedDrums(kind, options) {
  return kind === "Drums" && !!((options.pattern && options.pattern.hits && options.pattern.hits.length) || options.pocket === "backbeat" || options.pocket === "boom")
}

// A genre package turns one layer into several parts. The melody is found
// once and shared by every part.
function transformSteps(samples, steps, options = {}) {
  const rate = options.sampleRate || SR
  const results = []
  const prepared = new Map()
  for (const step of steps || []) {
    const stepOptions = { ...options, ...step.options }
    const loop = loopPlan(samples, rate, step.sound, stepOptions)
    const key = loop ? "loop" : "whole"
    if (!prepared.has(key)) {
      if (loop) prepared.set(key, toEngineRate(samples.subarray(0, loop.inSamples), rate))
      else prepared.set(key, toEngineRate(samples, rate))
    }
    const source = prepared.get(key)
    const cap = SR * (plannedDrums(step.sound, stepOptions) ? 300 : 40)
    let made = transformCore(source.length > cap ? source.subarray(0, cap) : source, step.sound, stepOptions)
    if (made && loop) made = { ...made, samples: tileLoop(made.samples, loop.period, loop.total) }
    results.push(made ? { samples: made.samples, proof: made.proof } : null)
  }
  return results
}

function transformCore(samples, kind, options = {}) {
  const bpm = options.bpm || 92
  const duration = samples.length / SR
  const rng = options.rng || mulberry32(1)
  const era = options.era && eraTone(options.era) ? options.era : undefined
  if (kind === "Drums") {
    const planned = (options.pattern && options.pattern.hits && options.pattern.hits.length) || options.pocket === "backbeat" || options.pocket === "boom"
    let hits = planned ? [] : hitsFromOnsets(detectOnsets(samples), bpm)
    if (!planned && hits.length < 2) {
      const melody = detectNotesOnce(samples)
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
    let notes = detectNotesOnce(samples, { minHz: 40, maxHz: 180, lowpass: 220, minEnergy: 0.00015 })
    if (!notes.length) {
      notes = detectNotesOnce(samples).map((note) => ({ ...note, midi: Math.max(36, note.midi - 12) }))
    }
    if (!notes.length) return null
    const arranged = options.figure ? arrangePerformance(notes, { ...options, kind: "Bass" }) : null
    const play = arranged ? arranged.notes : notes
    const style = arranged ? { plain: true, exact: arranged.exact } : {}
    return { samples: finish(renderBass(play, duration, era, style)), proof: { notes }, figure: arranged }
  }
  const notes = detectNotesOnce(samples)
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

function pitchHz(frame, sampleRate) {
  const minLag = Math.max(2, Math.floor(sampleRate / 880))
  const maxLag = Math.min(frame.length - 2, Math.floor(sampleRate / 80))
  if (maxLag <= minLag) return null
  const diff = new Float32Array(maxLag + 1)
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0
    for (let i = 0; i < frame.length - lag; i += 2) {
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
  let best = -1
  for (let i = minLag; i <= maxLag; i++) {
    if (cmnd[i] < 0.18) {
      best = i
      while (best + 1 <= maxLag && cmnd[best + 1] < cmnd[best]) best += 1
      break
    }
  }
  if (best < 0 || cmnd[best] > 0.28) return null
  const prev = cmnd[best - 1] ?? cmnd[best]
  const next = cmnd[best + 1] ?? cmnd[best]
  const denom = prev - 2 * cmnd[best] + next
  const shift = denom ? Math.max(-0.5, Math.min(0.5, (prev - next) / (2 * denom))) : 0
  return sampleRate / (best + shift)
}

function tuneVoice(samples, sampleRate, strength, loopSamples) {
  if (loopSamples) {
    const looped = onEachLoop(samples, sampleRate, loopSamples, SR, (pass) => tuneVoice(pass, sampleRate, strength))
    if (looped) return looped
  }
  const src = toEngineRate(samples, sampleRate)
  const amount = Math.max(0, Math.min(1, strength || 0))
  if (amount <= 0) return src
  // Read the pitch every 5.8 ms (on a half-rate copy, which is plenty for
  // a voice), then treat each held note as one piece: one steady correction
  // per note keeps vibrato and slides, and never chops the sound up.
  const halfLen = Math.floor(src.length / 2)
  const half = new Float32Array(halfLen)
  for (let i = 0; i < halfLen; i++) half[i] = ((src[i * 2] || 0) + (src[i * 2 + 1] || 0)) * 0.5
  const halfRate = SR / 2
  const win = 1024
  const hop = 128
  const frames = []
  for (let start = 0; start + win < half.length; start += hop) {
    const frame = half.subarray(start, start + win)
    let energy = 0
    for (let i = 0; i < win; i += 4) energy += frame[i] * frame[i]
    const hz = energy / (win / 4) > 0.00012 ? pitchHz(frame, halfRate) : null
    frames.push(hz ? 69 + 12 * Math.log2(hz / 440) : null)
  }
  const frameTime = (index) => (index * hop + win / 2) / halfRate
  const pieces = []
  let current = null
  frames.forEach((midi, index) => {
    const note = midi == null ? null : Math.round(midi)
    if (current && (note === null || Math.abs(midi - current.note) > 0.75)) {
      pieces.push(current)
      current = null
    }
    if (note === null) return
    if (!current) current = { note, start: index, end: index, values: [] }
    current.end = index
    current.values.push(midi)
  })
  if (current) pieces.push(current)
  const out = src.slice()
  const fade = Math.floor(SR * 0.02)
  for (const piece of pieces) {
    if (piece.values.length < 6) continue
    const sorted = piece.values.slice().sort((x, y) => x - y)
    const middle = sorted[Math.floor(sorted.length / 2)]
    const cents = (Math.round(middle) - middle) * amount
    if (Math.abs(cents) < 0.08) continue
    const from = Math.max(0, Math.floor(frameTime(piece.start) * SR) - fade)
    const to = Math.min(src.length, Math.floor(frameTime(piece.end) * SR) + fade)
    if (to - from < 4096) continue
    const shifted = shiftPitch(src.subarray(from, to), SR, cents, 0)
    for (let i = 0; i < to - from; i++) {
      // A smooth handover in and out of the corrected note.
      const edge = Math.min(i, to - from - 1 - i)
      const mix = edge >= fade ? 1 : 0.5 - 0.5 * Math.cos((Math.PI * edge) / fade)
      out[from + i] = src[from + i] * (1 - mix) + shifted[i] * mix
    }
  }
  return out
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

function medianValue(values) {
  if (!values.length) return 0
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function timingOnsets(samples, sampleRate) {
  const hop = Math.max(1, Math.floor(sampleRate * 0.008))
  const times = []
  let previous = 0
  for (let i = 0; i + hop < samples.length; i += hop) {
    let low = 0
    let high = 0
    let last = samples[i] || 0
    const steps = Math.max(1, Math.floor(hop / 2))
    for (let j = 0; j < hop; j += 2) {
      const sample = samples[i + j] || 0
      low += sample * sample
      const diff = sample - last
      high += diff * diff
      last = sample
    }
    const body = Math.sqrt(low / steps)
    const edge = Math.sqrt(high / steps)
    const bright = edge > 0.02 && edge > body * 0.7
    if (bright && edge > previous * 1.4 && (!times.length || i / sampleRate - times[times.length - 1] > 0.07)) times.push(i / sampleRate)
    previous = edge * 0.55 + previous * 0.45
  }
  let notes = []
  try {
    notes = detectNotes(toEngineRate(samples, sampleRate)).map((note) => note.time)
  } catch {
    notes = []
  }
  return mergeTimes([times, notes])
}

function timingPocket(times, beat) {
  if (times.length < 4) return null
  const offsets = times.map((time) => (time - Math.round(time / beat) * beat) / beat)
  const center = medianValue(offsets)
  const spread = medianValue(offsets.map((offset) => Math.abs(offset - center)))
  if (spread > 0.06) return null
  const offbeat = Math.abs(Math.abs(center) - 0.5) < 0.08
  const swing = Math.abs(Math.abs(center) - 0.33) < 0.07
  if (offbeat || swing) return { center, spread, offbeat, swing }
  return null
}

// Move notes onto the beat by gently speeding up or slowing down the sound
// between them (keeping its pitch), instead of cutting it into pieces.
// Nothing is dropped, nothing doubles, and there are no gaps.
function renderTimingMoves(samples, sampleRate, anchors) {
  const count = samples.length
  const src = toEngineRate(samples, sampleRate)
  const rate = SR
  const scale = rate / sampleRate
  const points = [{ from: 0, to: 0 }]
  for (const anchor of anchors.slice().sort((x, y) => x.from - y.from)) {
    const last = points[points.length - 1]
    const from = anchor.from * rate
    const to = anchor.to * rate
    // Keep the map moving forward, and no stretch past 40% either way.
    if (from - last.from < rate * 0.04) continue
    const factor = (to - last.to) / (from - last.from)
    if (factor < 0.6 || factor > 1.4) continue
    points.push({ from, to })
  }
  const end = src.length
  if (end - points[points.length - 1].from > 1) points.push({ from: end, to: end })
  const out = new Float32Array(end)
  const fade = Math.floor(rate * 0.01)
  let written = 0
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i]
    const b = points[i + 1]
    const from = Math.round(a.from)
    const length = Math.round(b.from) - from
    const target = Math.round(b.to) - Math.round(a.to)
    if (length <= 0 || target <= 0) continue
    // A little extra on each side lets the pieces overlap smoothly.
    const pad = Math.min(fade, from)
    const piece = src.subarray(from - pad, Math.min(end, from + length + fade))
    let made
    const factor = target / length
    if (Math.abs(factor - 1) < 0.004 || piece.length < 4096) {
      made = new Float32Array(Math.round(piece.length * factor))
      for (let k = 0; k < made.length; k++) {
        const pos = k / factor
        const index = Math.floor(pos)
        const frac = pos - index
        made[k] = (piece[index] || 0) * (1 - frac) + (piece[index + 1] || 0) * frac
      }
    } else {
      made = wsolaStretch(piece, factor)
    }
    const startOut = Math.round(a.to) - Math.round(pad * factor)
    for (let k = 0; k < made.length; k++) {
      const at = startOut + k
      if (at < 0 || at >= end) continue
      const overlapIn = at < written ? Math.min(1, (at - startOut) / fade) : 1
      if (at < written) out[at] = out[at] * (1 - overlapIn) + made[k] * overlapIn
      else if (at < Math.round(b.to) + fade) out[at] = made[k]
    }
    written = Math.max(written, Math.min(end, Math.round(b.to) + fade))
  }
  // Back to the take's own rate and length.
  if (scale === 1) return out
  const back = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const pos = i * scale
    const index = Math.floor(pos)
    const frac = pos - index
    back[i] = (out[index] || 0) * (1 - frac) + (out[index + 1] || 0) * frac
  }
  return back
}

function fixTiming(layers, options = {}) {
  const bpm = Math.max(40, Math.min(220, options.bpm || 92))
  const beat = 60 / bpm
  const slack = Math.min(0.42, Math.max(0.06, options.slack ?? 0.18))
  const dead = 0.05
  const prepared = (layers || []).map((layer) => {
    const samples = layer.samples
    const sampleRate = layer.sampleRate || SR
    const start = layer.start || 0
    const local = samples?.length ? timingOnsets(samples, sampleRate) : []
    return {
      id: layer.id,
      samples,
      sampleRate,
      start,
      song: local.map((time) => start + time),
      local,
      pocket: null,
    }
  }).filter((layer) => layer.samples?.length)
  for (const layer of prepared) layer.pocket = timingPocket(layer.song, beat)
  const results = prepared.map((layer) => {
    const others = prepared.filter((item) => item.id !== layer.id)
    const anchors = []
    let moved = 0
    let silent = 0
    let bare = 0
    let floating = 0
    const usedBeats = new Set()
    for (let index = 0; index < layer.song.length; index++) {
      const songTime = layer.song[index]
      const quarter = Math.round(songTime / beat) * beat
      const eighth = Math.round(songTime / (beat / 2)) * (beat / 2)
      const toQuarter = Math.abs(songTime - quarter)
      const toEighth = Math.abs(songTime - eighth)
      const nearest = toQuarter <= toEighth ? quarter : eighth
      const nearestDist = Math.min(toQuarter, toEighth)
      let target = songTime
      let reason = ""
      if (layer.pocket) {
        const pocketAt = quarter + layer.pocket.center * beat
        const miss = Math.abs(songTime - pocketAt)
        if (miss > beat * 0.07 && miss <= beat * slack) {
          target = pocketAt
          reason = "pocket"
        }
      } else if (nearestDist <= beat * dead) {
        target = songTime
      } else {
        const beatIndex = Math.round(quarter / beat)
        const othersHit = others.some((item) => item.song.some((time) => Math.abs(time - quarter) <= beat * dead))
        const already = layer.song.some((time, item) => item !== index && Math.abs(time - quarter) <= beat * dead)
        if (!already && !usedBeats.has(beatIndex) && othersHit && toQuarter <= beat * slack && toQuarter + beat * 0.02 < toEighth) {
          target = quarter
          reason = "silent"
          usedBeats.add(beatIndex)
        } else if (nearestDist <= beat * slack) {
          target = nearest
          reason = nearestDist > beat * 0.16 ? "floating" : "bare"
        }
      }
      const localTarget = target - layer.start
      anchors.push({ from: layer.local[index], to: Math.max(0, localTarget) })
      if (Math.abs(target - songTime) > 0.004) {
        moved += 1
        if (reason === "silent") silent += 1
        else if (reason === "floating") floating += 1
        else bare += 1
      }
    }
    const samples = moved ? renderTimingMoves(layer.samples, layer.sampleRate, anchors) : null
    return {
      id: layer.id,
      samples,
      moved,
      silent,
      bare,
      floating,
      pocket: !!layer.pocket,
    }
  })
  return results
}

function starterAudio(options = {}) {
  const bpm = Math.max(40, Math.min(200, options.bpm || 96))
  const beat = 60 / bpm
  const bars = Math.max(1, options.bars || 4)
  const duration = Math.min(40, bars * 4 * beat)
  const key = ((options.key ?? 0) % 12 + 12) % 12
  const rng = mulberry32(key * 17 + Math.round(bpm))
  const kind = options.kind === "snaps" || options.kind === "guitar" || options.kind === "piano" ? options.kind : "claps"
  if (kind === "claps" || kind === "snaps") {
    const hits = []
    const count = Math.max(4, Math.floor(duration / beat))
    for (let i = 0; i < count; i++) {
      if (i % 4 === 1 || i % 4 === 3) hits.push({ time: i * beat, kind: "snare" })
    }
    const drums = finish(renderDrums(hits, duration, rng, "today"))
    if (kind === "snaps") {
      for (let i = 0; i < drums.length; i++) drums[i] *= 0.62
    }
    return { samples: drums, sampleRate: SR, bpm, kind }
  }
  const progression = [
    [0, 4, 7],
    [7, 11, 14],
    [9, 12, 16],
    [5, 9, 12],
  ]
  const notes = []
  const bar = beat * 4
  const cycles = Math.max(1, Math.ceil(duration / (bar * 4)))
  for (let cycle = 0; cycle < cycles; cycle++) {
    progression.forEach((chord, index) => {
      const time = (cycle * 4 + index) * bar
      if (time >= duration - 0.08) return
      chord.forEach((interval, stringIndex) => {
        const gap = kind === "guitar" ? stringIndex * 0.034 : 0
        notes.push({
          midi: 60 + key + interval,
          time: time + gap,
          dur: Math.max(0.2, bar * 0.9 - gap),
        })
      })
    })
  }
  const samples = kind === "guitar"
    ? renderGuitar(notes, duration, rng, { era: "today", plain: true, exact: true })
    : renderPiano(notes, duration, rng, "today", { plain: true, exact: true })
  return { samples: finish(samples), sampleRate: SR, bpm, kind }
}

function biquad(type, freq, sampleRate, q = 0.707, gainDb = 0) {
  const w0 = (2 * Math.PI * freq) / sampleRate
  const cos = Math.cos(w0)
  const sin = Math.sin(w0)
  const A = 10 ** (gainDb / 40)
  const alpha = sin / (2 * q)
  let b0 = 1
  let b1 = 0
  let b2 = 0
  let a0 = 1
  let a1 = 0
  let a2 = 0
  if (type === "highpass") {
    b0 = (1 + cos) / 2
    b1 = -(1 + cos)
    b2 = (1 + cos) / 2
    a0 = 1 + alpha
    a1 = -2 * cos
    a2 = 1 - alpha
  } else if (type === "highshelf") {
    const two = 2 * Math.sqrt(A) * alpha
    b0 = A * (A + 1 + (A - 1) * cos + two)
    b1 = -2 * A * (A - 1 + (A + 1) * cos)
    b2 = A * (A + 1 + (A - 1) * cos - two)
    a0 = A + 1 - (A - 1) * cos + two
    a1 = 2 * (A - 1 - (A + 1) * cos)
    a2 = A + 1 - (A - 1) * cos - two
  } else if (type === "lowshelf") {
    const two = 2 * Math.sqrt(A) * alpha
    b0 = A * (A + 1 - (A - 1) * cos + two)
    b1 = 2 * A * (A - 1 - (A + 1) * cos)
    b2 = A * (A + 1 - (A - 1) * cos - two)
    a0 = A + 1 + (A - 1) * cos + two
    a1 = -2 * (A - 1 + (A + 1) * cos)
    a2 = A + 1 + (A - 1) * cos - two
  } else {
    b0 = 1 + alpha * A
    b1 = -2 * cos
    b2 = 1 - alpha * A
    a0 = 1 + alpha / A
    a1 = -2 * cos
    a2 = 1 - alpha / A
  }
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 }
}

function runBiquad(samples, coeff) {
  const out = new Float32Array(samples.length)
  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  for (let i = 0; i < samples.length; i++) {
    const x0 = samples[i]
    const y0 = coeff.b0 * x0 + coeff.b1 * x1 + coeff.b2 * x2 - coeff.a1 * y1 - coeff.a2 * y2
    x2 = x1
    x1 = x0
    y2 = y1
    y1 = y0
    out[i] = y0
  }
  return out
}

function noiseFloorRms(samples, sampleRate) {
  const frame = Math.max(1, Math.round(sampleRate * 0.02))
  const levels = []
  for (let i = 0; i < samples.length; i += frame) {
    let sum = 0
    const end = Math.min(samples.length, i + frame)
    for (let j = i; j < end; j++) sum += samples[j] * samples[j]
    levels.push(Math.sqrt(sum / (end - i)))
  }
  if (!levels.length) return 0
  levels.sort((a, b) => a - b)
  return levels[Math.min(levels.length - 1, Math.floor(levels.length * 0.2))]
}

function followLevel(samples, sampleRate) {
  const env = new Float32Array(samples.length)
  const att = Math.exp(-1 / (0.0015 * sampleRate))
  const rel = Math.exp(-1 / (0.08 * sampleRate))
  let level = 0
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i])
    level = abs > level ? att * level + (1 - att) * abs : rel * level + (1 - rel) * abs
    env[i] = Math.max(level, abs)
  }
  return env
}

function highBand(samples, sampleRate, freq) {
  const blend = Math.exp((-2 * Math.PI * freq) / sampleRate)
  const out = new Float32Array(samples.length)
  let y = 0
  let prev = 0
  for (let i = 0; i < samples.length; i++) {
    y = blend * (y + samples[i] - prev)
    prev = samples[i]
    out[i] = y
  }
  return out
}

function inputMakeup(peak, noise) {
  const floor = Math.max(0.004, noise || 0)
  if (peak < floor * 1.8) return 1.15
  return Math.min(4.5, Math.max(1.15, 0.48 / Math.max(peak, 0.02)))
}

function enhanceAudio(samples, sampleRate, options = {}) {
  if (options.loopSamples) {
    const looped = onEachLoop(samples, sampleRate, options.loopSamples, sampleRate, (pass) => enhanceAudio(pass, sampleRate, { ...options, loopSamples: 0 }))
    if (looped) return looped
  }
  const amount = Math.min(1, Math.max(0.15, options.amount || 0.65))
  const mode = options.mode || "clear"
  const source = samples instanceof Float32Array ? samples : Float32Array.from(samples)
  let out = new Float32Array(source)
  if (mode === "clear" || mode === "hiss" || mode === "smooth") {
    out = runBiquad(out, biquad("highpass", 75, sampleRate, 0.7))
  }
  const noise = noiseFloorRms(source, sampleRate)
  const env = followLevel(out, sampleRate)
  const hiss = mode === "bright" || mode === "warm" ? null : highBand(out, sampleRate, mode === "hiss" ? 4200 : 5600)
  const open = Math.max(1e-5, noise * (mode === "hiss" ? 2.2 : 2.8) * (1.15 - amount * 0.35))
  const closed = mode === "hiss" ? 0.08 : 0.16
  if (mode === "clear" || mode === "hiss") {
    const next = new Float32Array(out.length)
    for (let i = 0; i < out.length; i++) {
      const level = env[i]
      let gate = 1
      if (level < open) {
        const t = level / open
        gate = closed + (1 - closed) * t * t
      }
      const quiet = level < open * 1.4
      const pull = hiss ? hiss[i] * amount * (quiet ? (mode === "hiss" ? 0.9 : 0.72) : 0.18) : 0
      next[i] = out[i] * gate - pull * (quiet ? gate : 1)
    }
    out = next
  }
  if (mode === "clear" || mode === "bright") {
    out = runBiquad(out, biquad("highshelf", 2800, sampleRate, 0.7, 1.5 + amount * 3))
  }
  if (mode === "warm") {
    out = runBiquad(out, biquad("lowshelf", 180, sampleRate, 0.7, 1.5 + amount * 3.5))
    out = runBiquad(out, biquad("highshelf", 7000, sampleRate, 0.7, -1.5 - amount * 2))
  }
  if (mode === "smooth") {
    out = runBiquad(out, biquad("peaking", 6200, sampleRate, 1.2, -2 - amount * 4))
  }
  let srcPeak = 0
  let outPeak = 0
  for (let i = 0; i < source.length; i++) {
    srcPeak = Math.max(srcPeak, Math.abs(source[i]))
    outPeak = Math.max(outPeak, Math.abs(out[i]))
  }
  if (outPeak > 1e-6 && srcPeak > 1e-6) {
    const gain = Math.min(srcPeak / outPeak, 1.4)
    for (let i = 0; i < out.length; i++) out[i] *= gain
  }
  return out
}

// ---------------------------------------------------------------------------
// Performance plans. The page turns a plan into sound with recorded
// instrument samples. A plan is notes (or drum hits) for one pass of the
// layer, already tidied: snapped to the beat, kept in key, and voiced for a
// solo, chords, or a section.

const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const MINOR = [0, 2, 3, 5, 7, 8, 10]

function keyOf(notes) {
  // Weighted by how long each note is held. Tries major and natural minor.
  const weight = new Float64Array(12)
  for (const note of notes) weight[((Math.round(note.midi) % 12) + 12) % 12] += Math.max(0.05, note.dur)
  const pc = (note) => ((Math.round(note.midi) % 12) + 12) % 12
  const total = weight.reduce((a, b) => a + b, 0) || 1
  // Tunes tend to start and, above all, end on home.
  const home = new Float64Array(12)
  if (notes.length) {
    home[pc(notes[0])] += total * 0.25
    home[pc(notes[notes.length - 1])] += total * 0.45
  }
  let best = { root: 0, scale: MAJOR, score: -1 }
  for (let root = 0; root < 12; root++) {
    for (const scale of [MAJOR, MINOR]) {
      let score = 0
      for (const step of scale) score += weight[(root + step) % 12]
      score += weight[root] * 0.6 + home[root] + home[(root + 7) % 12] * 0.2 + home[(root + scale[2]) % 12] * 0.15
      if (scale === MAJOR) score += total * 0.01
      if (score > best.score + 1e-9) best = { root, scale, score }
    }
  }
  return { root: best.root, minor: best.scale === MINOR, scale: best.scale }
}

function inKey(midi, key) {
  const pc = (((midi - key.root) % 12) + 12) % 12
  if (key.scale.includes(pc)) return midi
  // Out of key: go to the nearer scale note (up wins a tie, like a lift).
  return key.scale.includes((pc + 1) % 12) ? midi + 1 : midi - 1
}

function scaleStep(midi, steps, key) {
  const rel = midi - key.root
  const oct = Math.floor(rel / 12)
  const pc = ((rel % 12) + 12) % 12
  let index = key.scale.indexOf(pc)
  if (index < 0) index = key.scale.findIndex((step) => step > pc) - 1
  if (index < 0) index = 0
  const total = oct * 7 + index + steps
  return key.root + Math.floor(total / 7) * 12 + key.scale[((total % 7) + 7) % 7]
}

function fitRange(notes, low, high) {
  if (!notes.length || low == null) return notes
  // Stay in the octave you sang when the instrument can play it there;
  // otherwise move whole octaves to fit the most notes.
  let shift = 0
  let fewest = Infinity
  for (const candidate of [0, 12, -12, 24, -24]) {
    const outside = notes.filter((note) => note.midi + candidate < low || note.midi + candidate > high).length
    if (outside < fewest) {
      fewest = outside
      shift = candidate
    }
  }
  return notes.map((note) => {
    let midi = note.midi + shift
    while (midi < low) midi += 12
    while (midi > high) midi -= 12
    return { ...note, midi }
  })
}

function snapTimes(notes, bpm, total, grid, beatLen, phase = 0) {
  const step = (beatLen || 60 / bpm) / grid
  const out = []
  for (const note of notes) {
    const start = Math.max(0, phase + Math.round((note.time - phase) / step) * step)
    const end = Math.max(start + step, phase + Math.round((note.time + note.dur - phase) / step) * step)
    if (start >= total - 0.01) continue
    const prev = out[out.length - 1]
    if (prev && Math.abs(prev.time - start) < 1e-6) {
      // Two notes landed on the same step: keep the longer one.
      if (note.dur > prev.dur) out[out.length - 1] = { ...note, time: start, dur: Math.min(end, total) - start }
      continue
    }
    if (prev && prev.time + prev.dur > start) prev.dur = Math.max(step * 0.5, start - prev.time)
    out.push({ ...note, time: start, dur: Math.min(end, total) - start })
  }
  return out
}

function joinShortGaps(notes) {
  const out = []
  for (const note of notes) {
    const prev = out[out.length - 1]
    if (prev && prev.midi === note.midi && note.time - (prev.time + prev.dur) < 0.09) prev.dur = note.time + note.dur - prev.time
    else out.push({ ...note })
  }
  return out.filter((note) => note.dur >= 0.08)
}

function chordTones(midi, key, low) {
  let root = midi
  while (root > low + 12) root -= 12
  while (root < low) root += 12
  return [root, scaleStep(root, 2, key), scaleStep(root, 4, key)]
}

// Pick a chord for each half bar that fits the notes sung over it, the way
// a player would: chord tones count for it, clashing notes against it, home
// is a good place to start and end, and a chord holds when the tune rests.
function harmonize(melody, key, beat, phase, pass, options = {}) {
  const span = beat * 2
  const degrees = key.minor ? [0, 2, 3, 4, 5] : [0, 1, 3, 4, 5]
  const chords = degrees.map((degree) => {
    const root = scaleStep(key.root + 48, degree, key)
    const tones = [root, scaleStep(root, 2, key), scaleStep(root, 4, key)].map((m) => ((m % 12) + 12) % 12)
    return { degree, root: ((root % 12) + 12) % 12, tones }
  })
  const spans = []
  let start = phase
  while (start - span > -span * 0.5) start -= span
  for (let t = start; t < pass - 0.01; t += span) spans.push(t)
  const out = []
  let previous = null
  spans.forEach((t, index) => {
    const inside = melody.filter((note) => note.time < t + span - 0.01 && note.time + note.dur > t + 0.01)
    if (!inside.length && previous) {
      out.push({ ...previous, time: t, dur: span })
      return
    }
    let best = chords[0]
    let bestScore = -Infinity
    for (const chord of chords) {
      let score = 0
      for (const note of inside) {
        const overlap = Math.min(note.time + note.dur, t + span) - Math.max(note.time, t)
        const lead = Math.abs(note.time - t) < beat * 0.3 ? 1.5 : 1
        const pc = ((Math.round(note.midi) % 12) + 12) % 12
        if (chord.tones.includes(pc)) score += overlap * lead * (pc === chord.root ? 1.4 : 1)
        else score -= overlap * lead * 0.7
      }
      if (chord.degree === 0 && (index === 0 || index === spans.length - 1)) score += beat * 0.4
      // Held sounds (choir, organ, strings) change chord less often: every
      // change is heard in full, so it has to be worth it.
      if (previous && previous.degree === chord.degree) score += beat * (options.steady ? 0.45 : 0.15)
      // On the bar line rather than mid-bar, when it's close.
      if (options.steady && previous && previous.degree !== chord.degree && index % 2 === 1) score -= beat * 0.2
      if (score > bestScore) {
        bestScore = score
        best = chord
      }
    }
    previous = { degree: best.degree, root: best.root, tones: best.tones }
    out.push({ ...previous, time: t, dur: span })
  })
  return out
}

function voiceChord(chord, style, low, high) {
  let root = low + ((chord.root - low) % 12 + 12) % 12
  if (root < Math.max(low, 40)) root += 12
  const third = root + ((chord.tones[1] - chord.root + 12) % 12)
  const fifth = root + ((chord.tones[2] - chord.root + 12) % 12)
  let notes
  if (style === "strum") notes = [root, fifth, root + 12, third + 12, fifth + 12]
  else if (style === "block") notes = [root, third + 12, fifth + 12, root + 24].filter((m) => m <= high + 12)
  else notes = [root + 12, third + 12, fifth + 12]
  return notes.map((m) => {
    while (m > high) m -= 12
    while (m < low) m += 12
    return m
  })
}

// The three notes of a chord, placed so each voice moves as little as it
// can from the last chord. The first chord sits around the middle.
function leadVoices(chord, prev, low, high, center) {
  const pcs = chord.tones
  const near = (pc, target) => {
    let m = target - ((((target - pc) % 12) + 12) % 12)
    if (target - m > 6) m += 12
    while (m < low) m += 12
    while (m > high) m -= 12
    return m
  }
  if (!prev) {
    // Close position, top voice near the middle of the range.
    let best = null
    for (let r = 0; r < 3; r++) {
      const order = [pcs[r], pcs[(r + 1) % 3], pcs[(r + 2) % 3]]
      let bottom = near(order[0], center - 5)
      const voices = [bottom]
      for (let i = 1; i < 3; i++) {
        let m = bottom + ((((order[i] - bottom) % 12) + 12) % 12)
        if (m <= voices[i - 1]) m += 12
        voices.push(m)
        bottom = m
      }
      const cost = Math.abs(voices[1] - center)
      if (voices[2] <= high && voices[0] >= low && (!best || cost < best.cost)) best = { voices, cost }
    }
    return best ? best.voices : pcs.map((pc) => near(pc, center))
  }
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]
  let best = null
  for (const perm of perms) {
    const voices = prev.map((from, i) => near(pcs[perm[i]], from))
    const sorted = [...voices].sort((a, b) => a - b)
    if (sorted[0] === sorted[1] || sorted[1] === sorted[2]) continue
    let cost = voices.reduce((sum, m, i) => sum + Math.abs(m - prev[i]), 0)
    // Stay near the middle over a long song.
    cost += Math.abs(sorted[1] - center) * 0.15
    if (!best || cost < best.cost) best = { voices: sorted, cost }
  }
  return best ? best.voices : leadVoices(chord, null, low, high, center)
}

function bassRoot(chord, low) {
  let root = low + ((chord.root - low) % 12 + 12) % 12
  if (root < 40) root += 12
  return root
}

function accompany(harmony, options) {
  const beat = options.beat
  const style = options.style || "block"
  const events = []
  const pass = options.total
  const put = (midi, time, dur, vel) => {
    let t = time
    if (t < 0) {
      if (!options.loop) return
      t += pass
    }
    if (t >= pass || dur <= 0.02) return
    events.push({ midi, time: t, dur, vel })
  }
  if (style === "held") {
    // Hold each chord until it changes, the way a choir, an organist, or a
    // string section would: each voice moves to the nearest note of the next
    // chord, a note both chords share keeps sounding, and chords overlap a
    // little so there's no gap between them.
    const blocks = []
    for (let i = 0; i < harmony.length; i++) {
      const chord = harmony[i]
      let dur = chord.dur
      while (i + 1 < harmony.length && harmony[i + 1].degree === chord.degree) {
        dur += harmony[i + 1].dur
        i++
      }
      blocks.push({ chord, time: chord.time, dur })
    }
    const low = Math.max(options.low, 40)
    const high = options.high
    const center = Math.max(low + 7, Math.min(high - 7, options.center || 62))
    const withBass = options.withBass
    let prev = null
    const open = []
    blocks.forEach((block, index) => {
      const upper = leadVoices(block.chord, prev, low, high, center)
      prev = upper
      const voices = withBass ? [bassRoot(block.chord, low), ...upper] : upper
      const end = block.time + block.dur
      voices.forEach((midi, n) => {
        const held = open[n]
        // A shared note carries on into the next chord.
        if (held && held.midi === midi && Math.abs(held.time + held.dur - block.time) < 0.05) {
          held.dur = end - held.time
          return
        }
        const event = { midi, time: block.time, dur: block.dur + 0.06, vel: (n === 0 ? 0.72 : 0.62) + (index % 2 ? -0.03 : 0.02) }
        open[n] = event
        events.push(event)
      })
    })
    // Keep the times inside the pass, wrapping a loop's pickup to the end.
    return events.filter((event) => {
      if (event.time < 0) {
        if (!options.loop) return false
        event.time += pass
      }
      if (event.time >= pass || event.dur <= 0.02) return false
      return true
    }).map((event) => ({ ...event, dur: Math.min(event.dur, pass + 0.06 - event.time) }))
  }
  for (const chord of harmony) {
    const tones = voiceChord(chord, style, options.low, options.high)
    if (style === "strum") {
      // Down, down-up, up-down-up: the pattern most players reach for.
      const pattern = [[0, "D"], [2, "D"], [3, "U"], [5, "U"], [6, "D"], [7, "U"]]
      const halfBar = Math.round(((chord.time - options.phase) / (beat * 2))) % 2 === 0 ? 0 : 4
      const eighth = beat / 2
      for (const [slot, way] of pattern) {
        if (slot < halfBar || slot >= halfBar + 4) continue
        const at = chord.time + (slot - halfBar) * eighth
        const next = pattern.find(([s]) => s > slot)
        const until = next && next[0] < halfBar + 4 ? (next[0] - slot) * eighth : (halfBar + 4 - slot) * eighth
        const order = way === "D" ? tones : tones.slice(-3).reverse()
        order.forEach((midi, n) => put(midi, at + n * 0.012, Math.max(0.1, until - n * 0.012), (way === "D" ? 0.8 : 0.55) * (slot === 0 ? 1.1 : 1)))
      }
    } else if (style === "beat") {
      for (let b = 0; b < 2; b++) tones.forEach((midi, n) => put(midi, chord.time + b * beat, beat * 0.9, b === 0 ? 0.8 : 0.68))
    } else {
      // Block chords: on the half-bar, held, with a lighter one on the off-beat.
      tones.forEach((midi, n) => put(midi, chord.time, beat * 1.9, n === 0 ? 0.8 : 0.7))
      tones.slice(1).forEach((midi) => put(midi, chord.time + beat * 1.5, beat * 0.45, 0.45))
    }
  }
  return events
}

function voicePlan(melody, options, key) {
  const figure = options.figure || "solo"
  const touch = options.touch || "played"
  const bpm = options.bpm || 92
  const beat = options.beat || 60 / bpm
  const low = options.low ?? 48
  const high = options.high ?? 84
  const events = []
  const add = (midi, time, dur, vel) => {
    if (time < 0 || dur <= 0.02) return
    let m = Math.round(midi)
    while (m < low) m += 12
    while (m > high) m -= 12
    events.push({ midi: m, time, dur, vel })
  }
  const hits = (note) => {
    if (touch !== "beat") return [{ time: note.time, dur: note.dur }]
    const out = []
    let time = Math.ceil(note.time / beat - 0.25) * beat
    if (time > note.time + beat * 0.25) time = note.time
    for (; time < note.time + note.dur - 0.03; time += beat) out.push({ time, dur: Math.min(beat * 0.9, note.time + note.dur - time) })
    return out.length ? out : [{ time: note.time, dur: note.dur }]
  }
  if (figure === "bass" && options.harmony) {
    const total = options.total
    for (const chord of options.harmony) {
      let root = low + ((chord.root - low) % 12 + 12) % 12
      if (root > low + 9) root -= 12
      if (root < low) root += 12
      const times = touch === "held" ? [0] : touch === "beat" ? [0, 1] : [0, 1.5]
      for (const b of times) {
        let t = chord.time + b * beat
        if (t < 0 && options.loop) t += total
        if (t >= 0 && t < total - 0.03) add(root, t, Math.min(touch === "held" ? chord.dur * 0.95 : beat * (b ? 0.45 : 1.4), total - t), b ? 0.75 : 0.95)
      }
    }
    return events
  }
  if (figure === "chords" && options.harmony) return accompany(options.harmony, { ...options, low: Math.max(low, 40), high, withBass: options.style === "held" && options.organ })
  if (figure === "section" && options.harmony && options.style === "held") {
    // A choir or string section: held, voice-led chords, a little higher.
    return accompany(options.harmony, { ...options, style: "held", low: Math.max(low, 48), high, center: Math.min(high - 5, 67) })
  }
  if (figure === "bass") {
    // A bass line: the root under each bar, on beats 1 and 3, with the
    // melody's lowest pull deciding the root.
    const bar = beat * 4
    const total = options.total
    for (let start = 0; start < total - 0.05; start += bar) {
      const inside = melody.filter((note) => note.time < start + bar && note.time + note.dur > start)
      if (!inside.length) continue
      const weight = new Map()
      for (const note of inside) {
        const pc = ((note.midi % 12) + 12) % 12
        weight.set(pc, (weight.get(pc) || 0) + Math.min(note.dur, bar))
      }
      const first = inside[0]
      const pc = [...weight.entries()].sort((a, b) => b[1] - a[1] || (a[0] === ((first.midi % 12) + 12) % 12 ? -1 : 1))[0][0]
      let root = low + ((pc - low) % 12 + 12) % 12
      if (root > low + 9) root -= 12
      if (root < low) root += 12
      const half = touch === "held" ? [0] : [0, 2]
      for (const b of half) {
        const t = start + b * beat
        if (t < total - 0.05) add(root, t, Math.min(touch === "held" ? bar * 0.95 : beat * 1.8, total - t), 0.9)
      }
    }
    return events
  }
  for (const note of melody) {
    let tones = [note.midi]
    if (note.tones) tones = note.tones.map((step) => note.midi + step)
    else if (figure === "chords" || note.chord) tones = chordTones(note.midi, key, Math.max(low, 48))
    if (figure === "section") tones = [note.midi, scaleStep(note.midi, -2, key), scaleStep(note.midi, -4, key)]
    for (const hit of hits(note)) {
      tones.forEach((midi, i) => {
        const strum = touch === "strum" ? i * 0.028 : 0
        add(midi, hit.time + strum, Math.max(0.08, hit.dur - strum), i === 0 ? 0.9 : 0.72)
      })
    }
  }
  return events
}

// Hits from a clap, tap, or beatbox take, named by how they sound: a low
// thump is a kick, a short bright tick is a hat, and the rest is a snare.
function drumHits(samples, bpm, snap) {
  const times = mergeTimes([detectOnsets(samples), detectPulses(samples)])
  const look = Math.floor(SR * 0.04)
  const lowAlpha = (2 * Math.PI * 150) / SR
  const found = times.map((time) => {
    const start = Math.floor(time * SR)
    let low = 0
    let all = 0
    let y = 0
    let crossings = 0
    let peak = 0
    for (let i = 0; i < look && start + i < samples.length; i++) {
      const x = samples[start + i]
      y += lowAlpha * (x - y)
      low += y * y
      all += x * x
      peak = Math.max(peak, Math.abs(x))
      if (i && (samples[start + i - 1] >= 0) !== (x >= 0)) crossings++
    }
    const lowShare = all ? low / all : 0
    const zcr = crossings / look
    const kind = lowShare > 0.32 ? "kick" : zcr > 0.28 && lowShare < 0.06 ? "hat" : "snare"
    return { time, kind, vel: Math.min(1, 0.45 + peak * 1.2) }
  })
  const kinds = new Set(found.map((hit) => hit.kind))
  const beat = 60 / bpm
  if (kinds.size === 1 && found.length >= 2) {
    // Every hit sounds alike (claps): kick on 1 and 3, snare on 2 and 4.
    for (const hit of found) {
      const place = ((Math.round(hit.time / beat) % 4) + 4) % 4
      hit.kind = place === 0 || place === 2 ? "kick" : "snare"
    }
  }
  if (snap) {
    const step = beat / 4
    const seen = new Set()
    return found.filter((hit) => {
      hit.time = Math.max(0, Math.round(hit.time / step) * step)
      const key = `${hit.kind}@${hit.time.toFixed(4)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  return found
}

// Where the beats of a performance really are. Singing without an audible
// click drifts a little ahead of or behind the grid, and sometimes a touch
// faster or slower. This finds the beat length (a whole number of beats per
// pass, so a loop still loops) and the offset that best fits the notes.
function performanceGrid(audio, pass, bpm) {
  const notes = joinShortGaps(detectNotesOnce(audio))
  const onsets = mergeTimes([detectOnsets(audio), notes.map((note) => note.time)]).filter((t) => t < pass)
  const weight = new Map()
  for (const note of notes) weight.set(Math.round(note.time * 100), Math.min(1.5, 0.5 + note.dur))
  const nominal = Math.max(1, Math.round(pass / (60 / bpm)))
  let best = { beats: nominal, phase: 0, score: -Infinity }
  for (let beats = Math.max(1, nominal - 2); beats <= nominal + 2; beats++) {
    const beat = pass / beats
    for (let phase = -beat / 2; phase < beat / 2; phase += 0.005) {
      let score = 0
      for (const t of onsets) {
        const half = beat / 2
        const d = Math.abs(((t - phase) / half) - Math.round((t - phase) / half)) * half
        const onBeat = Math.round((t - phase) / half) % 2 === 0
        score += Math.exp(-((d / 0.035) ** 2)) * (onBeat ? 1 : 0.5) * (weight.get(Math.round(t * 100)) || 0.7)
      }
      // Stay with the set tempo and no offset unless the singing clearly says otherwise.
      score -= Math.abs(beats - nominal) * 0.9 + Math.abs(phase) * 6
      if (score > best.score) best = { beats, phase, score }
    }
  }
  return { beat: pass / best.beats, beats: best.beats, phase: best.phase, onsets, notes }
}

// A groove that fits your song: snare on 2 and 4, a kick on 1, and more kicks
// under the notes you lean on, with hi-hats on the eighths. All of it on
// your performance's own beat, wrapped so the loop stays seamless.
function grooveFor(audio, pass, bpm) {
  const grid = performanceGrid(audio, pass, bpm)
  const { beat, beats, phase } = grid
  const at = (t) => ((t % pass) + pass) % pass
  const hits = []
  for (let i = 0; i < beats; i++) {
    const t = phase + i * beat
    const place = i % 4
    if (place === 0) hits.push({ time: at(t), kind: "kick", vel: 0.95 })
    if (place === 1 || place === 3) hits.push({ time: at(t), kind: "snare", vel: 0.85 })
    hits.push({ time: at(t), kind: "hat", vel: 0.58 })
    hits.push({ time: at(t + beat / 2), kind: "hat", vel: 0.4 })
  }
  // Kicks under strong notes that start on a beat or an off-beat eighth.
  const strong = grid.notes.filter((note) => note.dur >= beat * 0.45)
  const perBar = new Map()
  for (const note of strong) {
    const pos = (note.time - phase) / (beat / 2)
    const slot = Math.round(pos)
    if (Math.abs(pos - slot) > 0.3) continue
    const beatIndex = Math.floor(slot / 2)
    const place = ((beatIndex % 4) + 4) % 4
    if (slot % 2 === 0 && (place === 1 || place === 3)) continue
    if (slot % 2 === 0 && place === 0) continue
    const bar = Math.floor(beatIndex / 4)
    if ((perBar.get(bar) || 0) >= 2) continue
    perBar.set(bar, (perBar.get(bar) || 0) + 1)
    hits.push({ time: at(phase + slot * (beat / 2)), kind: "kick", vel: 0.8 })
  }
  hits.sort((a, b) => a.time - b.time)
  return { hits, beat, beats, phase }
}

function planPerformance(samples, sampleRate, options = {}) {
  const rate = sampleRate || SR
  let source = samples
  let loop = false
  const loopSamples = Math.round(options.loopSamples || 0)
  if (loopSamples && isLooped(samples, loopSamples)) {
    source = samples.subarray(0, loopSamples)
    loop = true
  }
  const audio = toEngineRate(source, rate)
  const pass = audio.length / SR
  const total = samples.length / rate
  const bpm = options.bpm || 92
  const snap = options.snap !== false
  if (options.mode === "groove") {
    const groove = grooveFor(audio, pass, bpm)
    let hits = groove.hits
    if (options.single) hits = hits.filter((hit) => hit.kind !== "hat").map((hit) => ({ ...hit, kind: options.single }))
    if (!loop) {
      // A take that isn't a loop: repeat its groove for the whole take.
      const all = []
      for (let start = 0; start < total - 0.01; start += pass) for (const hit of hits) if (start + hit.time < total) all.push({ ...hit, time: start + hit.time })
      hits = all
    }
    return { hits, pass, total, loop, grid: { beat: groove.beat, beats: groove.beats, phase: groove.phase } }
  }
  if (options.mode === "drums") {
    let hits = drumHits(audio, bpm, snap)
    if (options.single) hits = hits.map((hit) => ({ ...hit, kind: options.single }))
    else if (options.fill !== false && hits.length >= 2) {
      // A full kit keeps time with a hi-hat on every eighth note.
      const beat = 60 / bpm
      const last = Math.max(...hits.map((hit) => hit.time))
      const end = loop ? pass : Math.min(pass, last + beat)
      for (let t = 0; t < end - 0.01; t += beat / 2) {
        if (!hits.some((hit) => hit.kind === "hat" && Math.abs(hit.time - t) < 0.02)) hits.push({ time: t, kind: "hat", vel: (Math.round(t / (beat / 2)) % 2 ? 0.45 : 0.6) })
      }
      if (!loop || options.crash) hits.push({ time: 0, kind: "crash", vel: 0.55 })
    }
    hits.sort((a, b) => a.time - b.time)
    return { hits, pass, total, loop }
  }
  const heard = notesHeard(audio, pass, bpm, { ...options, snap })
  if (!heard.melody.length) return { error: "no-notes", pass, total, loop }
  return planFromNotes(heard.melody, { ...options, key: heard.key, pass, total, loop, beat: heard.beat, phase: heard.phase })
}

// The notes in a take, on its own beat and in its key, before any
// instrument plays them. Each note keeps the pitch that was really heard,
// so changing the key later can fit the notes again from what was sung.
function notesHeard(audio, pass, bpm, options = {}) {
  let melody = joinShortGaps(detectNotesOnce(audio)).map((note) => ({ ...note, heard: Math.round(note.midi) }))
  if (!melody.length) return { melody, key: { root: 0, minor: false }, beat: 60 / bpm, phase: 0 }
  const key = keyOf(melody)
  if (options.inKey !== false) melody = melody.map((note) => ({ ...note, midi: inKey(Math.round(note.midi), key) }))
  // Parts follow the singer's own beat, so they sit with the take.
  const grid = performanceGrid(audio, pass, bpm)
  if (options.snap !== false) melody = snapTimes(melody, bpm, pass, options.grid || 2, grid.beat, grid.phase)
  return { melody, key: { root: key.root, minor: key.minor }, beat: grid.beat, phase: grid.phase }
}

// For the note check: what Songbird heard in a take, to show and fix.
function readNotes(samples, sampleRate, options = {}) {
  const rate = sampleRate || SR
  let source = samples
  let loop = false
  const loopSamples = Math.round(options.loopSamples || 0)
  if (loopSamples && isLooped(samples, loopSamples)) {
    source = samples.subarray(0, loopSamples)
    loop = true
  }
  const audio = toEngineRate(source, rate)
  const pass = audio.length / SR
  const total = samples.length / rate
  const heard = notesHeard(audio, pass, options.bpm || 92, options)
  return { ...heard, pass, total, loop }
}

function keyFrom(key) {
  const root = (((key && key.root) || 0) % 12 + 12) % 12
  const minor = !!(key && key.minor)
  return { root, minor, scale: minor ? MINOR : MAJOR }
}

// A part from notes you checked, or played on the keys: no listening
// needed. options: key, pass, total, loop, beat, phase, plus how it plays.
function planFromNotes(notes, options = {}) {
  const pass = options.pass || 1
  const total = options.total || pass
  const loop = !!options.loop
  const beat = options.beat || 60 / (options.bpm || 92)
  const phase = options.phase || 0
  const key = keyFrom(options.key)
  let melody = (notes || []).filter((note) => note.time < pass - 0.01 && note.dur > 0).map((note) => ({ ...note }))
  if (!melody.length) return { error: "no-notes", pass, total, loop }
  melody.sort((a, b) => a.time - b.time)
  if (options.transpose) melody = melody.map((note) => ({ ...note, midi: note.midi + options.transpose }))
  const shifted = options.transpose ? { ...key, root: (key.root + options.transpose + 120) % 12 } : key
  if (options.figure !== "bass") melody = fitRange(melody, options.low, options.high)
  const heldSection = options.figure === "section" && options.style === "held"
  const harmony = options.figure === "chords" || options.figure === "bass" || heldSection ? harmonize(melody, shifted, beat, phase, pass, { steady: options.style === "held" }) : null
  const events = voicePlan(melody, { ...options, total: pass, beat, phase, harmony, loop }, shifted)
  return { events, key: shifted, pass, total, loop, melody, harmony, grid: { beat, phase } }
}

// Snap played taps to the beat: notes and chords to eighths, drum hits to
// sixteenths. A loop wraps what spills past its end back to the top.
function snapPlayed(items, options = {}) {
  const beat = options.beat || 60 / (options.bpm || 92)
  const step = beat / (options.grid || 2)
  const pass = options.pass || Infinity
  const out = []
  const seen = new Set()
  for (const item of items) {
    let time = Math.max(0, Math.round(item.time / step) * step)
    if (time >= pass - 1e-6) {
      if (!options.loop) continue
      time -= pass
    }
    const id = `${item.kind || item.midi}@${time.toFixed(4)}`
    if (seen.has(id)) continue
    seen.add(id)
    const next = { ...item, time }
    if (item.dur != null) next.dur = Math.max(step * 0.9, Math.round(item.dur / step) * step)
    out.push(next)
  }
  return out.sort((a, b) => a.time - b.time)
}

// Pitch shift a recording by a steady number of semitones, keeping its
// length and timing. One pass of a loop is shifted and looped again.
function shiftPitch(samples, sampleRate, semitones, loopSamples) {
  if (loopSamples) {
    const looped = onEachLoop(samples, sampleRate, loopSamples, SR, (pass) => shiftPitch(pass, sampleRate, semitones, 0))
    if (looped) return looped
  }
  const src = toEngineRate(samples, sampleRate)
  const ratio = 2 ** (semitones / 12)
  if (Math.abs(ratio - 1) < 1e-4) return src
  // Stretch the sound longer by the ratio, keeping its pitch (WSOLA), then
  // play it back faster by the same ratio: same length, new pitch.
  const long = wsolaStretch(src, ratio)
  const out = new Float32Array(src.length)
  for (let i = 0; i < out.length; i++) {
    const pos = i * ratio
    const index = Math.floor(pos)
    if (index + 1 >= long.length) break
    const frac = pos - index
    out[i] = long[index] * (1 - frac) + long[index + 1] * frac
  }
  return out
}

// Waveform-similarity overlap-add: lengthens or shortens a sound without
// changing its pitch, lining each grain up with the last so it stays smooth.
function wsolaStretch(src, factor) {
  const win = 1024
  const hopOut = win / 2
  const hopIn = hopOut / factor
  const tol = 256
  const length = Math.ceil(src.length * factor) + win
  const out = new Float32Array(length)
  const norm = new Float32Array(length)
  const window = new Float32Array(win)
  for (let i = 0; i < win; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / win)
  let prev = 0
  for (let k = 0; ; k++) {
    const outPos = k * hopOut
    const ideal = Math.round(k * hopIn)
    if (ideal + win + tol >= src.length || outPos + win >= length) break
    let pick = ideal
    if (k > 0) {
      // The grain that best continues what came out last.
      const want = prev + hopOut
      let best = -Infinity
      for (let d = -tol; d <= tol; d += 2) {
        const cand = ideal + d
        if (cand < 0 || cand + win >= src.length) continue
        let corr = 0
        for (let i = 0; i < win; i += 4) corr += src[want + i] * src[cand + i]
        if (corr > best) {
          best = corr
          pick = cand
        }
      }
    }
    for (let i = 0; i < win; i++) {
      out[outPos + i] += src[pick + i] * window[i]
      norm[outPos + i] += window[i]
    }
    prev = pick
  }
  for (let i = 0; i < length; i++) out[i] = norm[i] > 0.1 ? out[i] / norm[i] : out[i]
  return out
}

// Change the tempo: a factor above 1 is slower (longer). Pitch stays.
function timeStretch(samples, sampleRate, factor, loopSamples) {
  const src = toEngineRate(samples, sampleRate)
  const fit = (made, length) => {
    const out = new Float32Array(length)
    out.set(made.subarray(0, Math.min(length, made.length)))
    return out
  }
  const pass = loopSamples ? Math.round((loopSamples * SR) / sampleRate) : 0
  if (pass && isLooped(src, pass)) {
    const onePass = fit(wsolaStretch(src.subarray(0, pass), factor), Math.round(pass * factor))
    const total = Math.round(src.length * factor)
    const out = new Float32Array(total)
    for (let at = 0; at < total; at += onePass.length) out.set(onePass.length <= total - at ? onePass : onePass.subarray(0, total - at), at)
    return { samples: out, loopSamples: onePass.length }
  }
  return { samples: fit(wsolaStretch(src, factor), Math.round(src.length * factor)), loopSamples: 0 }
}

globalThis.SongbirdMusic = {
  makeExample,
  transformAudio,
  transformSteps,
  patternHits,
  tempoFromAudio,
  tempoFromTimes,
  sampleRate: SR,
  detectNotes,
  detectOnsets,
  coverage,
  fillWithSection,
  tuneVoice,
  starterAudio,
  fixTiming,
  inputMakeup,
  enhanceAudio,
  planPerformance,
  planFromNotes,
  readNotes,
  snapPlayed,
  keyFrom,
  inKey: (midi, key) => inKey(midi, keyFrom(key)),
  chordTones: (midi, key, low) => chordTones(midi, keyFrom(key), low),
  scaleStep: (midi, steps, key) => scaleStep(midi, steps, keyFrom(key)),
  shiftPitch,
  timeStretch,
  keyOf,
}
