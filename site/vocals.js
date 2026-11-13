// Your vocal, made to sit in the song. Songbird listens to what you sang
// (your key, your range, your lines, how you slide into notes, where your
// lines land against the beat) and suggests what fits: lines slid into
// place, a studio sound, room in the music, and background singers picked
// for your voice. Each step is one Undo; Do it all is one too.

// Background singers. Real recorded voices (the choir sounds) sing with
// you; only the double is made from your own voice.
const SINGER_MIX = {
  doubleL: { name: "Double (left)", gain: 0.42, pan: -0.45 },
  doubleR: { name: "Double (right)", gain: 0.42, pan: 0.45 },
  oohs: { name: "Oohs behind you", gain: 0.5, pan: 0 },
  answers: { name: "Choir answers", gain: 0.55, pan: 0.15 },
  third: { name: "Harmony (third up)", gain: 0.5, pan: 0.35 },
  low: { name: "Low harmony", gain: 0.5, pan: -0.3 },
  high: { name: "High voices", gain: 0.36, pan: 0.25 },
}

const SINGER_IDEAS = {
  soul: { name: "Soul oohs", kinds: ["oohs", "doubleL", "doubleR"], line: "Soft oohs hold the chords under you, and your voice is doubled left and right. Warm, like a soul record." },
  gospel: { name: "Choir answers", kinds: ["answers", "oohs"], line: "A choir answers in the spaces between your lines, call and response." },
  harmony: { name: "Harmony singers", kinds: ["third", "low"], line: "Real choir voices sing along with your melody: one a third above you, and a lower harmony under you." },
  doubles: { name: "Just you, doubled", kinds: ["doubleL", "doubleR"], line: "Two more of you, left and right. The most natural, and best for quick lines." },
}

const vocal = { layerId: null, working: "", said: "", where: null, tight: false, idea: null, study: null, studyFor: null }

function vocalTakes() {
  return state.layers.filter((layer) => isRecording(layer) && !layer.singer && kindOf(layer) === "vocals" && buffers.get(layer.id + ":audio"))
}

function leadVocal() {
  const takes = vocalTakes()
  return takes.find((layer) => layer.id === vocal.layerId) || takes.find((layer) => layer.id === state.selected) || takes.find((layer) => layer.lead) || takes[0] || null
}

function singersOf(lead) {
  return state.layers.filter((layer) => layer.singer && layer.sourceId === lead.id)
}

function chorusSections() {
  const total = state.lengthSec || 0
  if (!state.sections?.length || !total) return []
  return state.sections.map((section) => ({ name: section.name, start: section.start * total, end: section.end * total })).filter((section) => CHORUS.test(section.name))
}

// Gaps that keep a singer to the choruses.
function chorusGaps() {
  const total = state.lengthSec || spanSeconds()
  const on = chorusSections()
  if (!on.length) return []
  const gaps = []
  let at = 0
  for (const section of on) {
    if (section.start > at + 0.01) gaps.push({ start: at, end: section.start })
    at = section.end
  }
  if (at < total - 0.01) gaps.push({ start: at, end: total })
  return gaps
}

function vocalSay(text) {
  vocal.said = text
  const node = $("vocal-note")
  if (node) node.textContent = text
}

async function vocalStep(label, run) {
  if (vocal.working || state.transforming) return { text: "Still working on the last one." }
  vocal.working = label
  state.transforming = true
  vocalSay(label)
  renderInspector()
  try {
    return await run()
  } catch (error) {
    console.error("Vocal step failed:", error)
    return { text: "That didn't work. Nothing changed.", warn: true }
  } finally {
    vocal.working = ""
    state.transforming = false
  }
}

// One pass of a looped take, or the whole take.
function takeAudio(layer, kind = "audio") {
  const audio = buffers.get(`${layer.id}:${kind}`) || buffers.get(layer.id + ":audio")
  const loop = audio.loopSamples || 0
  const all = samplesOf(audio)
  return { audio, rate: audio.sampleRate, loop, pass: loop ? all.slice(0, loop) : all, length: all.length }
}

function keepOriginal(layer) {
  if (!buffers.get(layer.id + ":original")) buffers.set(layer.id + ":original", buffers.get(layer.id + ":audio"))
}

