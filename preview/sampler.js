// Songbird sampler: plays a performance plan through recorded instruments.
// Samples are from the FluidR3 GM soundfont by Frank Wen (MIT license),
// rendered to short MP3 notes in sounds/. Each instrument loads the first
// time it is used, and rendering runs in an OfflineAudioContext, which the
// browser does off the page's main thread.
;(function () {
  const RATE = 44100
  let index = null
  const loaded = new Map()

  function decode(ctx, data) {
    return new Promise((resolve, reject) => {
      const done = ctx.decodeAudioData(data, resolve, reject)
      if (done && done.then) done.then(resolve, reject)
    })
  }

  async function getIndex() {
    if (!index) index = fetch("sounds/index.json").then((res) => {
      if (!res.ok) throw new Error("sounds missing")
      return res.json()
    })
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

  // Each sample loads once, the first time a part needs it, and only the
  // samples a part actually plays are fetched.
  function loadOne(url, ctx) {
    if (!loaded.has(url)) {
      const job = fetch(url).then((res) => {
        if (!res.ok) throw new Error(`missing ${url}`)
        return res.arrayBuffer()
      }).then((data) => decode(ctx, data)).then((buffer) => ({ buffer, offset: firstSound(buffer) }))
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

  // A sound of the era: older records are darker and narrower.
  const ERA = {
    "1900": { low: 400, high: 3200 },
    "1920": { low: 220, high: 4500 },
    "1950": { low: 120, high: 7000 },
    "1960": { low: 90, high: 9000 },
    "1970": { low: 60, high: 12000 },
    "1980": { low: 50, high: 16000 },
  }

  function chain(ctx, era) {
    const out = ctx.createGain()
    let head = out
    const tone = ERA[era]
    if (tone) {
      const hp = ctx.createBiquadFilter()
      hp.type = "highpass"
      hp.frequency.value = tone.low
      const lp = ctx.createBiquadFilter()
      lp.type = "lowpass"
      lp.frequency.value = tone.high
      out.connect(hp)
      hp.connect(lp)
      lp.connect(ctx.destination)
    } else out.connect(ctx.destination)
    return head
  }

  // Families that keep sounding while a note is held stop with a short fade
  // at the end of the note. Plucked and struck sounds ring out naturally.
  const HELD = new Set(["strings", "horns", "woodwinds", "voices", "synths"])

  async function render(plan, options) {
    const seconds = Math.max(0.1, options.seconds)
    const tail = 2.5
    const length = Math.ceil((seconds + tail) * RATE)
    const ctx = new OfflineAudioContext(1, length, RATE)
    const out = chain(ctx, options.era)
    if (options.kit || options.single) {
      const sounds = await kit(options.kit || "standard", options.decodeWith || ctx, new Set((plan.hits || []).map((hit) => hit.kind)))
      for (const hit of plan.hits || []) {
        const name = sounds.has(hit.kind) ? hit.kind : hit.kind === "hat" ? "pedal-hat" : "snare"
        const sample = sounds.get(name)
        if (!sample || hit.time >= seconds) continue
        const source = ctx.createBufferSource()
        source.buffer = sample.buffer
        const gain = ctx.createGain()
        gain.gain.value = (hit.vel ?? 0.8) * (name === "hat" || name === "pedal-hat" ? 0.55 : 1)
        source.connect(gain)
        gain.connect(out)
        source.start(hit.time, sample.offset)
      }
    } else {
      const { info, notes } = await instrument(options.instrument, options.decodeWith || ctx, (plan.events || []).map((event) => event.midi))
      const held = HELD.has(info.family)
      const list = [...notes.keys()]
      for (const event of plan.events || []) {
        if (event.time >= seconds) continue
        let near = list[0]
        for (const note of list) if (Math.abs(note - event.midi) < Math.abs(near - event.midi)) near = note
        const sample = notes.get(near)
        if (!sample) continue
        const source = ctx.createBufferSource()
        source.buffer = sample.buffer
        source.playbackRate.value = 2 ** ((event.midi - near) / 12)
        const gain = ctx.createGain()
        const level = (event.vel ?? 0.85) * (options.level ?? 1)
        const end = event.time + Math.max(0.08, event.dur)
        gain.gain.setValueAtTime(0, event.time)
        gain.gain.linearRampToValueAtTime(level, event.time + (held ? 0.03 : 0.004))
        const release = held ? 0.18 : 0.6
        gain.gain.setValueAtTime(level, end)
        gain.gain.linearRampToValueAtTime(0.0001, end + release)
        source.connect(gain)
        gain.connect(out)
        source.start(event.time, sample.offset)
        source.stop(end + release + 0.02)
      }
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

  globalThis.SongbirdSampler = { RATE, getIndex, render }
})()
