// Songbird sampler: plays a performance plan through recorded instruments.
// Samples are from the FluidR3 GM soundfont by Frank Wen (MIT license),
// rendered to short MP3 notes in sounds/. Each instrument loads the first
// time it is used, and rendering runs in an OfflineAudioContext, which the
// browser does off the page's main thread.
;(function () {
  const RATE = 44100
  let index = null
  const loaded = new Map()
  const BUILD = (() => {
    try { return new URL(document.currentScript.src).search } catch { return "" }
  })()

  // Phones drop requests now and then, and too many at once can choke them,
  // so files load a few at a time and a failed one is tried again.
  let active = 0
  const waiting = []
  function slot() {
    if (active < 6) {
      active++
      return Promise.resolve()
    }
    return new Promise((resolve) => waiting.push(resolve))
  }
  function release() {
    const next = waiting.shift()
    if (next) next()
    else active--
  }
  async function fetchRetry(url, kind) {
    let last
    for (let attempt = 0; attempt < 3; attempt++) {
      await slot()
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`sounds missing ${url}`)
        return kind === "json" ? await res.json() : await res.arrayBuffer()
      } catch (error) {
        last = error
      } finally {
        release()
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)))
    }
    throw last
  }

  function decode(ctx, data) {
    return new Promise((resolve, reject) => {
      const done = ctx.decodeAudioData(data, resolve, reject)
      if (done && done.then) done.then(resolve, reject)
    })
  }

  async function getIndex() {
    if (!index) {
      index = fetchRetry(`sounds/index.json${BUILD}`, "json")
      // A failed list is asked for again next time, not remembered.
      index.catch(() => { index = null })
    }
    return index
  }

  // MP3 decoders add a little silence at the start. Each note starts from
  // its first real sound so it lands exactly on time.
  function firstSound(buffer) {
    const data = buffer.getChannelData(0)
    let peak = 0
    for (let i = 0; i < data.length; i += 16) peak = Math.max(peak, Math.abs(data[i]))
    const floor = Math.max(0.002, peak * 0.01)
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > floor) return Math.max(0, i - 64) / buffer.sampleRate
    }
    return 0
  }

  // How long a note takes to speak: a bow or a breath swells in, where a
  // piano is instant. That much is started early so the note is heard on
  // the beat, not after it.
  function speakTime(buffer, offset) {
    const data = buffer.getChannelData(0)
    const rate = buffer.sampleRate
    const from = Math.floor(offset * rate)
    const look = Math.min(data.length, from + Math.floor(rate * 0.6))
    const block = Math.floor(rate * 0.005)
    let peak = 0
    for (let i = from; i < look; i += 8) peak = Math.max(peak, Math.abs(data[i]))
    for (let at = from; at < look; at += block) {
      let max = 0
      for (let i = at; i < at + block && i < look; i += 2) max = Math.max(max, Math.abs(data[i]))
      if (max >= peak * 0.5) return Math.min(0.12, (at - from) / rate)
    }
    return 0
  }

  // Each sample loads once, the first time a part needs it, and only the
  // samples a part actually plays are fetched.
  function loadOne(url, ctx) {
    if (!loaded.has(url)) {
      const job = fetchRetry(url, "bytes").then((data) => decode(ctx, data).catch((error) => {
        // Decoding can fail on a busy phone. Once more, on a fresh copy.
        return fetchRetry(url, "bytes").then((again) => decode(ctx, again)).catch(() => { throw error })
      })).then((buffer) => {
        const offset = firstSound(buffer)
        return { buffer, offset, speak: speakTime(buffer, offset) }
      })
      loaded.set(url, job)
      job.catch(() => loaded.delete(url))
    }
    return loaded.get(url)
  }

  async function loadSet(names, url, ctx) {
    const pairs = await Promise.all(names.map(async (name) => [name, await loadOne(url(name), ctx)]))
    return new Map(pairs)
  }

  function nearest(list, midi) {
    let near = list[0]
    for (const note of list) if (Math.abs(note - midi) < Math.abs(near - midi)) near = note
    return near
  }

  async function instrument(id, ctx, midis) {
    const info = (await getIndex()).instruments[id]
    if (!info) throw new Error(`unknown instrument ${id}`)
    const wanted = midis ? [...new Set(midis.map((midi) => nearest(info.notes, midi)))] : info.notes
    const notes = await loadSet(wanted, (note) => `sounds/${id}/${note}.mp3`, ctx)
    return { info, notes }
  }

  async function kit(id, ctx, kinds) {
    const names = (await getIndex()).kits[id]
    if (!names) throw new Error(`unknown kit ${id}`)
    const wanted = kinds ? names.filter((name) => kinds.has(name) || (name === "pedal-hat" && kinds.has("hat")) || name === "snare") : names
    return loadSet(wanted, (name) => `sounds/kits/${id}/${name}.mp3`, ctx)
  }

  // The sound of each era, as a record of that time would have it: the
  // band of frequencies it kept, its tone, the tape or groove it went
  // through, its echo and room, and wobble, crackle and hiss on the oldest.
  const ERA = {
    "1900": { low: 550, high: 2800, lowShelf: -3, highShelf: -8, drive: 0.6, verb: 0.3, verbLen: 1.1, wow: 0.0045, wowRate: 0.55, crackle: 0.06, hiss: 0.025 },
    "1920": { low: 320, high: 4200, lowShelf: -2, highShelf: -6, drive: 0.45, verb: 0.32, verbLen: 1.5, wow: 0.0028, wowRate: 0.7, crackle: 0.035, hiss: 0.014 },
    "1950": { low: 150, high: 6500, lowShelf: 1, highShelf: -3, drive: 0.35, slap: 0.125, slapMix: 0.38, verb: 0.12, verbLen: 1.0, hiss: 0.006 },
    "1960": { low: 100, high: 9000, lowShelf: 2, highShelf: -2.5, drive: 0.28, verb: 0.34, verbLen: 2.4, hiss: 0.004 },
    "1970": { low: 55, high: 11000, lowShelf: 4.5, highShelf: -4.5, drive: 0.22, verb: 0.2, verbLen: 1.5, chorus: 0.0022, chorusRate: 0.35, wow: 0.0009, wowRate: 0.4 },
    "1980": { low: 70, high: 16000, lowShelf: -1.5, highShelf: 5.5, verb: 0.38, verbLen: 1.9, gated: 0.38, chorus: 0.0045, chorusRate: 0.9 },
    "1990": { low: 40, high: 14000, lowShelf: 3.5, highShelf: -1, drive: 0.18, verb: 0.1, verbLen: 0.8 },
    "2000": { low: 35, high: 18000, lowShelf: 2.5, highShelf: 3.5, drive: 0.3, verb: 0.08, verbLen: 0.7 },
  }

  function noiseBuffer(ctx, seconds, crackle, hiss) {
    const length = Math.ceil(seconds * ctx.sampleRate)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let seed = 7
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1
    let low = 0
    for (let i = 0; i < length; i++) {
      low += (rand() - low) * 0.25
      data[i] = low * hiss
      if (crackle && Math.abs(rand()) > 0.99965) {
        const size = crackle * (0.4 + Math.abs(rand()))
        for (let k = 0; k < 40 && i + k < length; k++) data[i + k] += size * rand() * (1 - k / 40)
      }
    }
    return buffer
  }

  function roomImpulse(ctx, seconds, gated) {
    const length = Math.ceil(seconds * ctx.sampleRate)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let seed = 3
    for (let i = 0; i < length; i++) {
      seed = (seed * 16807) % 2147483647
      const t = i / ctx.sampleRate
      // A gated room (the 1980s snare) stays big, then stops dead.
      const env = gated ? (t < gated ? 0.9 : 0) : Math.pow(1 - i / length, 2.2)
      data[i] = ((seed / 2147483647) * 2 - 1) * env
    }
    return buffer
  }

  function wobble(ctx, input, depth, rate, mix) {
    const delay = ctx.createDelay(0.05)
    delay.delayTime.value = depth * 1.5 + 0.002
    const lfo = ctx.createOscillator()
    lfo.frequency.value = rate
    const amount = ctx.createGain()
    amount.gain.value = depth
    lfo.connect(amount)
    amount.connect(delay.delayTime)
    lfo.start(0)
    const out = ctx.createGain()
    input.connect(delay)
    if (mix < 1) {
      const dry = ctx.createGain()
      dry.gain.value = 1 - mix
      input.connect(dry)
      dry.connect(out)
      const wet = ctx.createGain()
      wet.gain.value = mix
      delay.connect(wet)
      wet.connect(out)
    } else delay.connect(out)
    return out
  }

  function chain(ctx, era) {
    const tone = ERA[era]
    const out = ctx.createGain()
    if (!tone) {
      out.connect(ctx.destination)
      return out
    }
    let node = out
    if (tone.wow) node = wobble(ctx, node, tone.wow, tone.wowRate || 0.5, 1)
    if (tone.chorus) node = wobble(ctx, node, tone.chorus, tone.chorusRate || 0.8, 0.45)
    const filters = [
      ["highpass", tone.low],
      ["lowpass", tone.high],
      ["lowshelf", 220, tone.lowShelf || 0],
      ["highshelf", 5000, tone.highShelf || 0],
    ]
    for (const [type, frequency, gain] of filters) {
      const filter = ctx.createBiquadFilter()
      filter.type = type
      filter.frequency.value = frequency
      if (gain != null) filter.gain.value = gain
      node.connect(filter)
      node = filter
    }
    if (tone.drive) {
      // Tape and valves: loud parts round off and thicken.
      const shaper = ctx.createWaveShaper()
      const curve = new Float32Array(1024)
      const k = 1 + tone.drive * 6
      for (let i = 0; i < curve.length; i++) {
        const x = (i / (curve.length - 1)) * 2 - 1
        curve[i] = Math.tanh(k * x) / Math.tanh(k)
      }
      shaper.curve = curve
      const pre = ctx.createGain()
      pre.gain.value = 0.9
      const post = ctx.createGain()
      post.gain.value = 0.85
      node.connect(pre)
      pre.connect(shaper)
      shaper.connect(post)
      node = post
    }
    const end = ctx.createGain()
    node.connect(end)
    if (tone.slap) {
      const slap = ctx.createDelay(0.5)
      slap.delayTime.value = tone.slap
      const level = ctx.createGain()
      level.gain.value = tone.slapMix || 0.3
      node.connect(slap)
      slap.connect(level)
      level.connect(end)
    }
    if (tone.verb) {
      const room = ctx.createConvolver()
      room.buffer = roomImpulse(ctx, tone.verbLen || 1.2, tone.gated)
      const level = ctx.createGain()
      level.gain.value = tone.verb * 0.18
      node.connect(room)
      room.connect(level)
      level.connect(end)
    }
    end.connect(ctx.destination)
    if (tone.crackle || tone.hiss) {
      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuffer(ctx, ctx.length / ctx.sampleRate, tone.crackle || 0, tone.hiss || 0)
      const band = ctx.createBiquadFilter()
      band.type = "bandpass"
      band.frequency.value = Math.sqrt(tone.low * tone.high)
      band.Q.value = 0.5
      noise.connect(band)
      band.connect(ctx.destination)
      noise.start(0)
    }
    return out
  }

  // Families that keep sounding while a note is held stop with a short fade
  // at the end of the note. Plucked and struck sounds ring out naturally.
  // A recorded note lasts a few seconds. A held chord can last longer, so a
  // sustained sound repeats the steady middle of its note, crossfading each
  // pass into the next, the way a sampler loops a sustain. Other notes play
  // once and fade as they would on the real instrument.
  function sustainNote(ctx, sample, rate, into, begin, stopAt, sustain) {
    const buffer = sample.buffer
    const play = (from, start, stop, fadeIn, fadeOut) => {
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.playbackRate.value = rate
      const level = ctx.createGain()
      if (fadeIn) {
        level.gain.setValueAtTime(0, start)
        level.gain.linearRampToValueAtTime(1, start + fadeIn)
      }
      if (fadeOut) {
        level.gain.setValueAtTime(1, stop - fadeOut)
        level.gain.linearRampToValueAtTime(0, stop)
      }
      source.connect(level)
      level.connect(into)
      source.start(start, from)
      source.stop(stop + 0.01)
    }
    const available = (buffer.duration - sample.offset) / rate
    const loopFrom = sample.offset + Math.min(0.6, (buffer.duration - sample.offset) * 0.25)
    const loopTo = buffer.duration - 0.6
    if (!sustain || stopAt - begin <= available - 0.05 || loopTo - loopFrom < 0.6) {
      play(sample.offset, begin, stopAt, 0, 0)
      return
    }
    const fade = 0.25
    let start = begin
    let from = sample.offset
    let first = true
    for (let guard = 0; start < stopAt && guard < 400; guard++) {
      const length = (loopTo - from) / rate
      const stop = Math.min(start + length, stopAt)
      const last = stop >= stopAt
      play(from, start, stop, first ? 0 : fade, last ? 0 : fade)
      if (last) break
      start = stop - fade
      from = loopFrom
      first = false
    }
  }

  const HELD = new Set(["strings", "horns", "woodwinds", "voices", "synths"])

  // Who plays the notes. Most instruments play them as given. A horn section
  // is real players split by range, the way a band is: trumpets on top (two
  // of them, a hair apart), trombones in the middle with a French horn
  // doubling, and a tuba underneath.
  async function partsFor(id, events) {
    // A choir is many singers: the aahs, a second line a few cents apart and
    // a breath later, and soft oohs underneath, so it breathes like a room
    // full of people instead of one patch.
    if (id === "choir-aahs") {
      return [
        { instrument: "choir-aahs", events },
        { instrument: "choir-aahs", events, cents: 9, delay: 0.022, level: 0.55 },
        { instrument: "voice-oohs", events, cents: -6, delay: 0.011, level: 0.4 },
      ]
    }
    if (id !== "brass-section") return [{ instrument: id, events }]
    const idx = await getIndex()
    if (!idx.instruments.tuba) return [{ instrument: id, events }]
    const top = events.filter((event) => event.midi >= 58)
    const middle = events.filter((event) => event.midi >= 46 && event.midi < 58)
    const low = events.filter((event) => event.midi < 46)
    return [
      { instrument: "trumpet", events: top },
      { instrument: "trumpet", events: top, cents: 7, delay: 0.012, level: 0.7 },
      { instrument: "trombone", events: middle },
      { instrument: "french-horn", events: middle, cents: -5, delay: 0.008, level: 0.5 },
      { instrument: "tuba", events: low },
    ].filter((part) => part.events.length)
  }

  // Short notes on an instrument with recorded short notes (trumpet,
  // trombone, tuba, horn) use those, so stabs are punchy, not cut-off
  // long notes.
  // A plucked or struck note (piano, guitar, harp, vibraphone, bells) is
  // mixed straight into the part's buffer: its sample, at its pitch, with
  // the same rise and release a node would give it. Held notes still use
  // nodes, for their looping sustain.
  function mixNote(mix, sample, rate, level, begin, end, attack, release) {
    const data = sample.buffer.getChannelData(0)
    const step = (rate * sample.buffer.sampleRate) / RATE
    const first = Math.round(begin * RATE)
    const hold = Math.round(end * RATE)
    const last = Math.min(mix.length, Math.round((end + release) * RATE))
    const rise = Math.max(1, Math.round(attack * RATE))
    const fall = Math.max(1, last - hold)
    let pos = sample.offset * sample.buffer.sampleRate
    for (let i = first; i < last && pos < data.length - 1; i++, pos += step) {
      const j = pos | 0
      const value = data[j] + (data[j + 1] - data[j]) * (pos - j)
      let g = level
      if (i - first < rise) g *= (i - first) / rise
      if (i >= hold) g *= Math.max(0, 1 - (i - hold) / fall)
      mix[i] += value * g
    }
  }

  async function playPart(ctx, out, part, options, seconds, mix) {
    const idx = await getIndex()
    const decodeWith = options.decodeWith || ctx
    const shortId = idx.instruments[`${part.instrument}-stac`] ? `${part.instrument}-stac` : null
    const isShort = (event) => shortId && event.dur < 0.42
    const longEvents = part.events.filter((event) => !isShort(event))
    const shortEvents = part.events.filter(isShort)
    const sets = []
    if (longEvents.length) sets.push({ events: longEvents, ...(await instrument(part.instrument, decodeWith, longEvents.map((event) => event.midi))) })
    if (shortEvents.length) sets.push({ events: shortEvents, short: true, ...(await instrument(shortId, decodeWith, shortEvents.map((event) => event.midi))) })
    const real = /VSCO/.test(idx.instruments[part.instrument]?.source || "")
    for (const set of sets) {
      // Harp and pizzicato are plucked: they ring and fade, not hold.
      const held = HELD.has(set.info.family) && !/harp|pizzicato/.test(part.instrument || "")
      // Organs hold their notes too, but start with a key's quick attack.
      const sustained = /organ|pad/.test(part.instrument || "")
      // Real brass keeps the attack it was recorded with.
      const baseAttack = real || set.short ? 0.006 : held ? 0.06 : 0.004
      const list = [...set.notes.keys()]
      for (const event of set.events) {
        if (event.time >= seconds) continue
        let near = list[0]
        for (const note of list) if (Math.abs(note - event.midi) < Math.abs(near - event.midi)) near = note
        const sample = set.notes.get(near)
        if (!sample) continue
        const rate = 2 ** ((event.midi - near) / 12 + (part.cents || 0) / 1200)
        const gain = ctx.createGain()
        const level = (event.vel ?? 0.85) * (options.level ?? 1) * (part.level ?? 1)
        // A note can't start before the song does.
        const at = Math.max(0, event.time + (part.delay || 0))
        const lead = Math.min(sample.speak || 0, at) / rate
        const begin = Math.max(0, at - lead)
        const end = at + Math.max(0.08, event.dur)
        gain.gain.setValueAtTime(0, begin)
        // Held sounds swell in and let go gently, so chords flow into each
        // other instead of clicking off.
        gain.gain.linearRampToValueAtTime(level, begin + (event.attack || baseAttack))
        const release = set.short ? 0.12 : held ? 0.32 : 0.6
        gain.gain.setValueAtTime(level, end)
        gain.gain.linearRampToValueAtTime(0.0001, end + release)
        const sustain = !set.short && (held || sustained)
        if (mix && !sustain) {
          mixNote(mix, sample, rate, level, begin, end, event.attack || baseAttack, release)
          continue
        }
        gain.connect(out)
        sustainNote(ctx, sample, rate, gain, begin, end + release + 0.02, sustain)
      }
    }
  }

  async function render(plan, options) {
    const seconds = Math.max(0.1, options.seconds)
    const tail = 2.5
    const length = Math.ceil((seconds + tail) * RATE)
    const ctx = new OfflineAudioContext(1, length, RATE)
    const out = chain(ctx, options.era)
    if (options.kit || options.single) {
      const sounds = await kit(options.kit || "standard", options.decodeWith || ctx, new Set((plan.hits || []).map((hit) => hit.kind)))
      // Drum hits are mixed straight into one buffer, then played through
      // the era's sound once. One audio node per hit gets slow fast: a
      // shaker on sixteenths over a whole song is over a thousand hits.
      const mix = new Float32Array(length)
      for (const hit of plan.hits || []) {
        const name = sounds.has(hit.kind) ? hit.kind : hit.kind === "hat" ? "pedal-hat" : "snare"
        const sample = sounds.get(name)
        if (!sample || hit.time >= seconds) continue
        const data = sample.buffer.getChannelData(0)
        const step = sample.buffer.sampleRate / RATE
        const level = (hit.vel ?? 0.8) * (name === "hat" || name === "pedal-hat" ? 0.55 : 1)
        const at = Math.round(Math.max(0, hit.time) * RATE)
        let pos = sample.offset * sample.buffer.sampleRate
        for (let i = at; i < length && pos < data.length - 1; i++, pos += step) {
          const j = pos | 0
          const frac = pos - j
          mix[i] += level * (data[j] + (data[j + 1] - data[j]) * frac)
        }
      }
      const buffer = ctx.createBuffer(1, length, RATE)
      buffer.getChannelData(0).set(mix)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(out)
      source.start(0)
    } else {
      const parts = await partsFor(options.instrument, plan.events || [])
      const mix = new Float32Array(length)
      for (const part of parts) await playPart(ctx, out, part, options, seconds, mix)
      const buffer = ctx.createBuffer(1, length, RATE)
      buffer.getChannelData(0).set(mix)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(out)
      source.start(0)
    }
    const rendered = await ctx.startRendering()
    const all = rendered.getChannelData(0)
    const body = new Float32Array(Math.ceil(seconds * RATE))
    body.set(all.subarray(0, body.length))
    if (options.loop) {
      // A loop's ringing tail carries into the start of the next pass, the
      // way it would on a loop pedal, so the seam is seamless.
      const extra = all.subarray(body.length)
      for (let i = 0; i < extra.length && i < body.length; i++) body[i] += extra[i]
    }
    let peak = 0
    for (let i = 0; i < body.length; i += 4) peak = Math.max(peak, Math.abs(body[i]))
    // Every new part comes in at the same level; Mix sets the balance.
    if (peak > 1e-4) for (let i = 0; i < body.length; i++) body[i] *= 0.85 / peak
    return body
  }

  // Live playing, for the keys and pads: load an instrument or kit once,
  // then each tap starts its sample right away.
  const ready = new Map()

  async function warm(ctx, what) {
    const id = what.kit ? `kit:${what.kit}` : `inst:${what.instrument}`
    if (!ready.has(id)) {
      const job = (what.kit ? kit(what.kit, ctx) : instrument(what.instrument, ctx).then((made) => made.notes)).then((sounds) => ({ sounds, family: what.kit ? "drums" : null }))
      ready.set(id, job)
      job.catch(() => ready.delete(id))
    }
    return ready.get(id)
  }

  function startSample(ctx, dest, sample, rate, level, when, held) {
    const source = ctx.createBufferSource()
    source.buffer = sample.buffer
    source.playbackRate.value = rate
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(level, when)
    source.connect(gain)
    gain.connect(dest)
    source.start(when, sample.offset)
    return {
      // Lift the key: the note fades the way a damper stops a string.
      stop(at) {
        const t = Math.max(at || ctx.currentTime, when + 0.05)
        gain.gain.cancelScheduledValues(t)
        gain.gain.setValueAtTime(level, t)
        gain.gain.linearRampToValueAtTime(0.0001, t + (held ? 0.2 : 0.35))
        try { source.stop(t + 0.4) } catch { /* already stopped */ }
      },
    }
  }

  async function playNote(ctx, dest, instrumentId, midi, vel = 0.85, when = 0) {
    const { sounds } = await warm(ctx, { instrument: instrumentId })
    const list = [...sounds.keys()]
    const near = nearest(list, midi)
    const sample = sounds.get(near)
    if (!sample) return null
    return startSample(ctx, dest, sample, 2 ** ((midi - near) / 12), vel * 0.8, Math.max(when, ctx.currentTime), false)
  }

  async function playHit(ctx, dest, kitId, kind, vel = 0.9, when = 0) {
    const { sounds } = await warm(ctx, { kit: kitId })
    const sample = sounds.get(kind) || sounds.get(kind === "hat" ? "pedal-hat" : "snare")
    if (!sample) return null
    const level = vel * (kind === "hat" || kind === "pedal-hat" ? 0.55 : 0.9)
    return startSample(ctx, dest, sample, 1, level, Math.max(when, ctx.currentTime), false)
  }

  globalThis.SongbirdSampler = { RATE, getIndex, render, warm, playNote, playHit }
})()