function capital(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : text
}

// ---------------------------------------------------------------------------
// Listening

async function studyVocal(layer) {
  const audio = buffers.get(layer.id + ":audio")
  if (vocal.studyFor === audio && vocal.study) return vocal.study
  const { pass, rate } = takeAudio(layer)
  const study = await engine.call("vocalStudy", pass, rate, { bpm: state.bpm || 92, start: layer.range?.start || 0 })
  vocal.study = study
  vocal.studyFor = audio
  return study
}

function vocalStyle(study) {
  if (!study?.lines) return "plain"
  if (study.notesPerSec > 3.2) return "quick"
  if (study.slides >= 0.25 || study.lineSec >= 3.2) return "soul"
  return "plain"
}

function ideaOrder(study) {
  const style = vocalStyle(study)
  if (style === "soul") return ["soul", "gospel", "harmony", "doubles"]
  if (style === "quick") return ["doubles", "soul", "harmony", "gospel"]
  return ["harmony", "soul", "doubles", "gospel"]
}

function heardLine(study) {
  if (!study?.lines) return "I couldn't hear clear singing in this take yet."
  const named = (midi) => `${noteName(midi)}${Math.floor(midi / 12) - 1}`
  const range = study.low != null ? ` from ${named(study.low)} up to ${named(study.high)}` : ""
  const style = vocalStyle(study)
  const feel = style === "soul" ? ", with long lines that slide into notes, like a soul singer" : style === "quick" ? ", with quick runs of notes" : ""
  const off = study.off * 4
  const timing = study.off > 0.12
    ? ` Your lines start about ${off > 1.4 ? "half a beat" : "a quarter beat"} ${study.late > 0 ? "late" : "early"}, so sliding them into place will help.`
    : " Your lines already land close to the beat."
  return `You sing in ${keyName(study.key)}${range}, in ${study.lines} ${study.lines === 1 ? "line" : "lines"}${feel}.${timing}`
}

// ---------------------------------------------------------------------------
// Timing: each line slides, whole, to where it fits the beat

async function fitVocal(layer, tight = vocal.tight) {
  return vocalStep("Sliding your lines into place…", async () => {
    // From the take as you sang it, so earlier fixes don't pile up.
    const { rate, loop, pass, length } = takeAudio(layer, "original")
    const start = layer.range?.start || 0
    const aligned = await engine.call("alignPhrases", pass, rate, { bpm: state.bpm || 92, start })
    let samples = aligned.samples
    const moved = aligned.moves.filter((move) => Math.abs(move.shift) >= 0.025)
    let nudged = 0
    if (tight) {
      const fixed = await engine.call("fixTiming", [{ id: "take", samples, sampleRate: rate, start }], { bpm: state.bpm || 92, slack: 0.22, strength: 0.5 })
      if (fixed?.[0]?.samples) {
        samples = fixed[0].samples
        nudged = fixed[0].moved || 0
      }
    }
    if (!moved.length && !nudged) return { text: `Your lines in ${layer.name} already land where they fit.` }
    if (layer.shine) samples = await engine.call("vocalShine", samples, rate, { amount: 0.7 })
    snapshot([layer.id, ...singersOf(layer).map((item) => item.id)])
    keepOriginal(layer)
    const full = loop ? tileTo(samples, length) : samples
    buffers.set(layer.id + ":audio", loopedBuffer(full, rate, loop))
    layer.peaks = peaksFromSamples(full)
    layer.tight = true
    await followVocal(layer)
    rememberSong()
    renderTracks()
    playFromVocal(layer)
    const typical = moved.length ? Math.round(1000 * moved.map((move) => Math.abs(move.shift)).sort((a, b) => a - b)[Math.floor(moved.length / 2)]) : 0
    const bits = []
    if (moved.length) bits.push(`slid ${moved.length} of your ${aligned.moves.length} lines into place (most by about ${typical} ms), each one whole, so nothing in your singing is stretched`)
    if (nudged) bits.push(`brought ${nudged} ${nudged === 1 ? "word" : "words"} a little closer to the beat`)
    return { text: `${capital(bits.join(", and "))}. Undo puts it back.` }
  })
}

// Parts that follow the vocal (and its background singers) move with it.
async function followVocal(layer) {
  for (const part of state.layers.filter((item) => item.make && item.make.sourceId === layer.id && buffers.get(item.id + ":audio"))) {
    try {
      const made = await buildPart(part.make, layer)
      if (!made.error) {
        buffers.set(part.id + ":audio", loopedBuffer(made.samples, made.rate, made.loopSamples))
        part.peaks = peaksFromSamples(made.samples)
      }
    } catch { /* stays as it was */ }
  }
  const singers = singersOf(layer)
  if (singers.length) {
    vocal.studyFor = null
    for (const singer of singers) {
      const made = await singerAudio(layer, singer.singer).catch(() => null)
      if (made) {
        buffers.set(singer.id + ":audio", made.buffer)
        singer.peaks = made.peaks
        if (made.gaps) singer.gaps = mergeGaps([...(singer.choruses || []), ...made.gaps])
      }
    }
  }
  if (layer.lead) layer.phrases = await phrasesOf(layer)
}

// ---------------------------------------------------------------------------
// Studio sound

async function shineVocal(layer) {
  if (layer.shine) return { text: `${layer.name} already has the studio sound. Undo takes it off.` }
  return vocalStep("Giving your vocal a studio sound…", async () => {
    const { audio, rate, loop } = takeAudio(layer)
    const samples = await engine.call("vocalShine", samplesOf(audio), rate, { amount: 0.7, loopSamples: loop })
    snapshot([layer.id, ...singersOf(layer).map((item) => item.id)])
    keepOriginal(layer)
    buffers.set(layer.id + ":audio", loopedBuffer(samples, rate, loop))
    layer.peaks = peaksFromSamples(samples)
    layer.shine = true
    // Front and center, with a little room around it.
    layer.gain = Math.max(layer.gain ?? 0.8, 0.85)
    layer.pan = 0
    layer.low = 0
    layer.high = 0
    layer.space = Math.max(layer.space || 0, 0.18)
    layer.echo = Math.max(layer.echo || 0, 0.06)
    await followVocal(layer)
    refreshMix(layer)
    rememberSong()
    renderTracks()
    playFromVocal(layer)
    return { text: "Your vocal has a studio sound: hiss and rumble out, clearer words, softer S sounds, and an even level, with a little room around it. Undo takes it off." }
  })
}

// ---------------------------------------------------------------------------
// Room in the music

async function phrasesOf(layer) {
  const { audio, rate } = takeAudio(layer)
  const found = await engine.call("vocalPhrases", samplesOf(audio), rate)
  const start = layer.range?.start || 0
  const end = Math.min(spanSeconds(), layer.range ? layer.range.end : spanSeconds())
  const length = audio.duration
  const out = []
  const loops = length > 0.05 && length < end - start - 0.05
  for (let at = start; at < end - 0.01; at += length) {
    for (const phrase of found) if (at + phrase.start < end) out.push({ start: Math.round((at + phrase.start) * 1000) / 1000, end: Math.round(Math.min(end, at + phrase.end) * 1000) / 1000 })
    if (!loops) break
  }
  return out.slice(0, 600)
}

function layerLevel(layer) {
  const buffer = buffers.get(layer.id + ":audio")
  if (!buffer) return 0
  const data = buffer.getChannelData(0)
  let sum = 0
  let n = 0
  for (let i = 0; i < data.length; i += 61) {
    sum += data[i] * data[i]
    n++
  }
  return Math.sqrt(sum / Math.max(1, n))
}

async function makeRoom(layer) {
  return vocalStep("Making room in the music for your voice…", async () => {
    const phrases = await phrasesOf(layer)
    if (!phrases.length) return { text: `I couldn't hear singing in ${layer.name}.`, warn: true }
    snapshot()
    for (const item of state.layers) if (item.lead && item.id !== layer.id) item.lead = false
    layer.lead = true
    layer.phrases = phrases
    const band = state.layers.filter((item) => item !== layer && !item.singer && buffers.get(item.id + ":audio"))
    for (const item of band) {
      const kind = kindOf(item)
      item.carve = kind === "drums" ? 1 : kind === "bass" ? 0 : 3
      item.duck = kind === "drums" ? 0.25 : kind === "bass" ? 0.3 : 0.7
    }
    // The voice rides on top: about as loud as the whole band together.
    const voice = layerLevel(layer) * (layer.gain ?? 0.8)
    const rest = Math.sqrt(band.filter(audible).reduce((sum, item) => sum + (layerLevel(item) * (item.gain ?? 0.8)) ** 2, 0))
    let changed = ""
    if (voice > 0 && rest > voice / 0.9) {
      const want = rest * 0.9
      const up = Math.min(1, (layer.gain ?? 0.8) * (want / voice))
      const reached = layerLevel(layer) * up
      layer.gain = Math.round(up * 100) / 100
      if (reached < want) {
        const down = Math.max(0.6, reached / want)
        for (const item of band) item.gain = Math.round((item.gain ?? 0.8) * down * 100) / 100
        if (down < 0.97) changed = ` I turned the band down ${Math.round((1 - down) * 100)}% so you're on top.`
      }
    }
    rememberSong()
    renderTracks()
    playFromVocal(layer)
    return { text: `Made room for your voice: while you sing, the music steps back a little and leaves space where your words are.${changed} Undo puts it back.` }
  })
}

function noRoom(layer) {
  snapshot()
  layer.lead = false
  for (const item of state.layers) {
    item.carve = 0
    item.duck = 0
  }
  rememberSong()
  renderTracks()
  if (playing) play(songSeconds(ac().currentTime))
  return { text: "The music doesn't step back for the vocal now. Undo turns it on again." }
}

// ---------------------------------------------------------------------------
// Background singers

// Your melody, the way backing singers would sing it: no scoops or tiny
// notes, each note held into the next.
function singable(melody) {
  const notes = (melody || []).filter((note) => note.dur >= 0.14).map((note) => ({ ...note }))
  const out = []
  for (const note of notes) {
    const last = out[out.length - 1]
    if (last && last.midi === note.midi && note.time - (last.time + last.dur) < 0.15) {
      last.dur = note.time + note.dur - last.time
      continue
    }
    if (last && note.time - (last.time + last.dur) < 0.25) last.dur = Math.max(last.dur, note.time - last.time - 0.02)
    out.push(note)
  }
  return out
}

// The part the band's chords come from, so the oohs sing the same chords.
function chordSource() {
  const parts = state.layers.filter((layer) => layer.make && !layer.singer && ["section", "chords"].includes(layer.make.play) && layer.make.sourceId && state.layers.some((item) => item.id === layer.make.sourceId))
  const pick = parts.find((layer) => layer.make.family === "voices") || parts.find((layer) => layer.make.family === "strings") || parts[0]
  return pick ? { make: pick.make, source: state.layers.find((item) => item.id === pick.make.sourceId) } : null
}

async function singerAudio(lead, kind) {
  const { rate, loop, pass, length } = takeAudio(lead)
  const songLength = Math.round(Math.max(spanSeconds(), length / rate) * rate)
  if (kind === "doubleL" || kind === "doubleR") {
    // You again, like a second take: a few hundredths of a second behind,
    // drifting a little in time (and so in pitch) the way a real double does.
    const samples = doubleTake(pass, rate, kind === "doubleL" ? { base: 0.022, depth: 0.006, speed: 0.37, seed: 1 } : { base: 0.031, depth: 0.007, speed: 0.29, seed: 2 })
    const full = loop ? tileTo(samples, length) : samples
    return { buffer: loopedBuffer(full, rate, loop), peaks: peaksFromSamples(full) }
  }
  const study = await studyVocal(lead)
  let choice
  let source = null
  if (kind === "oohs" || kind === "answers") {
    const band = chordSource()
    const instrument = kind === "oohs" ? "voice-oohs" : "choir-aahs"
    if (band) {
      choice = { ...band.make, family: "voices", instrument, play: "section", rhythm: "held", variant: kind === "answers" ? 1 : 0, voicing: kind === "answers" ? 1 : 0, busy: 0 }
      for (const key of ["kinds", "kit", "fills", "octave", "shift", "melody", "hits"]) delete choice[key]
      source = band.source
    } else {
      const melody = singable(study.melody)
      if (!melody.length) return null
      choice = { family: "voices", instrument, play: "section", rhythm: "held", melody, key: study.key, pass: pass.length / rate, total: pass.length / rate, loop: false, beat: 60 / (state.bpm || 92), phase: 0 }
    }
  } else {
    const melody = singable(study.melody)
    if (!melody.length) return null
    const key = study.key
    const keyed = { root: key.root, minor: key.minor }
    const steps = { third: 2, high: 4, low: 2 }[kind]
    const shifted = melody.map((note) => {
      let midi = SongbirdMusic.scaleStep(note.midi, steps, keyed)
      if (kind === "low") midi -= 12
      return { ...note, midi }
    })
    choice = { family: "voices", instrument: kind === "low" ? "choir-aahs" : "voice-oohs", play: "solo", rhythm: "played", melody: shifted, key: keyed, pass: pass.length / rate, total: pass.length / rate, loop: false, beat: 60 / (state.bpm || 92), phase: 0 }
  }
  const made = await buildPart(choice, source)
  if (made.error) return null
  let samples = made.samples
  if (made.rate !== rate) samples = resampleTo(samples, made.rate, rate, Math.round(samples.length * rate / made.rate))
  samples = fitLength(samples, songLength, 0)
  const start = lead.range?.start || 0
  // Melody singers come in where you sing; they start where your take starts.
  if (choice.play === "solo" && start > 0) {
    const late = new Float32Array(samples.length)
    late.set(samples.subarray(0, Math.max(0, samples.length - Math.round(start * rate))), Math.round(start * rate))
    samples = late
  }
  let gaps = null
  if (kind === "answers") {
    // Answers rest while you sing and sing in the spaces between your lines.
    const phrases = lead.phrases?.length ? lead.phrases : await phrasesOf(lead)
    gaps = phrases.map((phrase) => ({ start: Math.max(0, phrase.start - 0.15), end: phrase.end + 0.35 }))
  }
  return { buffer: loopedBuffer(samples, rate, 0), peaks: peaksFromSamples(samples), gaps }
}

function doubleTake(samples, rate, { base, depth, speed, seed }) {
  const out = new Float32Array(samples.length)
  // A slow, uneven drift: two slow waves that never line up.
  const w1 = (2 * Math.PI * speed) / rate
  const w2 = (2 * Math.PI * speed * 0.61) / rate
  for (let i = 0; i < out.length; i++) {
    const delay = (base + depth * (0.6 * Math.sin(w1 * i + seed) + 0.4 * Math.sin(w2 * i + seed * 2.3))) * rate
    const at = i - delay
    const index = Math.floor(at)
    if (index < 0 || index + 1 >= samples.length) continue
    const frac = at - index
    out[i] = samples[index] * (1 - frac) + samples[index + 1] * frac
  }
  return out
}

function resampleTo(samples, from, to, length) {
  const ratio = from / to
  const out = new Float32Array(length)
  for (let i = 0; i < out.length; i++) {
    const at = i * ratio
    const index = Math.floor(at)
    const frac = at - index
    out[i] = (samples[index] || 0) * (1 - frac) + (samples[index + 1] || 0) * frac
  }
  return out
}

async function useIdea(lead, id, where = vocal.where) {
  const idea = SINGER_IDEAS[id]
  if (!idea) return { text: "Pick one of the ideas.", warn: true }
  return vocalStep(`Bringing in ${idea.name.toLowerCase()}…`, async () => {
    const made = []
    for (const kind of idea.kinds) {
      vocal.working = `Bringing in ${SINGER_MIX[kind].name.toLowerCase()}…`
      vocalSay(vocal.working)
      const audio = await singerAudio(lead, kind).catch((error) => {
        console.error("Singer failed:", error)
        return null
      })
      if (audio) made.push({ kind, ...audio })
    }
    if (!made.length) return { text: "I couldn't hear clear enough notes to sing along with. Try Just you, doubled.", warn: true }
    snapshot()
    const old = singersOf(lead)
    state.layers = state.layers.filter((item) => !old.includes(item))
    const choruses = where !== "song" && chorusSections().length ? chorusGaps() : []
    const at = state.layers.indexOf(lead) + 1
    const added = made.map(({ kind, buffer, peaks, gaps }) => {
      const mix = SINGER_MIX[kind]
      const id = uid()
      buffers.set(id + ":audio", buffer)
      const own = kind.startsWith("double")
      return {
        id,
        name: mix.name,
        sound: own ? "Your voice" : "Backing singers",
        from: `${idea.name}${choruses.length ? " · in the choruses" : ""}`,
        family: "voices",
        generated: true,
        singer: kind,
        sourceId: lead.id,
        color: "#b44dff",
        peaks,
        gain: Math.round((lead.gain ?? 0.8) * mix.gain * 100) / 100,
        pan: mix.pan,
        low: own ? -3 : -1,
        high: own ? -4 : -2,
        space: own ? 0.3 : 0.45,
        echo: 0,
        mute: false,
        solo: false,
        live: true,
        loop: own ? lead.loop : false,
        lengthSec: own ? lead.lengthSec : undefined,
        range: own && lead.range ? { ...lead.range } : undefined,
        choruses: choruses.map((gap) => ({ ...gap })),
        gaps: mergeGaps([...choruses, ...(gaps || [])].map((gap) => ({ ...gap }))),
      }
    })
    state.layers.splice(at, 0, ...added)
    lead.idea = id
    vocal.idea = id
    rememberSong()
    renderTracks()
    playFromVocal(lead, choruses.length ? chorusSections()[0].start : null)
    const missed = made.length < idea.kinds.length ? " One voice couldn't follow your notes, so it's left out." : ""
    return { text: `${idea.name}: ${added.map((item) => item.name.toLowerCase()).join(", ")}${choruses.length ? ", in the choruses" : ""}.${missed} Tap another idea to compare, or Undo to go back.` }
  })
}

function removeSingers(lead) {
  const old = singersOf(lead)
  if (!old.length) return { text: "There are no background singers yet." }
  snapshot()
  state.layers = state.layers.filter((item) => !old.includes(item))
  lead.idea = null
  vocal.idea = null
  rememberSong()
  renderTracks()
  return { text: "Took the background singers out. Undo brings them back." }
}

// ---------------------------------------------------------------------------
// All of it

async function vocalAll(lead) {
  if (vocal.working || state.transforming) return { text: "Still working on the last one." }
  const study = await studyVocal(lead)
  const best = ideaOrder(study)[0]
  const mark = undoStack.length
  snapshot([lead.id])
  const said = []
  const steps = [
    () => fitVocal(lead, vocal.tight),
    () => (lead.shine ? null : shineVocal(lead)),
    () => makeRoom(lead),
    () => useIdea(lead, best, vocal.where),
  ]
  for (const step of steps) {
    const reply = await step()
    if (reply?.warn) said.push(reply.text)
  }
  undoStack.splice(mark + 1)
  const text = `Your lines are slid into place, your vocal has a studio sound and sits on top of the music, with ${SINGER_IDEAS[best].name.toLowerCase()} behind you${chorusSections().length && vocal.where !== "song" ? " in the choruses" : ""}. Try the other singer ideas to compare.${said.length ? ` ${said.join(" ")}` : ""} One Undo takes it all back.`
  return { text }
}

function playFromVocal(layer, at) {
  if (at != null) return play(Math.max(0, at - 1))
  const first = layer.phrases?.[0]?.start ?? layer.range?.start ?? 0
  play(Math.max(0, first - 1))
}

// ---------------------------------------------------------------------------
// Said in Magic

async function vocalRequest(text) {
  // “Less background vocals” is about a part's amount, not your voice.
  if (/\b(less|more|fewer|too much|turn (up|down)|louder|quieter)\b/.test(text)) return null
  if (!/(vocal|voice|singing|my sing|singer|harmon|backing|background (singer|vocal|voice)|oohs?\b|call and response|answer)/.test(text)) return null
  const lead = leadVocal()
  // No vocal of yours yet: “add background vocals” still adds a choir.
  if (!lead) return null
  const asksSingers = /(background|backing) (singer|vocal|voice)s?|harmon|double|octave|oohs?\b|call and response|answer|gospel|choir|sing(ers)? with me/.test(text)
  const asksTime = /(timing|on (the )?beat|in time|line (it |them )?up|fit|sync|late|early|behind|ahead|slide)/.test(text)
  const asksRoom = /(blend|sit|mix|hear (my|the) (voice|vocal)|on top|over the (music|band)|buried|drown|cut through|room for)/.test(text)
  const asksShine = /(enhance|shine|studio|better|professional|polish|clean|clear|improve|pro\b|radio)/.test(text)
  if (!asksSingers && !asksTime && !asksRoom && !asksShine) return null
  const where = /whole song|everywhere|all the way|the whole/.test(text) ? "song" : vocal.where
  if (asksSingers) {
    const study = await studyVocal(lead)
    const idea = /double/.test(text) ? "doubles" : /harmon|octave|third|fifth/.test(text) ? "harmony" : /answer|call and response|gospel|choir/.test(text) ? "gospel" : /oohs?\b/.test(text) ? "soul" : ideaOrder(study)[0]
    return useIdea(lead, idea, where)
  }
  if (asksTime) return fitVocal(lead, /tight|exact|perfect|snap/.test(text))
  if (asksRoom && !asksShine) return makeRoom(lead)
  const shine = lead.shine ? null : await shineVocal(lead)
  const room = await makeRoom(lead)
  return { text: `${shine ? `${shine.text.replace(/ Undo takes it off\.$/, "")} ` : ""}${room.text}` }
}

// ---------------------------------------------------------------------------
// The panel

function vocalCard() {
  const lead = leadVocal()
  if (!lead) return ""
  return `<button class="song-card vocal-card" data-vocal-open="${lead.id}">${ms("record_voice_over")}<span><b>Make my vocal shine</b><small>Songbird listens to your singing and suggests timing, sound, and background singers that fit.</small></span>${ms("arrow_forward")}</button>`
}

function vocalPanel(head) {
  const lead = leadVocal()
  if (!lead) {
    return `${head("Your vocal")}
      <p class="hint">Record yourself singing, then come back here. Songbird listens and suggests what fits your voice.</p>
      ${filledButton(`${ms("mic")}Record my vocal`, `data-action="panel" data-panel="record"`)}`
  }
  const study = vocal.studyFor === buffers.get(lead.id + ":audio") ? vocal.study : null
  if (!study && !vocal.working) setTimeout(() => {
    studyVocal(lead).then(() => state.panel === "vocal" && renderInspector()).catch(() => {})
  }, 0)
  const busy = vocal.working || state.transforming ? "disabled" : ""
  const takes = vocalTakes()
  const singers = singersOf(lead)
  const hasChorus = chorusSections().length > 0
  const where = vocal.where || (hasChorus ? "chorus" : "song")
  const using = singers.length ? lead.idea || vocal.idea : null
  const done = (on) => (on ? `<span class="done-tag">${ms("check")}Done</span>` : "")
  const order = study ? ideaOrder(study) : ["soul", "gospel", "harmony", "doubles"]
  return `${head("Your vocal")}
    ${takes.length > 1 ? `<div class="choices" role="group" aria-label="Which vocal">${takes.map((item) => filterChip(esc(item.name), `data-vocal-pick="${item.id}" ${busy}`, item.id === lead.id)).join("")}</div>` : ""}
    <div class="vocal-heard">${ms("hearing")}<p>${study ? esc(heardLine(study)) : "Listening to your singing…"}</p></div>
    ${filledButton(`${ms("auto_awesome")}${vocal.working ? esc(vocal.working) : "Do it all"}`, `data-vocal-do="all" ${busy}`)}
    <p class="hint">Slides your lines into place, gives your voice a studio sound, makes room in the music, and brings in the singers that fit you best. One Undo takes it all back.</p>
    <p class="hint vocal-note" id="vocal-note" role="status">${esc(vocal.said)}</p>

    <section class="vocal-step">
      <h3 class="magic-h">Background singers ${done(singers.length)}</h3>
      <p class="hint">Picked for how you sing. Tap one to hear it with the song; tap another to compare.</p>
      <div class="idea-list">
        ${order.map((id, index) => {
          const idea = SINGER_IDEAS[id]
          const on = using === id
          return `<button class="idea-card${on ? " on" : ""}" data-vocal-idea="${id}" ${busy} aria-pressed="${on}">
            <span class="idea-top"><b>${esc(idea.name)}</b>${index === 0 && study ? `<span class="idea-tag">Best fit</span>` : ""}${on ? `<span class="idea-tag on">${ms("volume_up")}In use</span>` : ""}</span>
            <small>${esc(idea.line)}</small>
          </button>`
        }).join("")}
      </div>
      ${hasChorus ? `<div class="choices" role="group" aria-label="Where they sing">
        ${filterChip("In the choruses", `data-vocal-where="chorus" ${busy}`, where === "chorus")}
        ${filterChip("The whole song", `data-vocal-where="song" ${busy}`, where === "song")}
      </div>` : ""}
      ${singers.length ? outlinedButton(`${ms("delete")}Take them out`, `data-vocal-do="nosingers" ${busy}`) : ""}
    </section>

    <section class="vocal-step">
      <h3 class="magic-h">On the beat ${done(lead.tight)}</h3>
      <p class="hint">Each line you sang slides, whole, to where it fits the beat: on the one, or a beat or half beat from it. Nothing inside your singing is stretched.</p>
      <div class="choices">
        ${filterChip("Also tighten words", `data-vocal-tight ${busy}`, vocal.tight)}
      </div>
      ${outlinedButton(`${ms("timer")}Slide my lines into place`, `data-vocal-do="fit" ${busy}`)}
    </section>

    <section class="vocal-step">
      <h3 class="magic-h">Studio sound ${done(lead.shine)}</h3>
      <p class="hint">Hiss and rumble out, clearer words, softer S sounds, and an even level so every word is heard.</p>
      ${outlinedButton(`${ms("wand_stars")}Give it a studio sound`, `data-vocal-do="shine" ${busy || (lead.shine ? "disabled" : "")}`)}
    </section>

    <section class="vocal-step">
      <h3 class="magic-h">Sit on top of the music ${done(lead.lead)}</h3>
      <p class="hint">While you sing, the music steps back a little and leaves space where your words are.</p>
      ${lead.lead ? outlinedButton(`${ms("close")}Stop making room`, `data-vocal-do="noroom" ${busy}`) : outlinedButton(`${ms("spatial_audio")}Make room for my voice`, `data-vocal-do="room" ${busy}`)}
    </section>`
}

function openVocal(id) {
  if (id) {
    vocal.layerId = id
    state.selected = id
  }
  setPanel("vocal")
  renderTracks()
}

async function runVocal(action, idea) {
  const lead = leadVocal()
  if (!lead) return
  if (!vocal.where) vocal.where = chorusSections().length ? "chorus" : "song"
  let reply
  if (action === "all") reply = await vocalAll(lead)
  else if (action === "idea") reply = await useIdea(lead, idea, vocal.where)
  else if (action === "fit") reply = await fitVocal(lead, vocal.tight)
  else if (action === "shine") reply = await shineVocal(lead)
  else if (action === "room") reply = await makeRoom(lead)
  else if (action === "noroom") reply = noRoom(lead)
  else if (action === "nosingers") reply = removeSingers(lead)
  if (reply?.text) {
    vocalSay(reply.text)
    $("save-status").textContent = reply.text
  }
  renderInspector()
}

document.body.addEventListener("click", (event) => {
  const node = event.target.closest?.("[data-vocal-open],[data-vocal-pick],[data-vocal-do],[data-vocal-tight],[data-vocal-idea],[data-vocal-where]")
  if (!node || node.disabled) return
  const d = node.dataset
  if (d.vocalOpen != null) return openVocal(d.vocalOpen)
  if (d.vocalPick) {
    vocal.layerId = d.vocalPick
    state.selected = d.vocalPick
    renderTracks()
  }
  if (d.vocalTight != null) vocal.tight = !vocal.tight
  if (d.vocalWhere) vocal.where = d.vocalWhere
  if (d.vocalIdea) {
    void runVocal("idea", d.vocalIdea)
    return
  }
  if (d.vocalDo) {
    void runVocal(d.vocalDo)
    return
  }
  renderInspector()
})
